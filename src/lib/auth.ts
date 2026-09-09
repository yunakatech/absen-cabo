import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { SessionPayload } from './types';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'absen_cabo_super_secret_jwt_key_2026_makassar'
);

const TOKEN_COOKIE_NAME = 'absen_session';

/**
 * Hash a numeric PIN (e.g. "123456") using bcrypt
 */
export async function hashPin(pin: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pin, salt);
}

/**
 * Verify a plain text PIN against a bcrypt hash
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

/**
 * Generate a JWT token for user session (expires in 30 days so drivers don't have to re-login daily)
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET_KEY);
}

/**
 * Verify JWT token and return session payload
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Extract session from request (reads cookie or Authorization header)
 */
export async function getSessionFromRequest(req?: NextRequest): Promise<SessionPayload | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(TOKEN_COOKIE_NAME)?.value;
    if (!token) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
  }

  if (!token) return null;
  return verifySessionToken(token);
}

export { TOKEN_COOKIE_NAME };
