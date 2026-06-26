import crypto from 'crypto';
import prisma from '@/lib/db';

export type TokenType = 'email_verification' | 'password_reset';

// Tokens are stored HASHED so a database leak can't be used to verify emails or
// reset passwords. The raw token only ever lives in the emailed link.
function storedValue(type: TokenType, rawToken: string): string {
  const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
  return `${type}:${hash}`;
}

export async function generateToken(identifier: string, type: TokenType): Promise<string> {
  // Clean up expired tokens first
  await prisma.verificationToken.deleteMany({
    where: {
      identifier,
      expires: {
        lt: new Date(),
      },
    },
  });

  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Set expiration based on token type
  const expiresIn = type === 'email_verification' ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000; // 24h for verification, 1h for reset
  const expires = new Date(Date.now() + expiresIn);

  // Store the hashed token (type-prefixed to avoid cross-type conflicts).
  await prisma.verificationToken.create({
    data: {
      identifier,
      token: storedValue(type, token),
      expires,
    },
  });

  return token;
}

export async function verifyToken(token: string, identifier: string, type: TokenType): Promise<boolean> {
  const tokenWithType = storedValue(type, token);

  const verificationToken = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: {
        identifier,
        token: tokenWithType,
      },
    },
  });

  if (!verificationToken) {
    return false;
  }

  // Check if token is expired
  if (verificationToken.expires < new Date()) {
    // Clean up expired token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier,
          token: tokenWithType,
        },
      },
    });
    return false;
  }

  return true;
}

export async function consumeToken(token: string, identifier: string, type: TokenType): Promise<boolean> {
  const tokenWithType = storedValue(type, token);

  try {
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier,
          token: tokenWithType,
        },
      },
    });
    return true;
  } catch {
    return false;
  }
}

export function getBaseUrl(): string {
  // Prefer an explicit public app URL if provided
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // NextAuth URL is a good fallback
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  // Vercel provides the deployment host without protocol
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Final fallback for local dev; try to respect PORT if set
  const port = process.env.PORT || '3000';
  return `http://localhost:${port}`;
}
