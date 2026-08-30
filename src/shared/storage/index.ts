/**
 * Storage Abstraction Layer untuk Properti360
 *
 * Mendukung 2 driver:
 * - local  : simpan ke disk VPS (Coolify persistent volume), diserve via /uploads/[...path]
 * - s3     : S3-compatible (Biznet Gio Neo Object Storage) via @aws-sdk/client-s3
 *
 * Penggunaan:
 *   import { getStorage, generateThumbnail } from "@/shared/storage";
 *   const storage = getStorage();
 *   const thumb = await generateThumbnail(fileBuffer);
 *   const url = await storage.upload(thumb, "listings/abc.jpg", "image/webp");
 *   // url => "/uploads/listings/<uuid>.webp"  (local)  atau  "https://endpoint/bucket/listings/..." (s3)
 *
 * ENV:
 *   STORAGE_DRIVER        = "local" | "s3"          (default: "local")
 *   STORAGE_LOCAL_PATH    = "./storage/uploads"      (default)
 *   STORAGE_S3_ENDPOINT   = "https://...gio..."      (wajib jika driver=s3)
 *   STORAGE_S3_ACCESS_KEY = "..."                    (wajib jika driver=s3)
 *   STORAGE_S3_SECRET_KEY = "..."                    (wajib jika driver=s3)
 *   STORAGE_S3_BUCKET     = "properti360"            (wajib jika driver=s3)
 *   STORAGE_S3_REGION     = "ap-southeast-1"         (opsional, default ap-southeast-1)
 *   STORAGE_S3_FORCE_PATH_STYLE = "true"/"false"     (opsional, default true untuk S3-compatible)
 */

import path from "path";
import fs from "fs/promises";
import { randomUUID } from "crypto";
import sharp from "sharp";

// Lazy import untuk S3 agar tidak membebani bundle saat driver=local
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let S3Client: any;
let PutObjectCommand: any;
let DeleteObjectCommand: any;
let GetObjectCommand: any;

async function loadS3SDK() {
  if (S3Client) return;
  const sdk = await import("@aws-sdk/client-s3");
  S3Client = sdk.S3Client;
  PutObjectCommand = sdk.PutObjectCommand;
  DeleteObjectCommand = sdk.DeleteObjectCommand;
  GetObjectCommand = sdk.GetObjectCommand;
}

// ---------------------------------------------------------------------------
// Types & Interface
// ---------------------------------------------------------------------------

export type StorageDriver = "local" | "s3";

export interface StorageAdapter {
  /**
   * Upload file ke storage.
   * @param file - Buffer isi file
   * @param filePath - path/ prefix tujuan, mis: "listings/123/foto.jpg" atau "avatars/user-1.jpg".
   *                   Nama file akan diganti UUID untuk hindari collision (folder tetap dipertahankan).
   * @param mimeType - MIME type file, mis: "image/jpeg"
   * @returns public URL/path yang bisa dipakai di <img src>, mis: "/uploads/listings/<uuid>.jpg"
   */
  upload(file: Buffer, filePath: string, mimeType: string): Promise<string>;
  /** Hapus file dari storage berdasarkan path yang dikembalikan upload() atau getUrl(). */
  delete(filePath: string): Promise<void>;
  /** Dapatkan public URL dari internal storage path. */
  getUrl(filePath: string): string;
}

// ---------------------------------------------------------------------------
// Helpers internal
// ---------------------------------------------------------------------------

const MIME_EXT_MAP: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "image/heic": ".heic",
  "image/heif": ".heif",
  "image/svg+xml": ".svg",
  "application/pdf": ".pdf",
};

function extFromMime(mimeType: string): string {
  const lower = mimeType.toLowerCase().split(";")[0].trim();
  return MIME_EXT_MAP[lower] ?? "";
}

function sanitizeRelativePath(p: string): string {
  // Hilangkan leading slash, normalisasi, dan cegah directory traversal
  let cleaned = p.replace(/^\/+/, "").trim();
  // Normalize pakai posix supaya konsisten di Windows/Linux
  cleaned = path.posix.normalize(cleaned);
  // Tolak traversal
  if (cleaned.startsWith("..") || cleaned.includes("../") || path.isAbsolute(cleaned)) {
    throw new Error(`Invalid storage path: "${p}" (path traversal detected)`);
  }
  // Hilangkan prefix "uploads/" jika caller tidak sengaja mengirim full URL
  if (cleaned.startsWith("uploads/")) cleaned = cleaned.slice("uploads/".length);
  return cleaned;
}

