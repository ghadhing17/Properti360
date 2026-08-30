import { redirect } from "next/navigation";
import { auth } from "@/shared/auth";
import LoginForm from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  // Jika sudah login, redirect sesuai role (mirror middleware logic)
  if (session?.user) {
    const role = (session.user as { role?: string }).role;
    if (params.callbackUrl) redirect(params.callbackUrl);
    if (role === "ADMIN") redirect("/admin");
    redirect("/customer");
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold">Login</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Masuk untuk melanjutkan ke dashboard. Belum punya akun?{" "}
        <a href="/register" className="font-medium text-primary underline">
          Daftar
        </a>
      </p>
      {params.error && (
        <div className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          Login gagal — periksa email/password.
        </div>
      )}
      <div className="mt-6">
        <LoginForm callbackUrl={params.callbackUrl} />
      </div>
    </div>
  );
}
