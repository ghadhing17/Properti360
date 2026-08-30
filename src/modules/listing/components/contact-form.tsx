"use client";

import { useActionState, useEffect, useRef } from "react";
import { submitLead, type LeadActionState } from "@/modules/listing/actions/leads";

const initialState: LeadActionState = {};

export function ContactForm({ listingId }: { listingId: string }) {
  const [state, formAction, pending] = useActionState(submitLead, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const wasSuccess = state.success === true;

  useEffect(() => {
    if (wasSuccess) formRef.current?.reset();
  }, [wasSuccess]);

  if (wasSuccess) {
    return (
      <div className="rounded-lg bg-success/10 p-4 text-center text-sm text-success">
        Pesan terkirim! Pemilik akan menghubungi Anda segera.
        <p className="mt-1 text-xs text-success/80">Kami juga mengirim notifikasi email ke admin.</p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="listingId" value={listingId} />
      {state.error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">{state.error}</p>
      )}
      <div>
        <label className="mb-1 block text-xs font-medium text-foreground">Nama *</label>
        <input
          name="name"
          required
          maxLength={100}
          placeholder="Nama Anda"
          className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {state.fieldErrors?.name && (
          <p className="mt-1 text-xs text-danger">{state.fieldErrors.name[0]}</p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-foreground">No HP / WhatsApp *</label>
        <input
          name="phone"
          required
          maxLength={20}
          placeholder="08xxxxxxxxxx"
          className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {state.fieldErrors?.phone && (
          <p className="mt-1 text-xs text-danger">{state.fieldErrors.phone[0]}</p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-foreground">Pesan *</label>
        <textarea
          name="message"
          required
          rows={3}
          maxLength={2000}
          placeholder="Saya tertarik dengan properti ini..."
          className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        {state.fieldErrors?.message && (
          <p className="mt-1 text-xs text-danger">{state.fieldErrors.message[0]}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
      >
        {pending ? "Mengirim..." : "Kirim Pesan →"}
      </button>
      <p className="text-center text-[11px] text-muted">Respon rata-rata &lt; 2 jam • via WhatsApp</p>
    </form>
  );
}