function uniqueFileName(originalPath: string, mimeType: string): string {
  const sanitized = sanitizeRelativePath(originalPath);
  const dir = path.posix.dirname(sanitized);
  const extFromPath = path.posix.extname(sanitized); // mis: ".jpg"
  const extFromMimeType = extFromMime(mimeType);
  // Prioritaskan ekstensi dari mimeType agar Content-Type konsisten dengan isi file
  // (mis. buffer WebP + hint "foto.jpg" tetap menghasilkan .webp).
  // Fallback ke ext dari path jika mime tidak dikenal.
  const ext = extFromMimeType || extFromPath || "";
  const uuid = randomUUID();
  const fileName = `${uuid}${ext}`;
  if (dir === "." || dir === "") return fileName;
  return path.posix.join(dir, fileName);
}

export function resolveLocalBasePath(): string {
  const raw = process.env.STORAGE_LOCAL_PATH || "./storage/uploads";
  // Jika relative, resolve terhadap process.cwd() (root project)
  if (path.isAbsolute(raw)) return raw;
  return path.resolve(process.cwd(), raw);
}

// ---------------------------------------------------------------------------
// LocalDiskStorage
// ---------------------------------------------------------------------------

export class LocalDiskStorage implements StorageAdapter {
  private basePath: string;

  constructor(basePath?: string) {
    this.basePath = basePath ?? resolveLocalBasePath();
  }

  /**
   * Upload buffer ke disk. Nama file di-UUID-kan, folder dipertahankan.
   * @returns URL relatif "/uploads/<path>"
   */
  async upload(file: Buffer, filePath: string, mimeType: string): Promise<string> {
    const uniquePath = uniqueFileName(filePath, mimeType);
    const absolutePath = path.join(this.basePath, ...uniquePath.split("/"));

    // Pastikan folder ada
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, file);

    return this.getUrl(uniquePath);
  }

  async delete(filePath: string): Promise<void> {
    const relative = this.toRelativePath(filePath);
    const absolutePath = path.join(this.basePath, ...relative.split("/"));
    // Cegah delete di luar basePath (defense in depth)
    const normalizedBase = path.resolve(this.basePath);
    const normalizedTarget = path.resolve(absolutePath);
    if (!normalizedTarget.startsWith(normalizedBase)) {
      throw new Error(`Refusing to delete outside storage base: ${filePath}`);
    }
    try {
      await fs.unlink(absolutePath);
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException).code;
      // Idempotent: file sudah tidak ada dianggap sukses
      if (code !== "ENOENT") throw err;
    }
  }

  getUrl(filePath: string): string {
    const relative = this.toRelativePath(filePath);
    // encodeURI tiap segment untuk handle spasi/unicode, tapi jangan encode "/"
    const encoded = relative
      .split("/")
      .map((s) => encodeURIComponent(s))
      .join("/");
    return `/uploads/${encoded}`;
  }

  /** Normalisasi input (bisa berupa "/uploads/..." atau "listings/...") jadi relative path murni. */
  private toRelativePath(p: string): string {
    // Jika sudah URL /uploads/..., strip prefix
    let cleaned = p.trim();
    // Jika full URL http(s)://... jangan di-handle di sini — anggap itu dari S3, return as-is untuk delete tidak relevan
    if (/^https?:\/\//i.test(cleaned)) {
      // Extract pathname untuk local — fallback ambil last part
      try {
        const u = new URL(cleaned);
        cleaned = u.pathname;
      } catch {
        // ignore
      }
    }
    return sanitizeRelativePath(cleaned);
  }

  /** Expose absolute base path — berguna untuk route handler. */
  getBasePath(): string {
    return this.basePath;
  }
}

// ---------------------------------------------------------------------------
// S3CompatibleStorage (skeleton — siap pakai, tinggal isi ENV)
// ---------------------------------------------------------------------------

export interface S3Config {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  region?: string;
  forcePathStyle?: boolean;
}

export class S3CompatibleStorage implements StorageAdapter {
  private config: S3Config;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client?: any;

