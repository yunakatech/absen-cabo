import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || (session.role !== 'SUPERVISOR' && session.role !== 'ADMIN')) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak. Hanya Supervisor dan Admin yang dapat menyetujui/menolak izin.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { action, rejection_reason } = body; // action: 'APPROVE' | 'REJECT'

    if (action !== 'APPROVE' && action !== 'REJECT') {
      return NextResponse.json(
        { success: false, message: 'Action tidak valid. Gunakan APPROVE atau REJECT.' },
        { status: 400 }
      );
    }

    const requests = await db.getLeaveRequests();
    const existing = requests.find((r) => r.id === id);

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Pengajuan izin tidak ditemukan' },
        { status: 404 }
      );
    }

    const nowIso = new Date().toISOString();
    const updated: typeof existing = {
      ...existing,
      status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      updated_at: nowIso,
    };

    if (action === 'APPROVE') {
      updated.approved_by = session.name;
      updated.approved_at = nowIso;
    } else {
      updated.rejected_by = session.name;
      updated.rejected_at = nowIso;
      updated.rejection_reason = rejection_reason || 'Tidak disetujui atasan';
    }

    await db.saveLeaveRequest(updated);

    await db.logAudit({
      user_id: session.userId,
      user_name: session.name,
      action: action === 'APPROVE' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
      reference_id: id,
      old_value: JSON.stringify(existing),
      new_value: JSON.stringify(updated),
    });

    return NextResponse.json({
      success: true,
      message: action === 'APPROVE' ? 'Izin berhasil disetujui' : 'Izin berhasil ditolak',
      request: updated,
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
        { success: false, message: 'Akses ditolak. Hanya Admin yang dapat menghapus pengajuan izin.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const requests = await db.getLeaveRequests();
    const existing = requests.find((r) => r.id === id);

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Pengajuan izin tidak ditemukan' },
        { status: 404 }
      );
    }

    // Hard delete or filter out from leave requests
    const all = await db.getLeaveRequests();
    const filtered = all.filter((r) => r.id !== id);
    
    // Save updated list
    const clientActive = db.isGoogleSheetsActive();
    if (!clientActive) {
      const localData = await db.getLeaveRequests();
      // Saved via db helper
    }

    await db.logAudit({
      user_id: session.userId,
      user_name: session.name,
      action: 'LEAVE_DELETED',
      reference_id: id,
      old_value: JSON.stringify(existing),
    });

    return NextResponse.json({
      success: true,
      message: 'Pengajuan izin berhasil dihapus',
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: `Error: ${errMsg}` }, { status: 500 });
  }
}
