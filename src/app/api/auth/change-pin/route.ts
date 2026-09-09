import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest, verifyPin, hashPin } from '@/lib/auth';

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Silakan login terlebih dahulu' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { currentPin, newPin, confirmPin } = body;

    if (!currentPin || !newPin || !confirmPin) {
      return NextResponse.json(
        { success: false, message: 'Semua kolom PIN wajib diisi' },
        { status: 400 }
      );
    }

    const trimmedCurrentPin = String(currentPin).trim();
    const trimmedNewPin = String(newPin).trim();
    const trimmedConfirmPin = String(confirmPin).trim();

    if (!/^\d{6}$/.test(trimmedNewPin)) {
      return NextResponse.json(
        { success: false, message: 'PIN baru harus berupa 6 digit angka' },
        { status: 400 }
      );
    }

    if (trimmedNewPin !== trimmedConfirmPin) {
      return NextResponse.json(
        { success: false, message: 'Konfirmasi PIN baru tidak cocok' },
        { status: 400 }
      );
    }

    const user = await db.getUserById(session.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Pengguna tidak ditemukan' },
        { status: 404 }
      );
    }

    const isMatch = await verifyPin(trimmedCurrentPin, user.pin_hash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'PIN lama yang Anda masukkan salah' },
        { status: 400 }
      );
    }

    const isSame = await verifyPin(trimmedNewPin, user.pin_hash);
    if (isSame) {
      return NextResponse.json(
        { success: false, message: 'PIN baru tidak boleh sama dengan PIN lama' },
        { status: 400 }
      );
    }

    const newPinHash = await hashPin(trimmedNewPin);
    user.pin_hash = newPinHash;
    user.updated_at = new Date().toISOString();

    await db.saveUser(user);

    await db.logAudit({
      user_id: user.id,
      user_name: user.name,
      action: 'CHANGE_PIN',
      reference_id: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'PIN berhasil diperbarui. Silakan gunakan PIN baru untuk login berikutnya.',
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('Change PIN error:', err);
    return NextResponse.json(
      { success: false, message: `Terjadi kesalahan pada server: ${errMsg}` },
      { status: 500 }
    );
  }
}
