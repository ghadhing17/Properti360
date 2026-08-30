import { NextResponse } from "next/server";
import { uploadGalleryPhotos, reorderGalleryPhotos } from "@/modules/cms/actions/gallery";

type Params = { params: Promise<{ id: string }> };

// POST /api/listings/[id]/gallery — upload foto galeri (multipart form-data: files[])
export async function POST(req: Request, { params }: Params) {
  const { id } = await params;

  try {
    const formData = await req.formData();
    const result = await uploadGalleryPhotos(id, formData);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, media: result.media ?? [] });
  } catch (e) {
    console.error("[POST /api/listings/[id]/gallery]", e);
    return NextResponse.json({ error: "Gagal mengunggah foto" }, { status: 500 });
  }
}

// PATCH /api/listings/[id]/gallery — reorder foto (JSON body: { orderedIds: string[] })
export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;

  try {
    const body = (await req.json().catch(() => null)) as { orderedIds?: unknown } | null;
    const orderedIds = body?.orderedIds;
    if (!Array.isArray(orderedIds)) {
      return NextResponse.json({ error: "orderedIds wajib array" }, { status: 400 });
    }

    const result = await reorderGalleryPhotos(id, orderedIds as string[]);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[PATCH /api/listings/[id]/gallery]", e);
    return NextResponse.json({ error: "Gagal mengubah urutan foto" }, { status: 500 });
  }
}
