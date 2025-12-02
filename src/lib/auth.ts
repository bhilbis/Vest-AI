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
    async jwt({ token, user }) {
      // Saat user login pertama kali, simpan user.id dari DB ke dalam token
      if (user) {
        token.id = user.id; // simpan cuid() user.id
      }
      return token;
    },

    async session({ session, token }) {
      // Inject user.id ke session
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },

    async signIn({ user }) {
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email! },
      });

      if (existingUser) return true;
      return true;
    },
  },
};
