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
      }

      // On subsequent requests, refresh role/isActive from DB periodically
      if (trigger === "update" || (!user && token.id)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, isActive: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.isActive = dbUser.isActive;
        }
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
      // Block deactivated users from signing in via any provider
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email! },
      });
      if (dbUser && !dbUser.isActive) return false;
      return true;
    },
  },
};