import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/db";
import { requestUnregisteredAccess } from "@/lib/access-requests";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (!user?.email) {
        return false;
      }

      try {
        const existingUser = await db.user.findUnique({
          where: { email: user.email.trim().toLowerCase() },
        });

        // Jika user sudah terdaftar di database, izinkan login
        if (existingUser) return true;

        // Skema Baru: Email belum terdaftar TIDAK lagi otomatis diproses sebagai permohonan akses
        // kecuali dialihkan dari alur Sign Up. Pada alur Login biasa, tampilkan pesan error bahwa email belum terdaftar.
        return "/login?error=NotRegistered";
      } catch (error) {
        console.error("Database error during sign-in:", error);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await db.user.findUnique({
          where: { email: user.email },
          include: { userRoles: { include: { SystemRole: true } } },
        });

        if (dbUser) {
          const roleCodes = dbUser.userRoles.map((role) => role.SystemRole.code);
          token.id = dbUser.id;
          token.systemRole = roleCodes.includes("ADMIN") ? "ADMIN" : "STAFF";
          token.isIT = dbUser.isIT;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        Object.assign(session.user, {
          id: token.id ?? token.sub,
          systemRole: token.systemRole ?? "STAFF",
          isIT: token.isIT ?? false,
        });
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});