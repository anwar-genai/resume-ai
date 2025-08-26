import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/db";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
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

        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        // Email verification disabled by request
        return { id: user.id, email: user.email, emailVerified: user.emailVerified } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = (user as any).id ?? token.sub;
        token.email = user.email ?? token.email;
        token.emailVerified = (user as any).emailVerified ?? token.emailVerified;
      }
      return token;
    },
    async session({ session, user, token }) {
      // When using database sessions, user is available
      if (user) {
        (session as any).userId = user.id;
        session.user = { ...session.user, id: user.id } as any;
      }
      // For completeness when strategy changes
      if (!user && token && session.user) {
        (session as any).userId = (token as any).sub;
        (session.user as any).id = (token as any).sub;
        (session.user as any).emailVerified = (token as any).emailVerified;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const getAuthSession = () => getServerSession(authOptions);


