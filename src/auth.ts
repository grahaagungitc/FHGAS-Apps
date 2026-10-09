import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { db } from "@/lib/db";

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

        // Pencarian email case-insensitive untuk mengatasi perbedaan huruf besar/kecil di DB (e.g. grahaagungHM@favehotels.com)
        const existingUser = await db.user.findFirst({
          where: {
            email: {
              equals: email,
              mode: "insensitive",
            },
          },
        });

        // Jika user ditemukan di database, izinkan login
        if (existingUser) return true;

        // Jika email belum terdaftar di User DB, alihkan ke login dengan status NotRegistered
        return "/login?error=NotRegistered";
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