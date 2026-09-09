import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

// GET settings (Safe subset or full for admin)
export async function GET() {
  try {
    const settings = await db.getSettings();
    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: `Error: ${errMsg}` },
      { status: 500 }
    );
  }
}

// PUT settings (Admin only)
export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak. Hanya Admin yang dapat mengubah pengaturan.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const oldSettings = await db.getSettings();
    const newSettings = await db.saveSettings({
      ...oldSettings,
      ...body,
    });

    await db.logAudit({
      user_id: session.userId,
      user_name: session.name,
      action: 'SETTINGS_UPDATED',
      reference_id: 'settings',
      old_value: JSON.stringify(oldSettings),
      new_value: JSON.stringify(newSettings),
    });

    return NextResponse.json({
      success: true,
      message: 'Pengaturan berhasil disimpan',
      settings: newSettings,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: `Error: ${errMsg}` },
      { status: 500 }
    );
  }
}
