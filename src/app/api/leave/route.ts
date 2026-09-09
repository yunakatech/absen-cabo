import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { LeaveRequest } from '@/lib/types';

// GET Leave Requests
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get('status');
    const driverIdParam = searchParams.get('driver_id');

    let requests = await db.getLeaveRequests();

    // Scope by role
    if (session.role === 'DRIVER') {
      requests = requests.filter((r) => r.driver_id === session.userId);
    } else if (session.role === 'SUPERVISOR') {
      // Supervisor sees their drivers
      const allUsers = await db.getUsers();
      const myDriverIds = new Set(
        allUsers.filter((u) => u.supervisor_id === session.userId).map((u) => u.id)
      );
      requests = requests.filter((r) => myDriverIds.has(r.driver_id));
    }

    // Filter params
    if (statusParam) {
      requests = requests.filter((r) => r.status === statusParam);
    }
    if (driverIdParam) {
      requests = requests.filter((r) => r.driver_id === driverIdParam);
    }

    // Sort newest created_at first
    requests.sort((a, b) => b.created_at.localeCompare(a.created_at));

    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: `Error: ${errMsg}` }, { status: 500 });
  }
}

// POST Create Leave Request (Driver)
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 });
    }

    if (session.role !== 'DRIVER') {
      return NextResponse.json(
        { success: false, message: 'Hanya Driver yang dapat mengajukan izin' },
        { status: 403 }
      );
    }

    const settings = await db.getSettings();
    if (!settings.leave_enabled) {
      return NextResponse.json(
        { success: false, message: 'Pengajuan izin saat ini sedang nonaktif' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { leave_type, start_date, end_date, reason } = body;

    if (!leave_type || !start_date) {
      return NextResponse.json(
        { success: false, message: 'Jenis izin dan tanggal mulai wajib diisi' },
        { status: 400 }
      );
    }

    if (settings.leave_reason_required && (!reason || !reason.trim())) {
      return NextResponse.json(
        { success: false, message: 'Keterangan izin wajib diisi' },
        { status: 400 }
      );
    }

    const targetEndDate = end_date || start_date;

    // Check if driver already has an attendance record for any date in the leave range
    const allAttendance = await db.getAttendance();
    const existingAtt = allAttendance.find(
      (a) =>
        a.driver_id === session.userId &&
        a.attendance_date >= start_date &&
        a.attendance_date <= targetEndDate
    );

    if (existingAtt) {
      return NextResponse.json(
        {
          success: false,
          message: `Anda telah mengisi absensi pada tanggal ${existingAtt.attendance_date}. Tidak dapat mengajukan izin pada tanggal yang sudah diisi absensi.`,
        },
        { status: 400 }
      );
    }

    const user = await db.getUserById(session.userId);
    const supervisorId = user?.supervisor_id || session.supervisorId || '';

    const nowIso = new Date().toISOString();
    const newRequest: LeaveRequest = {
      id: 'lve_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      driver_id: session.userId,
      driver_name: session.name,
      supervisor_id: supervisorId,
      leave_type,
      start_date,
      end_date: end_date || start_date,
      reason: reason || '',
      status: 'PENDING',
      created_at: nowIso,
      updated_at: nowIso,
    };

    await db.saveLeaveRequest(newRequest);

    await db.logAudit({
      user_id: session.userId,
      user_name: session.name,
      action: 'LEAVE_CREATED',
      reference_id: newRequest.id,
      new_value: JSON.stringify(newRequest),
    });

    return NextResponse.json({
      success: true,
      message: 'Pengajuan izin berhasil dikirim',
      request: newRequest,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: `Error: ${errMsg}` }, { status: 500 });
  }
}
