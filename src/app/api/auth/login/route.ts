import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPin, createSessionToken, TOKEN_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, pin, remember = true } = body;

    if (!phone || !pin) {
      return NextResponse.json(
        { success: false, message: 'Nomor HP dan PIN wajib diisi' },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim();
    const user = await db.getUserByPhone(cleanPhone);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Nomor HP atau PIN salah' },
        { status: 401 }
      );
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, message: 'Akun Anda telah nonaktif. Silakan hubungi admin.' },
        { status: 403 }
      );
    }

    const isMatch = await verifyPin(pin.trim(), user.pin_hash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Nomor HP atau PIN salah' },
        { status: 401 }
      );
    }

    const sessionPayload = {
      userId: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      supervisorId: user.supervisor_id,
    };

    const token = await createSessionToken(sessionPayload);

    // Audit log
    await db.logAudit({
      user_id: user.id,
      user_name: user.name,
      action: 'LOGIN',
      reference_id: user.id,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil',
      user: {
        id: user.id,
        employee_code: user.employee_code,
        name: user.name,
        phone: user.phone,
        role: user.role,
        supervisor_id: user.supervisor_id,
      },
    });

    // Set HTTP-only cookie (30 days if remember me is active, 1 day if inactive)
    const maxAge = remember ? 30 * 24 * 60 * 60 : 24 * 60 * 60;

    response.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      path: '/',
      maxAge,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('Login error:', err);
    return NextResponse.json(
      { success: false, message: `Terjadi kesalahan pada server: ${errMsg}` },
      { status: 500 }
    );
  }
}
