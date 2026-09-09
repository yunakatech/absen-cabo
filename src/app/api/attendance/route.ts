import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { getMakassarTime, isWorkDay, compareHHMM } from '@/lib/time';
import { Attendance } from '@/lib/types';

// GET Attendance records (filtered)
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date');
    const driverIdParam = searchParams.get('driver_id');
    const supervisorIdParam = searchParams.get('supervisor_id');

    let allAttendance = await db.getAttendance();

    // Driver can only see their own attendance
    if (session.role === 'DRIVER') {
      allAttendance = allAttendance.filter((a) => a.driver_id === session.userId);
    } else if (session.role === 'SUPERVISOR') {
      // Supervisor sees their drivers
      const allUsers = await db.getUsers();
      const myDriverIds = new Set(
        allUsers.filter((u) => u.supervisor_id === session.userId).map((u) => u.id)
      );
      allAttendance = allAttendance.filter((a) => myDriverIds.has(a.driver_id));
    }

    // Apply query filters
    if (dateParam) {
      allAttendance = allAttendance.filter((a) => a.attendance_date === dateParam);
    }
    if (driverIdParam) {
      allAttendance = allAttendance.filter((a) => a.driver_id === driverIdParam);
    }
    if (supervisorIdParam && session.role === 'ADMIN') {
      const allUsers = await db.getUsers();
      const driverIds = new Set(
        allUsers.filter((u) => u.supervisor_id === supervisorIdParam).map((u) => u.id)
      );
      allAttendance = allAttendance.filter((a) => driverIds.has(a.driver_id));
    }

    // Sort newest date & time first
    allAttendance.sort((a, b) => b.created_at.localeCompare(a.created_at));

    return NextResponse.json({
      success: true,
      attendance: allAttendance,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: `Error: ${errMsg}` }, { status: 500 });
  }
}

// POST Driver Attendance Submission
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, message: 'Tidak terautentikasi' }, { status: 401 });
    }

    if (session.role !== 'DRIVER') {
      return NextResponse.json(
        { success: false, message: 'Hanya Driver yang dapat melakukan absensi ini' },
        { status: 403 }
      );
    }

    const settings = await db.getSettings();

    // 1. Check if attendance enabled
    if (!settings.attendance_enabled) {
      return NextResponse.json(
        { success: false, message: 'Absensi saat ini sedang dinonaktifkan oleh admin' },
        { status: 400 }
      );
    }

    const mTime = getMakassarTime();

    // 2. Check work day
    if (!isWorkDay(mTime.dayOfWeek, settings)) {
      return NextResponse.json(
        {
          success: false,
          code: 'OFF_DAY',
          message: 'Hari ini tidak ada jadwal absensi.',
        },
        { status: 400 }
      );
    }

    // 3. Check start time
    if (compareHHMM(mTime.hhmm, settings.attendance_start_time) < 0) {
      return NextResponse.json(
        {
          success: false,
          code: 'ATTENDANCE_NOT_OPEN',
          message: `Absensi belum dibuka. Absensi dapat dilakukan mulai pukul ${settings.attendance_start_time}.`,
        },
        { status: 400 }
      );
    }

    // 4. Check end time
    if (compareHHMM(mTime.hhmm, settings.attendance_end_time) > 0) {
      return NextResponse.json(
        {
          success: false,
          code: 'ATTENDANCE_CLOSED',
          message: `Waktu absen sudah berakhir. Absensi hari ini ditutup pukul ${settings.attendance_end_time}. Silakan ajukan izin.`,
        },
        { status: 400 }
      );
    }

    // 5. Check if driver already attended today
    const attendanceKey = `${session.userId}_${mTime.dateStr}`;
    const allAttendance = await db.getAttendance();
    const existing = allAttendance.find((a) => a.attendance_key === attendanceKey);
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          code: 'ALREADY_ATTENDED',
          message: 'Anda sudah melakukan absensi hari ini.',
          attendance: existing,
        },
        { status: 409 }
      );
    }

    // 6. Check GPS requirement
    const body = await req.json().catch(() => ({}));
    const { latitude = '', longitude = '', gps_accuracy = '', notes = '' } = body;

    if (settings.require_gps && (!latitude || !longitude)) {
      return NextResponse.json(
        {
          success: false,
          code: 'GPS_REQUIRED',
          message: 'Lokasi GPS diperlukan untuk melakukan absensi.',
        },
        { status: 400 }
      );
    }

    // 7. Check if driver has approved leave for today
    const allLeave = await db.getLeaveRequests();
    const approvedLeaveToday = allLeave.find(
      (l) =>
        l.driver_id === session.userId &&
        l.status === 'APPROVED' &&
        l.start_date <= mTime.dateStr &&
        l.end_date >= mTime.dateStr
    );

    if (approvedLeaveToday) {
      return NextResponse.json(
        {
          success: false,
          code: 'LEAVE_APPROVED',
          message: 'Izin Anda hari ini sudah disetujui. Anda tidak perlu melakukan absensi.',
        },
        { status: 400 }
      );
    }

    // Create attendance record
    const nowIso = new Date().toISOString();
    const newRecord: Attendance = {
      id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      attendance_key: attendanceKey,
      attendance_date: mTime.dateStr,
      attendance_time: mTime.timeStr,
      driver_id: session.userId,
      driver_name: session.name,
      latitude: String(latitude),
      longitude: String(longitude),
      gps_accuracy: String(gps_accuracy),
      source: 'DRIVER',
      notes: notes || 'Absen Driver PWA',
      created_at: nowIso,
      updated_at: nowIso,
    };

    await db.saveAttendance(newRecord);

    await db.logAudit({
      user_id: session.userId,
      user_name: session.name,
      action: 'ATTENDANCE_CREATED',
      reference_id: newRecord.id,
      new_value: JSON.stringify({
        date: newRecord.attendance_date,
        time: newRecord.attendance_time,
      }),
    });

    return NextResponse.json({
      success: true,
      message: 'Absensi berhasil dilakukan',
      attendance: newRecord,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('Submit attendance error:', err);
    return NextResponse.json({ success: false, message: `Error: ${errMsg}` }, { status: 500 });
  }
}
