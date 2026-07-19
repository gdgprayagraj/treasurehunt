import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/answer";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = normalizeEmail(credentials.email);
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          collegeId: user.collegeId,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.uid = user.id;
        token.role = (user as { role: "ADMIN" | "SUB_ORGANIZER" }).role;
        token.collegeId = (user as { collegeId: string | null }).collegeId ?? null;
        token.mustChangePassword = (user as { mustChangePassword: boolean })
          .mustChangePassword;
      }
      // Allow client-side session.update() to refresh mustChangePassword after a
      // password change without forcing a re-login.
      if (trigger === "update" && session?.mustChangePassword === false) {
        token.mustChangePassword = false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.role = token.role as "ADMIN" | "SUB_ORGANIZER";
        session.user.collegeId = (token.collegeId as string | null) ?? null;
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
      }
      return session;
    },
  },
};
