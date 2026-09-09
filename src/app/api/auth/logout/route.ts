import { NextResponse } from 'next/server';
import { TOKEN_COOKIE_NAME } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Logout berhasil',
  });

  response.cookies.delete(TOKEN_COOKIE_NAME);
  return response;
}
