import type { Metadata } from "next";
import "./globals.css";
import { MuiProvider } from "@/shared/ui/mui-provider";

export const metadata: Metadata = {
  title: {
    default: "[NamaBisnis] — Virtual Tour 360° Properti",
    template: "%s | [NamaBisnis]",
  },
  description:
    "Platform virtual tour 360° untuk jasa foto properti — skeleton Next.js 15 siap dikembangkan.",
};

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
