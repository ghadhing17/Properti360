"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCustomerListing } from "@/modules/dashboard/actions/customer-listings";

type Props = {
  listingId: string;
  isPublished?: boolean;
  initial: {
    description: string;
    price: number | null;
    contactPhone: string | null;
    contactName: string | null;
  };
};

export function CustomerEditForm({ listingId, isPublished = false, initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateCustomerListing(listingId, formData);
      if (res.error) {
        setError(res.error);
        if (res.fieldErrors) setFieldErrors(res.fieldErrors);
        return;
      }
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</div>}
      {success && <div className="rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">Perubahan berhasil disimpan!</div>}

      <div>
        <label className="mb-1 block text-xs font-medium text-foreground">Deskripsi Properti *</label>
        <textarea
          name="description"
          defaultValue={initial.description}
          required
          rows={5}
          placeholder="Deskripsi lengkap properti..."
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {fieldErrors.description && <p className="mt-1 text-xs text-danger">{fieldErrors.description[0]}</p>}
        <p className="mt-1 text-[11px] text-muted">Ini sumber SEO utama di sekitar viewer Panoee.</p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-foreground">
          {isPublished ? "Harga *" : "Harga (opsional)"}
        </label>
        <input
          name="price"
          type="number"
          min={0}
          step={1}
          defaultValue={initial.price ?? ""}
          required={isPublished}
          placeholder={isPublished ? "Wajib diisi — listing sedang terpublikasi" : "Kosongkan jika tidak pakai harga"}
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {fieldErrors.price && <p className="mt-1 text-xs text-danger">{fieldErrors.price[0]}</p>}
      </div>

      <div className="rounded-lg border bg-zinc-50 p-4">
        <h4 className="text-xs font-semibold text-foreground">Info Kontak yang ditampilkan di halaman publik</h4>
        <p className="mt-1 text-[11px] text-muted">Nama & No HP ini ditampilkan sebagai pemilik listing.</p>
        <div className="mt-3 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">Nama Kontak</label>
            <input
              name="contactName"
              defaultValue={initial.contactName ?? ""}
              placeholder="Nama Anda"
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">No HP / WhatsApp</label>
            <input
              name="contactPhone"
              defaultValue={initial.contactPhone ?? ""}
              placeholder="08xxxxxxxxxx"
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
        <span className="font-semibold">Catatan:</span> Status publish, kategori, dan Panoee embed hanya bisa diubah oleh admin. Hubungi tim Properti360 jika perlu perubahan tersebut.
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
      >
        {pending ? "Menyimpan..." : "Simpan Perubahan"}
      </button>
    </form>
  );
}
