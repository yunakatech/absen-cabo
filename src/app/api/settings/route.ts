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

    const rawBody = await req.json();
    const input = rawBody.settings || rawBody;
    const oldSettings = await db.getSettings();

    // Parse work_days string (e.g. "1,2,3,4,5,6") if provided
    let workDaysList: string[] | null = null;
    if (typeof input.work_days === 'string') {
      workDaysList = input.work_days.split(',').map((d: string) => d.trim());
    }

    // Format start & end time
    let startTime = oldSettings.attendance_start_time;
    if (input.attendance_start_time) {
      startTime = input.attendance_start_time.length === 5
        ? `${input.attendance_start_time}:00`
        : input.attendance_start_time;
    }

    let endTime = oldSettings.attendance_end_time;
    if (input.attendance_end_time) {
      endTime = input.attendance_end_time.length === 5
        ? `${input.attendance_end_time}:00`
        : input.attendance_end_time;
    }

    const updatedSettingsPayload = {
      company_name: input.company_name ?? oldSettings.company_name,
      timezone: input.timezone ?? oldSettings.timezone,
      attendance_enabled:
        input.attendance_enabled !== undefined
          ? String(input.attendance_enabled) === 'true'
          : oldSettings.attendance_enabled,
      attendance_start_time: startTime,
      attendance_end_time: endTime,
      require_gps:
        input.require_gps !== undefined
          ? String(input.require_gps) === 'true'
          : oldSettings.require_gps,
      leave_enabled:
        input.leave_enabled !== undefined
          ? String(input.leave_enabled) === 'true'
          : oldSettings.leave_enabled,
      leave_reason_required:
        input.leave_reason_required !== undefined
          ? String(input.leave_reason_required) === 'true'
          : oldSettings.leave_reason_required,

      // Work days mapping
      monday_enabled: workDaysList ? workDaysList.includes('1') : oldSettings.monday_enabled,
      tuesday_enabled: workDaysList ? workDaysList.includes('2') : oldSettings.tuesday_enabled,
      wednesday_enabled: workDaysList ? workDaysList.includes('3') : oldSettings.wednesday_enabled,
      thursday_enabled: workDaysList ? workDaysList.includes('4') : oldSettings.thursday_enabled,
      friday_enabled: workDaysList ? workDaysList.includes('5') : oldSettings.friday_enabled,
      saturday_enabled: workDaysList ? workDaysList.includes('6') : oldSettings.saturday_enabled,
      sunday_enabled: workDaysList ? workDaysList.includes('0') : oldSettings.sunday_enabled,
    };

    const newSettings = await db.saveSettings(updatedSettingsPayload);

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
