import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak. Hanya Admin yang dapat melihat Audit Log.' },
        { status: 403 }
      );
    }

    const logs = await db.getAuditLogs();
    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: `Error: ${errMsg}` }, { status: 500 });
  }
}
