import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/shared/auth/session";
import { ProductForm } from "@/modules/cms/components/product-form";
import { getProductById } from "@/modules/cms";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  await requireRole("ADMIN");
  const { id } = await params;

  const product = await getProductById(id);
  if (!product) notFound();

  return (
    <Stack spacing={3}>
      <Breadcrumbs separator={<NavigateNextIcon sx={{ fontSize: 14 }} />} sx={{ fontSize: "0.8rem" }}>
        <Typography component={Link} href="/admin/products" variant="caption"
          sx={{ color: "#64748B", textDecoration: "none", "&:hover": { color: "#1D4ED8" } }}>
          Produk
        </Typography>
        <Typography variant="caption" sx={{ color: "#0F172A", fontWeight: 600 }}>
          Edit: {product.name}
        </Typography>
      </Breadcrumbs>

      <Paper elevation={0} sx={{ borderRadius: 1, border: "1px solid #E2E8F0", p: 3 }}>
        <ProductForm mode="edit" product={product} />
      </Paper>
    </Stack>
  );
}
