import { redirect } from "next/navigation";
import { auth } from "@/shared/auth";
import RegisterForm from "./register-form";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) {
    const role = (session.user as { role?: string }).role;
    if (role === "ADMIN") redirect("/admin");
    redirect("/customer");
  }

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold">Daftar Akun Customer</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Akun baru otomatis role <code className="rounded bg-zinc-100 px-1">CUSTOMER</code>. Role ADMIN
        hanya via seed/DB. Sudah punya akun?{" "}
        <a href="/login" className="font-medium text-primary underline">
          Login
        </a>
      </p>
      <div className="mt-6">
        <RegisterForm />
      </div>
    </div>
  );
}
