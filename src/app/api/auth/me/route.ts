import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }

    const user = await db.getUserById(session.userId);
    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, message: 'User tidak aktif atau tidak ditemukan' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        employee_code: user.employee_code,
        name: user.name,
        phone: user.phone,
        role: user.role,
        supervisor_id: user.supervisor_id,
        status: user.status,
      },
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, message: `Error: ${errMsg}` },
      { status: 500 }
    );
  }
}
