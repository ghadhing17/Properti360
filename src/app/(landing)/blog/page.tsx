import Link from "next/link";
import { getPublishedBlogPosts } from "@/modules/landing/queries/landing";

export const revalidate = 60;

export const metadata = {
  title: "Blog — Tips Properti & Virtual Tour 360°",
  description: "Artikel seputar virtual tour 360°, fotografi properti, dan tips SEO listing.",
};

export default async function BlogPage() {
  let posts: { slug: string; title: string; coverImage: string | null; publishedAt: Date | null }[] = [];
  try {
    posts = await getPublishedBlogPosts();
  } catch {
    posts = [];
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold text-foreground">Blog</h1>
      <p className="mt-2 text-sm text-muted">Tips properti, fotografi 360°, dan SEO listing — update berkala.</p>

      {posts.length === 0 ? (
        <div className="mt-8 rounded-xl border bg-white p-8 text-center">
          <p className="text-sm text-muted">Belum ada artikel published. Kembali lagi nanti.</p>
          <Link href="/#booking" className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
            Pesan Sesi Foto
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {posts.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="overflow-hidden rounded-xl border bg-white hover:shadow-sm">
              {p.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.coverImage} alt={p.title} className="aspect-video w-full object-cover" />
              ) : (
                <div className="aspect-video w-full bg-background" />
              )}
              <div className="p-4">
                <h2 className="text-sm font-semibold text-foreground line-clamp-2">{p.title}</h2>
                <p className="mt-1 text-xs text-muted">{p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("id-ID") : ""}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
