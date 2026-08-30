import { NextResponse } from "next/server";
import { deleteGalleryPhoto, updateGalleryPhotoAltText } from "@/modules/cms/actions/gallery";

type Params = { params: Promise<{ id: string; mediaId: string }> };

// DELETE /api/listings/[id]/gallery/[mediaId] — hapus satu foto galeri
export async function DELETE(_req: Request, { params }: Params) {
  const { id, mediaId } = await params;

  try {
    const result = await deleteGalleryPhoto(id, mediaId);
    if (result.error) {
      const isMissing = result.error.includes("tidak ditemukan") || result.error.includes("tidak termasuk");
      return NextResponse.json({ error: result.error }, { status: isMissing ? 404 : 400 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[DELETE /api/listings/[id]/gallery/[mediaId]]", e);
    return NextResponse.json({ error: "Gagal menghapus foto" }, { status: 500 });
  }
}

// PATCH /api/listings/[id]/gallery/[mediaId] — update alt text foto (JSON body: { altText })
export async function PATCH(req: Request, { params }: Params) {
  const { id, mediaId } = await params;

  try {
    const body = (await req.json().catch(() => null)) as { altText?: unknown } | null;
    const altText = body?.altText;
    if (typeof altText !== "string") {
      return NextResponse.json({ error: "altText wajib string" }, { status: 400 });
    }

    const result = await updateGalleryPhotoAltText(id, mediaId, altText);
    if (result.error) {
      const isMissing = result.error.includes("tidak ditemukan") || result.error.includes("tidak termasuk");
      return NextResponse.json({ error: result.error }, { status: isMissing ? 404 : 400 });
    }
    const finalAlt =
      result.data && typeof result.data === "object" && "altText" in result.data
        ? (result.data as { altText: string }).altText
        : altText;
    return NextResponse.json({ success: true, media: { altText: finalAlt } });
  } catch (e) {
    console.error("[PATCH /api/listings/[id]/gallery/[mediaId]]", e);
    return NextResponse.json({ error: "Gagal update alt text" }, { status: 500 });
  }
}
