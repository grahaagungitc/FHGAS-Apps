import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, profile }) {
      if (!user.email) return false;

      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (!existingUser) {
        await prisma.user.create({
          data: {
            email: user.email,
            name: profile?.name || user.name || user.email.split("@")[0],
            image: user.image,
            isGuestViewOnly: true,
          },
        });
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          include: {
            roles: {
              include: { role: true },
            },
            department: true,
          },
        });

        if (dbUser) {
          session.user.id = dbUser.id;
          session.user.isGuestViewOnly = dbUser.isGuestViewOnly;
          session.user.roles = dbUser.roles.map((ur) => ur.role.code);
          session.user.department = dbUser.department;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