  constructor(config?: Partial<S3Config>) {
    this.config = {
      endpoint: config?.endpoint ?? process.env.STORAGE_S3_ENDPOINT ?? "",
      accessKeyId: config?.accessKeyId ?? process.env.STORAGE_S3_ACCESS_KEY ?? "",
      secretAccessKey: config?.secretAccessKey ?? process.env.STORAGE_S3_SECRET_KEY ?? "",
      bucket: config?.bucket ?? process.env.STORAGE_S3_BUCKET ?? "",
      region: config?.region ?? process.env.STORAGE_S3_REGION ?? "ap-southeast-1",
      forcePathStyle:
        config?.forcePathStyle ??
        (process.env.STORAGE_S3_FORCE_PATH_STYLE
          ? process.env.STORAGE_S3_FORCE_PATH_STYLE === "true"
          : true),
    };

    if (!this.config.endpoint || !this.config.accessKeyId || !this.config.secretAccessKey || !this.config.bucket) {
      // Jangan throw di constructor agar factory tetap bisa dipanggil di build time,
      // tapi beri warning. Throw akan dilakukan saat upload/delete dipanggil.
      console.warn(
        "[S3CompatibleStorage] ENV belum lengkap. " +
          "Pastikan STORAGE_S3_ENDPOINT, STORAGE_S3_ACCESS_KEY, STORAGE_S3_SECRET_KEY, STORAGE_S3_BUCKET terisi.",
      );
    }
  }

  private assertConfig() {
    if (!this.config.endpoint || !this.config.bucket || !this.config.accessKeyId || !this.config.secretAccessKey) {
      throw new Error(
        "S3 config tidak lengkap. Isi STORAGE_S3_ENDPOINT, STORAGE_S3_ACCESS_KEY, STORAGE_S3_SECRET_KEY, STORAGE_S3_BUCKET",
      );
    }
  }

  private async getClient() {
    this.assertConfig();
    if (this.client) return this.client;
    await loadS3SDK();
    this.client = new S3Client({
      region: this.config.region,
      endpoint: this.config.endpoint,
      forcePathStyle: this.config.forcePathStyle,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    });
    return this.client;
  }

