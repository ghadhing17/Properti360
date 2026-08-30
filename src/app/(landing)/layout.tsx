import { MarketingHeader } from "@/shared/ui/header";
import { MarketingFooter } from "@/shared/ui/footer";
import { getNavCategories } from "@/modules/landing/queries/landing";

async function getCategories() {
  return getNavCategories();
}

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
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