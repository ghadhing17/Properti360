import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";

import { prisma } from "@/shared/lib/db";
import authConfig from "./config";
import { loginSchema } from "@/shared/lib/validations/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Validasi dengan Zod — cegah injeksi & pastikan format
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email: identifierRaw, password } = parsed.data;
        const identifier = identifierRaw.trim();

        // Support login via email OR username (name) — case-insensitive
        // "ghadhing" -> match name, "ghadhing@properti360.local" -> match email
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { equals: identifier, mode: "insensitive" } },
              { name: { equals: identifier, mode: "insensitive" } },
            ],
          },
        });
        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;

        // Return user object yang akan masuk ke jwt callback (auth.config.ts)
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.image ?? undefined,
        };
      },
    }),
  ],
});
