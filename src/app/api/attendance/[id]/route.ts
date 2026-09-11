import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { DutyStatus } from '@/lib/types';

const VALID_DUTY_STATUSES: DutyStatus[] = ['READY', 'BERTUGAS', 'MAINTENANCE'];

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERVISOR')) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak. Hanya Admin atau Supervisor yang dapat mengedit absensi.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { attendance_date, attendance_time, notes, duty_status } = body;

    const allAttendance = await db.getAttendance();
    const existing = allAttendance.find((a) => a.id === id);

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Data absensi tidak ditemukan' },
        { status: 404 }
      );
    }

    // Supervisor can only edit attendance for their own drivers
    if (session.role === 'SUPERVISOR') {
      const allUsers = await db.getUsers();
      const driver = allUsers.find((u) => u.id === existing.driver_id);
      if (!driver || driver.supervisor_id !== session.userId) {
        return NextResponse.json(
          { success: false, message: 'Akses ditolak. Absensi ini bukan milik driver Anda.' },
          { status: 403 }
        );
      }
    }

    // Validate duty_status if provided
    if (duty_status && !VALID_DUTY_STATUSES.includes(duty_status)) {
      return NextResponse.json(
        { success: false, message: `Status tugas tidak valid. Gunakan: ${VALID_DUTY_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const updatedRecord = {
      ...existing,
      attendance_date: attendance_date || existing.attendance_date,
      attendance_time: attendance_time
        ? (attendance_time.length === 5 ? `${attendance_time}:00` : attendance_time)
        : existing.attendance_time,
      notes: notes !== undefined ? notes : existing.notes,
      duty_status: duty_status || existing.duty_status || 'BERTUGAS',
      attendance_key: `${existing.driver_id}_${attendance_date || existing.attendance_date}`,
      updated_at: new Date().toISOString(),
    };

    await db.saveAttendance(updatedRecord);

    await db.logAudit({
      user_id: session.userId,
      user_name: session.name,
      action: duty_status && duty_status !== existing.duty_status ? 'DUTY_STATUS_UPDATED' : 'ATTENDANCE_UPDATED',
      reference_id: id,
      old_value: JSON.stringify({ duty_status: existing.duty_status, date: existing.attendance_date }),
      new_value: JSON.stringify({ duty_status: updatedRecord.duty_status, date: updatedRecord.attendance_date }),
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
