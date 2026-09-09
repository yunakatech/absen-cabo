import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { Attendance } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak. Hanya Admin yang dapat menambah absensi manual.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { driver_id, attendance_date, attendance_time, notes } = body;

    if (!driver_id || !attendance_date || !attendance_time) {
      return NextResponse.json(
        { success: false, message: 'Driver, Tanggal, dan Jam wajib diisi' },
        { status: 400 }
      );
    }

    const driver = await db.getUserById(driver_id);
    if (!driver) {
      return NextResponse.json(
        { success: false, message: 'Driver tidak ditemukan' },
        { status: 404 }
      );
    }

    const attendanceKey = `${driver_id}_${attendance_date}`;
    const allAttendance = await db.getAttendance();
    const existing = allAttendance.find((a) => a.attendance_key === attendanceKey);

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Driver ini sudah memiliki data absensi pada tanggal tersebut' },
        { status: 409 }
      );
    }

    const nowIso = new Date().toISOString();
    const newRecord: Attendance = {
      id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      attendance_key: attendanceKey,
      attendance_date,
      attendance_time: attendance_time.length === 5 ? `${attendance_time}:00` : attendance_time,
      driver_id,
      driver_name: driver.name,
      latitude: '',
      longitude: '',
      gps_accuracy: '',
      source: 'ADMIN',
      notes: notes || 'Absensi Ditambahkan oleh Admin',
      created_at: nowIso,
      updated_at: nowIso,
    };

    await db.saveAttendance(newRecord);

    await db.logAudit({
      user_id: session.userId,
      user_name: session.name,
      action: 'ATTENDANCE_CREATED_BY_ADMIN',
      reference_id: newRecord.id,
      new_value: JSON.stringify(newRecord),
    });

    return NextResponse.json({
      success: true,
      message: 'Absensi manual berhasil ditambahkan',
      attendance: newRecord,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: `Error: ${errMsg}` }, { status: 500 });
  }
}
