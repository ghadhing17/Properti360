"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteListing } from "@/modules/cms/actions/listings";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";

export function DeleteListingButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen]   = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setOpen(false);
    setError(null);
    startTransition(async () => {
      const res = await deleteListing(id);
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <>
      <span className="inline-flex flex-col items-start gap-1">
        <button
          onClick={() => setOpen(true)}
          disabled={pending}
          className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {pending ? "Menghapus..." : "Hapus"}
        </button>
        {error && <span className="text-[11px] text-red-600">{error}</span>}
      </span>

      <ConfirmDialog
        open={open}
        variant="delete"
        title="Hapus Listing?"
        description={`Listing "${title}" beserta semua media dan datanya akan dihapus permanen.\n\nTindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Ya, Hapus Listing"
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
        loading={pending}
      />
    </>
  );
}
