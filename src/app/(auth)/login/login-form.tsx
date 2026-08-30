"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import { loginSchema, type LoginInput } from "@/shared/lib/validations/auth";

export default function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setServerError(null);

    // next-auth client signIn — tidak redirect otomatis, cek error manual
    const res = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
      callbackUrl: callbackUrl ?? "/customer",
    });

    if (res?.error) {
      setServerError("Email atau password salah");
      return;
    }

    // sukses — next-auth sudah set cookie JWT, arahkan ke callback atau dashboard
    // Gunakan `res.url` jika ada, fallback ke callbackUrl / customer
    const target = res?.url || callbackUrl || "/customer";
    // `signIn` dengan redirect:false tidak push otomatis, jadi manual
    // Tapi `res.url` sudah berupa URL tujuan bawaan NextAuth; pakai router
    router.push(target);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Username atau Email
        </label>
        <input
          id="email"
          type="text"
          autoComplete="username"
          placeholder="ghadhing atau ghadhing@properti360.local"
          {...register("email")}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          {...register("password")}
          className="mt-1 w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
      </div>

      {serverError && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Memproses..." : "Login"}
      </button>

      <p className="text-center text-xs text-zinc-500">
        Protected by Auth.js — session JWT berisi role tanpa query DB tiap request.
      </p>
    </form>
  );
}
