import NextAuth from "next-auth";
import authConfig from "@/shared/auth/config";
import { NextResponse } from "next/server";

// Buat instance Auth KHUSUS untuk Edge (tidak bawa prisma/bcrypt) — pakai authConfig saja
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;

  const isLoggedIn = !!req.auth?.user;
  const role = (req.auth?.user as { role?: string } | undefined)?.role;

  const isAdminRoute = pathname.startsWith("/admin");
  const isCustomerRoute = pathname.startsWith("/customer");
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");

  // Kalau sudah login tapi buka /login atau /register -> redirect ke dashboard sesuai role
  if (isAuthRoute && isLoggedIn) {
    if (role === "ADMIN") return NextResponse.redirect(new URL("/admin", nextUrl));
    return NextResponse.redirect(new URL("/customer", nextUrl));
  }

  // Belum login tapi coba akses protected route -> redirect ke /login
  if ((isAdminRoute || isCustomerRoute) && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname + nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // Sudah login tapi role tidak sesuai untuk /admin
  if (isAdminRoute && isLoggedIn && role !== "ADMIN") {
    // CUSTOMER (atau role lain) tidak boleh ke /admin -> lempar ke /customer
    return NextResponse.redirect(new URL("/customer", nextUrl));
  }

  // /customer boleh ADMIN atau CUSTOMER — selain itu (mis. role aneh) lempar ke login
  if (isCustomerRoute && isLoggedIn) {
    if (role !== "ADMIN" && role !== "CUSTOMER") {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    // NOTE: pembatasan "CUSTOMER hanya lihat listing miliknya" tidak di middleware,
    // tapi di query DB: `where: user.role === "ADMIN" ? {} : { ownerId: user.id }`
    // lihat helper buildOwnerFilter() di lib/auth.ts
  }

  return NextResponse.next();
});

// Matcher — middleware hanya jalan di route yang perlu proteksi + auth pages
export const config = {
  matcher: ["/admin/:path*", "/customer/:path*", "/login", "/register"],
};
