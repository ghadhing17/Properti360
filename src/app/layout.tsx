import type { Metadata } from "next";
import "./globals.css";
import { MuiProvider } from "@/shared/ui/mui-provider";
import { getSiteSettingsSafe } from "@/modules/cms";
import { toAbsoluteImage } from "@/modules/listing";

// Metadata default situs dibaca dari SiteSettings (dikelola via /admin/settings).
// Fallback otomatis jika DB gagal / belum dikonfigurasi.
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettingsSafe();
  const siteName = s?.siteName?.trim() || "Properti 360";
  const title = s?.metaTitle?.trim() || `${siteName} — Virtual Tour 360° Properti`;
  const description =
    s?.metaDescription?.trim() || "Platform virtual tour 360° untuk jasa foto properti.";
  const ogTitle = s?.ogTitle?.trim() || title;
  const ogDescription = s?.ogDescription?.trim() || description;
  const ogImage = toAbsoluteImage(s?.ogImage);

  return {
    title: {
      default: title,
      template: `%s | ${siteName}`,
    },
    description,
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      siteName,
      type: "website",
      locale: "id_ID",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title: ogTitle,
      description: ogDescription,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <MuiProvider>{children}</MuiProvider>
      </body>
    </html>
  );
}
