import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "@/lib/prisma"
import { AuthOptions } from "next-auth"

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
