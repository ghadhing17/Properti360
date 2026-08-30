import type { NextAuthConfig } from "next-auth";

// Edge-safe config — tidak import prisma / bcrypt di sini (middleware jalan di Edge Runtime)
export default {
  // Providers kosong di edge; real Credentials provider di-override di auth.ts (Node runtime)
  providers: [],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    // sesuaikan durasi session jika perlu
    maxAge: 30 * 24 * 60 * 60, // 30 hari
  },
  callbacks: {
    // Dipanggil setiap kali JWT dibuat/di-update. Simpan role & id ke token.
    async jwt({ token, user }) {
      // `user` hanya ada saat login pertama (authorize return)
      if (user) {
        const u = user as unknown as { role?: string; id?: string; name?: string; email?: string };
        if (u.role) (token as Record<string, unknown>).role = u.role;
        if (u.id) (token as Record<string, unknown>).id = u.id;
        // name/email juga sudah ada default, tapi pastikan
        if (u.name) token.name = u.name;
        if (u.email) token.email = u.email;
      }
      return token;
    },
    // Dipanggil saat client/server memanggil auth() / useSession()
    // Copy role dari token ke session.user supaya bisa diakses tanpa query DB.
    async session({ session, token }) {
      if (token && session.user) {
        const t = token as unknown as { sub?: string; id?: string; role?: string; email?: string; name?: string };
        (session.user as unknown as Record<string, unknown>).id = t.sub ?? t.id ?? session.user.id;
        (session.user as unknown as Record<string, unknown>).role =
          t.role ?? (session.user as unknown as Record<string, unknown>).role;
        session.user.email = t.email ?? session.user.email;
        session.user.name = t.name ?? session.user.name;
      }
      return session;
    },
    // Optional: dipakai kalau pakai `auth` sebagai middleware helper langsung.
    // Kita handle redirect manual di middleware.ts, jadi kembalikan true di sini.
    authorized({ auth, request }) {
      // Biarkan middleware.ts yang handle logika role, di sini always allow
      // supaya NextAuth tidak auto-redirect.
      return true;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
