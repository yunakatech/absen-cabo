import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { getMakassarTime } from '@/lib/time';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERVISOR')) {
      return NextResponse.json({ success: false, message: 'Akses ditolak' }, { status: 403 });
    }

    const mTime = getMakassarTime();
    const today = mTime.dateStr;

    let users = await db.getUsers();
    let attendance = await db.getAttendance();
    let leaveRequests = await db.getLeaveRequests();

    // Filter by supervisor if supervisor role
    if (session.role === 'SUPERVISOR') {
      const myDriverIds = new Set(
        users.filter((u) => u.supervisor_id === session.userId).map((u) => u.id)
      );
      users = users.filter((u) => myDriverIds.has(u.id));
      attendance = attendance.filter((a) => myDriverIds.has(a.driver_id));
      leaveRequests = leaveRequests.filter((l) => myDriverIds.has(l.driver_id));
    }

    const activeDrivers = users.filter((u) => u.role === 'DRIVER' && u.status === 'ACTIVE');
    const totalDrivers = activeDrivers.length;

    // Today's attendance
    const todayAttendance = attendance.filter((a) => a.attendance_date === today);
    const attendedDriverIds = new Set(todayAttendance.map((a) => a.driver_id));
    const sudahAbsenCount = attendedDriverIds.size;

    // Today's approved leave (excluding drivers who already attended today to prevent double-counting)
    const todayApprovedLeave = leaveRequests.filter(
      (l) =>
        l.status === 'APPROVED' &&
        l.start_date <= today &&
        l.end_date >= today &&
        !attendedDriverIds.has(l.driver_id)
    );
    const leaveApprovedDriverIds = new Set(todayApprovedLeave.map((l) => l.driver_id));
    const izinDisetujuiCount = leaveApprovedDriverIds.size;

    // Pending leave requests
    const pendingLeaveCount = leaveRequests.filter((l) => l.status === 'PENDING').length;
    const approvedLeaveCount = leaveRequests.filter((l) => l.status === 'APPROVED').length;
    const rejectedLeaveCount = leaveRequests.filter((l) => l.status === 'REJECTED').length;

    // Drivers who haven't attended and are not on approved leave today
    const belumAbsenDrivers = activeDrivers.filter(
      (d) => !attendedDriverIds.has(d.id) && !leaveApprovedDriverIds.has(d.id)
    );

    // Percentage
    const percentage = totalDrivers > 0 ? ((sudahAbsenCount / totalDrivers) * 100).toFixed(1) : '0.0';

    return NextResponse.json({
      success: true,
      todayDate: today,
      formattedDate: mTime.formattedFull,
      stats: {
        totalDrivers,
        sudahAbsen: sudahAbsenCount,
        belumAbsen: belumAbsenDrivers.length,
        izinDisetujui: izinDisetujuiCount,
        izinMenunggu: pendingLeaveCount,
        attendancePercentage: Number(percentage),
        leaveSummary: {
          pending: pendingLeaveCount,
          approved: approvedLeaveCount,
          rejected: rejectedLeaveCount,
        },
      },
      belumAbsenList: belumAbsenDrivers.map((d) => ({
        id: d.id,
        employee_code: d.employee_code,
        name: d.name,
        phone: d.phone,
      })),
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: `Error: ${errMsg}` }, { status: 500 });
  }
}
