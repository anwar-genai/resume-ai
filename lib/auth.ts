import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { headers } from "next/headers";
import prisma from "@/lib/db";
import bcrypt from "bcrypt";
import { checkRateLimit, getClientIp, loginLimiter } from "@/lib/ratelimit";

// A throwaway valid bcrypt hash compared against when the email doesn't exist,
// so login timing doesn't leak whether an account is registered.
const DUMMY_HASH = "$2b$10$WabMhitGpEoKlmNFqgN4xuUbTlpFR8GOQxU0HHRqfgit98gbbHtjK";

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

        // Throttle by client IP to stop brute-force / credential stuffing.
        // Thrown messages surface to the login page via signIn's `res.error`.
        // Guard the header read so a context hiccup can never block all logins.
        let ip = "unknown";
        try {
          ip = getClientIp(await headers());
        } catch {
          /* fall back to a shared bucket */
        }
        const rl = await checkRateLimit(loginLimiter, `login:${ip}`);
        if (!rl.success) {
          throw new Error("Too many login attempts. Please wait a minute and try again.");
        }

        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user) {
          // Constant-time-ish: still run a bcrypt compare so response timing
          // doesn't reveal whether the email exists (user enumeration).
          await bcrypt.compare(credentials.password, DUMMY_HASH);
          return null;
        }

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


