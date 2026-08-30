import { requireRole } from "@/shared/auth/session";
import { getAllCategoriesWithCount } from "@/modules/cms";
import { prisma } from "@/shared/lib/db";
import { CategoryCrud } from "@/modules/cms/components/category-crud";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  await requireRole("ADMIN");

  const categories = await getAllCategoriesWithCount();

  return <CategoryCrud categories={categories} />;
}
