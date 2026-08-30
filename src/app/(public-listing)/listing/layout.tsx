import { MarketingHeader } from "@/shared/ui/header";
import { MarketingFooter } from "@/shared/ui/footer";
import { prisma } from "@/shared/lib/db";

async function getCategories() {
  try {
    const cats = await prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { name: true, slug: true },
    });
    return cats;
  } catch {
    return [];
  }
}

export default async function ListingLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <MarketingHeader />
      {/* Spacer untuk mengimbangi AppBar position="fixed" tinggi 64px mobile / 72px desktop */}
      <div style={{ height: "64px", flexShrink: 0 }} />
      <main style={{ flex: 1 }}>{children}</main>
      <MarketingFooter categories={categories} />
    </div>
  );
}
