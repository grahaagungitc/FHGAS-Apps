import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/db";
import { requestUnregisteredAccess } from "@/lib/access-requests";

const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID || "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET || "";
const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "super-secret-key-hms-hotel-2026";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: authSecret,
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) {
        return false;
      }

      try {
        const email = user.email.trim();

        // 1. Cek apakah user terdaftar di tabel User (Case-Insensitive)
        const existingUser = await db.user.findFirst({
          where: {
            email: {
              equals: email,
              mode: "insensitive",
            },
          },
        });

        // Jika user terdaftar, izinkan login langsung ke /dashboard
        if (existingUser) return true;

        // 2. Jika user BELUM terdaftar di User DB, ajukan/cek status permohonan akses
        await requestUnregisteredAccess({
          email: email,
          name: user.name || user.email,
        });

        // Tampilkan pesan status pendaftaran dikirim ke admin
        return "/login?error=AccessPending";
      } catch (error) {
        console.error("Database error during sign-in:", error);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user?.email) {
        try {
          const email = user.email.trim();
          const dbUser = await db.user.findFirst({
            where: {
              email: {
                equals: email,
                mode: "insensitive",
              },
            },
            include: { userRoles: { include: { SystemRole: true } } },
          });

          if (dbUser) {
            const roleCodes = dbUser.userRoles.map((role) => role.SystemRole.code);
            token.id = dbUser.id;
            token.systemRole = roleCodes.includes("ADMIN") ? "ADMIN" : "STAFF";
            token.isIT = dbUser.isIT;
          }
        } catch (dbError) {
          console.error("Database error during JWT callback:", dbError);
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
    error: "/login",
  },
});