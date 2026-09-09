import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  try {
    const isGoogleActive = db.isGoogleSheetsActive();

    if (isGoogleActive) {
      const result = await db.setupGoogleSheets();
      return NextResponse.json(result);
    } else {
      return NextResponse.json({
        success: true,
        message: 'Google Credentials belum dikonfigurasi. Sistem menggunakan mode Penyimpanan Lokal (.data/db.json) dan sudah terisi akun default.',
      });
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: `Setup error: ${errMsg}` }, { status: 500 });
  }
}
