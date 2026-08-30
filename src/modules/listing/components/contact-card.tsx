import { Verified, WhatsApp } from "@mui/icons-material";
import { ContactForm } from "@/modules/listing/components/contact-form";

function ownerInitials(name?: string | null): string {
  if (!name) return "P";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "P";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Normalisasi nomor ke format internasional tanpa "+"/"-" (untuk protokol whatsapp://).
 * "0812-3456-7890" → "6281234567890", "+62 812 3456 7890" → "6281234567890".
 * Return null jika tidak valid — tombol WA tidak dirender.
 */
function toWaNumber(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  if (digits.length < 8 || digits.length > 16) return null;
  return digits;
}

export function ContactCard({
  listingId,
  ownerName,
  ownerPhone,
  city,
  title,
}: {
  listingId: string;
  ownerName?: string | null;
  ownerPhone?: string | null;
  city: string;
  title: string;
}) {
  const waNumber = ownerPhone ? toWaNumber(ownerPhone) : null;
  const waText = encodeURIComponent(
    `Halo, saya tertarik dengan properti "${title}" di ${city}. Apakah masih tersedia?`
  );

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm md:sticky md:top-24">
      {/* Profil pemilik — Vistura style: avatar inisial + verified badge */}
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {ownerInitials(ownerName)}
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-1 truncate text-sm font-semibold text-foreground">
            {ownerName ?? "Pemilik Properti"}
            <Verified sx={{ fontSize: 16, color: "#16a34a" }} />
          </p>
          <p className="text-xs text-muted">Pemilik • Respon cepat &lt; 2 jam</p>
        </div>
      </div>

      {/* 6) Form Hubungi Pemilik — via Server Action */}
      <div className="pt-4">
        <h3 className="text-sm font-semibold text-foreground">Hubungi Pemilik</h3>
        <div className="mt-4">
          <ContactForm listingId={listingId} />
        </div>

        {/* Chat langsung via aplikasi WA — protokol native whatsapp:// (bukan web) */}
        {waNumber && (
          <>
            <div className="my-3 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-[11px] font-medium text-muted">atau</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <a
              href={`whatsapp://send?phone=${waNumber}&text=${waText}`}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              <WhatsApp sx={{ fontSize: 18 }} />
              Chat via WhatsApp
            </a>
            <p className="mt-1.5 text-center text-[11px] text-muted">
              Langsung ke nomor pemilik
            </p>
          </>
        )}
      </div>
    </div>
  );
}
