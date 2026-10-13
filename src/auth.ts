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
        console.error("[AUTH_SIGNIN] User object has no email.");
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
        if (existingUser) {
          console.log(`[AUTH_SIGNIN] Login success for registered user: ${email}`);
          return true;
        }

        // New Google accounts continue to the onboarding form before requesting access.
        return true;
      } catch (error) {
        console.error("[AUTH_SIGNIN] Database error during sign-in:", error);
        // Kembali ke login dengan query error NotRegistered
        return "/login?error=NotRegistered";
      }
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.registered = false;
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
            token.registered = true;
          } else {
            token.registered = false;
            token.onboardingName = user.name || "";
          }
        } catch (dbError) {
          console.error("Database error during JWT callback:", dbError);
        }
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
    async session({ session, token }) {
      if (session.user) {
        Object.assign(session.user, {
          id: token.id ?? token.sub,
          systemRole: token.systemRole ?? "STAFF",
          isIT: token.isIT ?? false,
          registered: token.registered ?? true,
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