  async upload(file: Buffer, filePath: string, mimeType: string): Promise<string> {
    const client = await this.getClient();
    const key = uniqueFileName(filePath, mimeType);

    await client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: file,
        ContentType: mimeType,
        // Biarkan public-read diatur via bucket policy di Biznet Gio.
        // Jika butuh ACL explicit, uncomment:
        // ACL: "public-read",
      }),
    );

    return this.getUrl(key);
  }

  async delete(filePath: string): Promise<void> {
    const client = await this.getClient();
    const key = this.extractKey(filePath);
    await client.send(
      new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      }),
    );
  }

  getUrl(filePath: string): string {
    const key = this.extractKey(filePath);
    // Endpoint Biznet Gio biasanya: https://<xxx>.gio.id  atau  https://is3.cloudhost.id
    // forcePathStyle=true => https://endpoint/bucket/key
    // forcePathStyle=false => https://bucket.endpoint/key
    const endpoint = this.config.endpoint.replace(/\/+$/, "");
    if (!endpoint) return `/${key}`; // fallback saat env belum terisi (build time)

    if (this.config.forcePathStyle) {
      return `${endpoint}/${this.config.bucket}/${key
        .split("/")
        .map((s) => encodeURIComponent(s))
        .join("/")}`;
    } else {
      // virtual-hosted-style
      try {
        const url = new URL(endpoint);
        return `${url.protocol}//${this.config.bucket}.${url.host}/${key
          .split("/")
          .map((s) => encodeURIComponent(s))
          .join("/")}`;
      } catch {
        return `${endpoint}/${this.config.bucket}/${key}`;
      }
    }
  }

  private extractKey(p: string): string {
    let cleaned = p.trim();
    // Jika sudah full URL S3, extract key-nya
    if (/^https?:\/\//i.test(cleaned)) {
      try {
        const url = new URL(cleaned);
        // path-style: /bucket/key  -> hilangkan /bucket/
        // virtual-hosted: /key     -> ambil pathname
        let pathname = url.pathname.replace(/^\/+/, "");
        const bucketPrefix = `${this.config.bucket}/`;
        if (pathname.startsWith(bucketPrefix)) pathname = pathname.slice(bucketPrefix.length);
        cleaned = pathname;
      } catch {
        // ignore, treat as raw path
      }
    }
    // Hilangkan prefix uploads/ jika ada
    return sanitizeRelativePath(cleaned);
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

let cachedAdapter: StorageAdapter | null = null;
let cachedDriver: string | null = null;

/**
 * Factory: baca STORAGE_DRIVER ("local" | "s3") dan return adapter yang sesuai.
 * Di-cache per-process agar tidak buat S3Client berulang.
 * Untuk testing, panggil getStorage(true) untuk force re-create.
 */
export function getStorage(forceNew = false): StorageAdapter {
  const driver = (process.env.STORAGE_DRIVER as StorageDriver | undefined) ?? "local";

  if (!forceNew && cachedAdapter && cachedDriver === driver) {
    return cachedAdapter;
  }

  let adapter: StorageAdapter;
  if (driver === "s3") {
    adapter = new S3CompatibleStorage();
  } else if (driver === "local") {
    adapter = new LocalDiskStorage();
  } else {
    console.warn(`[storage] Unknown STORAGE_DRIVER="${driver}", fallback ke "local".`);
    adapter = new LocalDiskStorage();
  }

  cachedAdapter = adapter;
  cachedDriver = driver;
  return adapter;
}

/** Helper untuk reset cache — berguna di test. */
export function __resetStorageCache() {
  cachedAdapter = null;
  cachedDriver = null;
}

// ---------------------------------------------------------------------------
// Thumbnail / Image Optimization Helpers (sharp)
// ---------------------------------------------------------------------------

export interface ThumbnailOptions {
  /** Lebar maksimal thumbnail (default 800). Tinggi auto menyesuaikan aspect ratio. */
  maxWidth?: number;
  /** Kualitas WebP 0-100 (default 80). */
  quality?: number;
  /** Jika true, jangan upscale gambar kecil (default true). */
  withoutEnlargement?: boolean;
}

/**
 * Generate thumbnail WebP dari buffer gambar apapun.
 * - Resize lebar maksimal 800px (tinggi proporsional), `withoutEnlargement: true`
 * - Kompres ke WebP (quality 80 default)
 * - Return Buffer WebP siap upload via storage adapter
 *
 * @example
 *   const thumb = await generateThumbnail(originalBuffer);
 *   const url = await getStorage().upload(thumb, "listings/123/thumb.webp", "image/webp");
 */
export async function generateThumbnail(
  buffer: Buffer,
  options: ThumbnailOptions = {},
): Promise<Buffer> {
  const { maxWidth = 800, quality = 80, withoutEnlargement = true } = options;

  return sharp(buffer)
    .rotate() // auto-orient berdasarkan EXIF
    .resize({
      width: maxWidth,
      withoutEnlargement,
      fit: "inside",
    })
    .webp({ quality })
    .toBuffer();
}

/**
 * Optimasi umum: jika input sudah WebP/sharp-compatible, tetap resize+webp.
 * Untuk file non-image (mis. pdf), kembalikan buffer asli tanpa proses.
 */
export async function optimizeImage(
  buffer: Buffer,
  mimeType: string,
  options: ThumbnailOptions = {},
): Promise<{ buffer: Buffer; mimeType: string; extension: string }> {
  if (!mimeType.startsWith("image/")) {
    return { buffer, mimeType, extension: extFromMime(mimeType) || path.posix.extname(mimeType) || "" };
  }
  const optimized = await generateThumbnail(buffer, options);
  return { buffer: optimized, mimeType: "image/webp", extension: ".webp" };
}

/**
 * Convenience: generate thumbnail lalu langsung upload via storage adapter.
 * Thumbnail selalu disimpan sebagai .webp terlepas dari mimeType asli.
 *
 * @param file - buffer file asli
 * @param filePath - path tujuan (ekstensi akan diganti .webp otomatis)
 * @param options - opsi thumbnail
 * @returns { url, key } — url public, key internal
 */
export async function uploadThumbnail(
  file: Buffer,
  filePath: string,
  options: ThumbnailOptions = {},
): Promise<string> {
  const thumb = await generateThumbnail(file, options);
  // Paksa ekstensi .webp: ganti ext di filePath jadi .webp sebelum UUID
  const webpPath = filePath.replace(/\.[a-zA-Z0-9]+$/, "") + ".webp";
  // Jika tidak ada ext, tambahkan .webp
  const finalHint = path.posix.extname(webpPath) ? webpPath : `${filePath}.webp`;
  const storage = getStorage();
  return storage.upload(thumb, finalHint, "image/webp");
}

/**
 * Upload gambar original + thumbnail sekaligus (2 file).
 * Berguna untuk listing properti: simpan original (opsional) dan thumb 800px.
 */
export async function uploadImageWithThumbnail(
  file: Buffer,
  filePath: string,
  mimeType: string,
  thumbOptions: ThumbnailOptions = {},
): Promise<{ originalUrl: string; thumbnailUrl: string }> {
  const storage = getStorage();
  const [originalUrl, thumbnailUrl] = await Promise.all([
    storage.upload(file, filePath, mimeType),
    uploadThumbnail(file, filePath, thumbOptions),
  ]);
  return { originalUrl, thumbnailUrl };
}
