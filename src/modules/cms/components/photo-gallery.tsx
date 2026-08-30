"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type GalleryPhoto = {
  id: string;
  url: string | null;
  thumbnailUrl: string | null;
  altText: string | null;
  order: number;
};

type Props = {
  listingId: string;
  listingTitle: string;
  initialPhotos: GalleryPhoto[];
};

const MAX_PHOTOS = 20;
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export function PhotoGallery({ listingId, listingTitle, initialPhotos }: Props) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>(() =>
    [...initialPhotos].sort((a, b) => a.order - b.order)
  );
  const [pending, setPending] = useState<Array<{ file: File; preview: string }>>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // drag reorder
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // alt text drafts
  const [altDrafts, setAltDrafts] = useState<Record<string, string>>({});
  const [savingAltId, setSavingAltId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // keep altDrafts in sync when photos change
  useEffect(() => {
    const map: Record<string, string> = {};
    for (const p of photos) map[p.id] = p.altText ?? "";
    setAltDrafts(map);
  }, [photos]);

  // cleanup object URLs on unmount / when pending changes
  useEffect(() => {
    return () => {
      for (const p of pending) URL.revokeObjectURL(p.preview);
    };
  }, [pending]);

  const resetMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const validateFiles = useCallback(
    (files: File[]): { valid: File[]; error?: string } => {
      const remaining = MAX_PHOTOS - photos.length - pending.length;
      if (remaining <= 0) return { valid: [], error: `Maksimal ${MAX_PHOTOS} foto per listing tercapai.` };
      if (files.length > remaining) {
        return {
          valid: [],
          error: `Maksimal ${MAX_PHOTOS} foto. Sisa slot: ${remaining}, mencoba upload ${files.length} file.`,
        };
      }
      const valid: File[] = [];
      for (const f of files) {
        if (!ALLOWED_TYPES.includes(f.type.toLowerCase())) {
          return { valid: [], error: `File "${f.name}" format tidak didukung. Hanya JPG/PNG/WebP.` };
        }
        if (f.size > MAX_SIZE) {
          return { valid: [], error: `File "${f.name}" melebihi 5MB (${(f.size / 1024 / 1024).toFixed(2)}MB).` };
        }
        valid.push(f);
      }
      return { valid };
    },
    [photos.length, pending.length]
  );

  const doUpload = async (files: File[]) => {
    if (files.length === 0) return;
    resetMessages();
    setUploading(true);

    // create local previews immediately
    const previews = files.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setPending((prev) => [...prev, ...previews]);

    try {
      const formData = new FormData();
      for (const f of files) formData.append("files", f);

      const res = await fetch(`/api/listings/${listingId}/gallery`, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal upload");

      const newMedia: GalleryPhoto[] = json.media ?? [];
      setPhotos((prev) => [...prev, ...newMedia].sort((a, b) => a.order - b.order));
      setSuccess(`${newMedia.length} foto berhasil diupload.`);
      // revoke previews after success
      for (const p of previews) URL.revokeObjectURL(p.preview);
      setPending((prev) => prev.filter((x) => !previews.includes(x)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal upload");
      // keep previews to show what failed? Remove after error to allow retry
      for (const p of previews) URL.revokeObjectURL(p.preview);
      setPending((prev) => prev.filter((x) => !previews.includes(x)));
    } finally {
      setUploading(false);
    }
  };

  const handleFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const { valid, error: ve } = validateFiles(files);
    if (ve) {
      setError(ve);
      return;
    }
    await doUpload(valid);
  };

  // drag-and-drop upload area handlers
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (uploading) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length) handleFiles(files);
  };

  const onDragOverArea = (e: React.DragEvent) => {
    e.preventDefault();
    if (!dragOver) setDragOver(true);
  };

  const onDragLeaveArea = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const openFilePicker = () => inputRef.current?.click();

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length) {
      handleFiles(files);
      // reset input so same file can be selected again
      e.target.value = "";
    }
  };

  // ── Reorder ────────────────────────────────────────────────────────────
  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragEnter = (id: string) => {
    if (draggedId && draggedId !== id) setDragOverId(id);
  };
  const handleDragEnd = async () => {
    if (!draggedId || !dragOverId || draggedId === dragOverId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    const fromIdx = photos.findIndex((p) => p.id === draggedId);
    const toIdx = photos.findIndex((p) => p.id === dragOverId);
    if (fromIdx === -1 || toIdx === -1) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    const reordered = [...photos];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    // optimistic
    const reorderedWithOrder = reordered.map((p, idx) => ({ ...p, order: idx }));
    setPhotos(reorderedWithOrder);
    setDraggedId(null);
    setDragOverId(null);
    resetMessages();
    try {
      const orderedIds = reorderedWithOrder.map((p) => p.id);
      const res = await fetch(`/api/listings/${listingId}/gallery`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal reorder");
      setSuccess("Urutan foto diperbarui.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal reorder");
      // rollback: refetch? For now revert to previous
      setPhotos([...initialPhotos].sort((a, b) => a.order - b.order));
    }
  };

  // Alternative drop handler for grid
  const handleGridDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleDragEnd();
  };

  // ── Delete ─────────────────────────────────────────────────────────────
  const handleDelete = async (mediaId: string) => {
    if (!confirm("Hapus foto ini? File akan dihapus dari storage.")) return;
    resetMessages();
    setDeletingId(mediaId);
    try {
      const res = await fetch(`/api/listings/${listingId}/gallery/${mediaId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal hapus");
      setPhotos((prev) => prev.filter((p) => p.id !== mediaId).map((p, idx) => ({ ...p, order: idx })));
      setSuccess("Foto dihapus.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal hapus foto");
    } finally {
      setDeletingId(null);
    }
  };

  // ── Alt Text ───────────────────────────────────────────────────────────
  const handleSaveAlt = async (mediaId: string) => {
    const draft = altDrafts[mediaId] ?? "";
    resetMessages();
    setSavingAltId(mediaId);
    try {
      const res = await fetch(`/api/listings/${listingId}/gallery/${mediaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ altText: draft }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal simpan alt text");
      const finalAlt: string = json.media?.altText ?? draft;
      setPhotos((prev) => prev.map((p) => (p.id === mediaId ? { ...p, altText: finalAlt } : p)));
      setAltDrafts((prev) => ({ ...prev, [mediaId]: finalAlt }));
      setSuccess("Alt text disimpan.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal simpan alt text");
    } finally {
      setSavingAltId(null);
    }
  };

  const remainingSlots = MAX_PHOTOS - photos.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Galeri Foto Pendukung</h3>
          <p className="mt-0.5 text-xs text-muted">
            {photos.length}/{MAX_PHOTOS} foto • sisa slot {remainingSlots} • JPG/PNG/WebP • maks 5MB/file
          </p>
        </div>
        <span className="rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-muted">
          Drag untuk reorder
        </span>
      </div>

      {error && <div className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>}
      {success && <div className="rounded-lg border border-success/20 bg-success/10 px-3 py-2 text-sm text-success">{success}</div>}

      {/* Upload Area */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOverArea}
        onDragLeave={onDragLeaveArea}
        onClick={openFilePicker}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${
          dragOver ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/40 hover:bg-primary/[0.02]"
        } ${uploading ? "pointer-events-none opacity-60" : ""}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") openFilePicker();
        }}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg text-primary">☁</div>
        <p className="mt-3 text-sm font-medium text-foreground">
          {uploading ? "Mengupload..." : "Drag foto ke sini atau klik untuk pilih"}
        </p>
        <p className="mt-1 text-xs text-muted">Bisa pilih multiple file sekaligus • preview langsung sebelum upload selesai</p>
        <p className="mt-2 text-[11px] text-muted">JPG/PNG/WebP • maks 5MB/file • maks {MAX_PHOTOS} foto</p>
        {remainingSlots <= 0 && <p className="mt-2 text-xs font-medium text-warning">Slot foto penuh ({MAX_PHOTOS}/{MAX_PHOTOS}) — hapus foto untuk menambah.</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={onInputChange}
          disabled={uploading || remainingSlots <= 0}
        />
      </div>

      {/* Pending previews (local) */}
      {pending.length > 0 && (
        <div className="rounded-xl border bg-white p-3">
          <p className="mb-2 text-xs font-medium text-muted">Preview lokal (mengupload...)</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {pending.map((p, idx) => (
              <div key={idx} className="relative overflow-hidden rounded-lg border bg-background">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.preview} alt={`Preview ${idx + 1}`} className="aspect-square w-full object-cover opacity-70" />
                <div className="absolute inset-0 flex items-center justify-center bg-white/40">
                  <span className="animate-pulse rounded-full bg-white px-2 py-1 text-[11px] font-medium shadow">Uploading...</span>
                </div>
                <p className="truncate bg-white px-1 py-1 text-[10px] text-muted">{p.file.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid foto terupload */}
      {photos.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center">
          <p className="text-sm text-muted">Belum ada foto galeri.</p>
          <p className="mt-1 text-xs text-muted">Upload foto pendukung untuk tampil di halaman listing (SEO & galeri pengunjung).</p>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleGridDrop}
        >
          {photos.map((photo, idx) => {
            const isDragging = draggedId === photo.id;
            const isOver = dragOverId === photo.id;
            const placeholderAlt = `Foto ${listingTitle} ${idx + 1}`;
            const displayAlt = altDrafts[photo.id] ?? "";
            const imgSrc = photo.thumbnailUrl ?? photo.url ?? "";
            return (
              <div
                key={photo.id}
                draggable
                onDragStart={() => handleDragStart(photo.id)}
                onDragEnter={() => handleDragEnter(photo.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className={`group relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition ${
                  isDragging ? "opacity-40" : ""
                } ${isOver ? "ring-2 ring-primary ring-offset-1" : "hover:shadow-md"}`}
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-background">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgSrc}
                    alt={photo.altText ?? placeholderAlt}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    draggable={false}
                  />
                  {/* Drag handle overlay */}
                  <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/55 px-2 py-1 text-[11px] font-medium text-white backdrop-blur">
                    <span className="cursor-grab active:cursor-grabbing">⋮⋮</span>
                    <span>#{idx + 1}</span>
                    <span className="hidden sm:inline">drag</span>
                  </div>
                  {/* Order badge */}
                  <div className="absolute right-2 top-2 rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-foreground shadow">
                    {idx + 1}/{photos.length}
                  </div>
                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(photo.id)}
                    disabled={deletingId === photo.id}
                    className="absolute bottom-2 right-2 rounded-full bg-danger px-2.5 py-1 text-[11px] font-semibold text-white shadow hover:bg-danger/90 disabled:opacity-50"
                  >
                    {deletingId === photo.id ? "Menghapus..." : "Hapus"}
                  </button>
                </div>

                {/* Alt Text editor */}
                <div className="p-3">
                  <label className="mb-1 block text-[11px] font-medium text-foreground">
                    Alt Text <span className="font-normal text-muted">(SEO)</span>
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={displayAlt}
                      onChange={(e) => setAltDrafts((prev) => ({ ...prev, [photo.id]: e.target.value }))}
                      placeholder={placeholderAlt}
                      className="min-w-0 flex-1 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs outline-none placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveAlt(photo.id)}
                      disabled={savingAltId === photo.id}
                      className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-dark disabled:opacity-50"
                    >
                      {savingAltId === photo.id ? "..." : "Simpan"}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-muted">
                    {displayAlt.trim() ? "Custom" : `Auto: "${placeholderAlt}"`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-muted">
        Tips: drag card untuk mengubah urutan. Urutan menentukan field <code className="rounded bg-background px-1">order</code> di database & tampilan galeri publik.
      </p>
    </div>
  );
}
