import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"
import { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials?.email },
        });
        if (!user) throw new Error("User not found");
        if (!user.isActive) throw new Error("Account is deactivated");
        const passwordsMatch = await bcrypt.compare(credentials?.password || "", user.password || "");
        if (!passwordsMatch) throw new Error("Invalid password");
        return user;
      },
    }),
  ],
  

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user, trigger }) {
      // On first login, persist user fields into the JWT
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || "USER";
        token.isActive = (user as { isActive?: boolean }).isActive ?? true;
        token.refreshedAt = Date.now();
      }

      // Refresh role/isActive from DB: on explicit update OR every 5 minutes
      const shouldRefresh =
        trigger === "update" ||
        (token.id && Date.now() - ((token.refreshedAt as number) || 0) > 5 * 60 * 1000);

      if (shouldRefresh) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, isActive: true, isBlocked: true },
        });

        if (!dbUser) {
          return { ...token, id: undefined };
        }

        if (!dbUser.isActive || dbUser.isBlocked) {
          return { ...token, id: undefined };
        }

        token.role = dbUser.role;
        token.isActive = dbUser.isActive;
        token.refreshedAt = Date.now();
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.isActive = token.isActive as boolean;
      }
      return session;
    },

    async signIn({ user }) {
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email! },
        select: { isActive: true, isBlocked: true, id: true },
      });
      if (!dbUser) return true; // new user via OAuth — let adapter create them
      if (!dbUser.isActive || dbUser.isBlocked) return false;

      // Track last login
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { lastLoginAt: new Date() },
      });

      return true;
    },
  },
};