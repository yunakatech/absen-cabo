import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak. Hanya Admin yang dapat mengedit absensi.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { attendance_date, attendance_time, notes } = body;

    const allAttendance = await db.getAttendance();
    const existing = allAttendance.find((a) => a.id === id);

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Data absensi tidak ditemukan' },
        { status: 404 }
      );
    }

    const updatedRecord = {
      ...existing,
      attendance_date: attendance_date || existing.attendance_date,
      attendance_time: attendance_time
        ? (attendance_time.length === 5 ? `${attendance_time}:00` : attendance_time)
        : existing.attendance_time,
      notes: notes !== undefined ? notes : existing.notes,
      attendance_key: `${existing.driver_id}_${attendance_date || existing.attendance_date}`,
      updated_at: new Date().toISOString(),
    };

    await db.saveAttendance(updatedRecord);

    await db.logAudit({
      user_id: session.userId,
      user_name: session.name,
      action: 'ATTENDANCE_UPDATED',
      reference_id: id,
      old_value: JSON.stringify(existing),
      new_value: JSON.stringify(updatedRecord),
    });

    return NextResponse.json({
      success: true,
      message: 'Data absensi berhasil diperbarui',
      attendance: updatedRecord,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: `Error: ${errMsg}` }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak. Hanya Admin yang dapat menghapus absensi.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const allAttendance = await db.getAttendance();
    const existing = allAttendance.find((a) => a.id === id);

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Data absensi tidak ditemukan' },
        { status: 404 }
      );
    }

    // Save snapshot in Audit Log BEFORE deletion per PRD spec
    await db.logAudit({
      user_id: session.userId,
      user_name: session.name,
      action: 'ATTENDANCE_DELETED',
      reference_id: id,
      old_value: JSON.stringify(existing),
    });

    await db.deleteAttendance(id);

    return NextResponse.json({
      success: true,
      message: 'Data absensi berhasil dihapus',
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: `Error: ${errMsg}` }, { status: 500 });
  }
}
