import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, hashPin } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak. Hanya Admin yang dapat mengedit user.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { employee_code, name, phone, pin, role, supervisor_id, status } = body;

    const existing = await db.getUserById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check phone uniqueness if phone is changing
    if (phone && phone.trim() !== existing.phone) {
      const phoneOwner = await db.getUserByPhone(phone.trim());
      if (phoneOwner && phoneOwner.id !== id) {
        return NextResponse.json(
          { success: false, message: 'Nomor HP sudah digunakan user lain' },
          { status: 409 }
        );
      }
    }

    let newPinHash = existing.pin_hash;
    if (pin && pin.trim()) {
      newPinHash = await hashPin(pin.trim());
    }

    const updatedUser = {
      ...existing,
      employee_code: employee_code !== undefined ? employee_code : existing.employee_code,
      name: name ? name.trim() : existing.name,
      phone: phone ? phone.trim() : existing.phone,
      pin_hash: newPinHash,
      role: role || existing.role,
      supervisor_id: supervisor_id !== undefined ? supervisor_id : existing.supervisor_id,
      status: status || existing.status,
      updated_at: new Date().toISOString(),
    };

    await db.saveUser(updatedUser);

    await db.logAudit({
      user_id: session.userId,
      user_name: session.name,
      action: existing.role === 'DRIVER' ? 'DRIVER_UPDATED' : 'USER_UPDATED',
      reference_id: id,
      old_value: JSON.stringify({ name: existing.name, phone: existing.phone, status: existing.status }),
      new_value: JSON.stringify({ name: updatedUser.name, phone: updatedUser.phone, status: updatedUser.status }),
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { pin_hash, ...safeUser } = updatedUser;

    return NextResponse.json({
      success: true,
      message: 'Data user berhasil diperbarui',
      user: safeUser,
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
        { success: false, message: 'Akses ditolak. Hanya Admin yang dapat menonaktifkan user.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await db.getUserById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const hardDelete = searchParams.get('hard') === 'true';

    await db.deleteUser(id, hardDelete);

    await db.logAudit({
      user_id: session.userId,
      user_name: session.name,
      action: existing.role === 'DRIVER' ? 'DRIVER_DISABLED' : 'USER_DISABLED',
      reference_id: id,
      old_value: JSON.stringify({ name: existing.name, phone: existing.phone, status: existing.status }),
    });

    return NextResponse.json({
      success: true,
      message: hardDelete ? 'User berhasil dihapus' : 'User berhasil dinonaktifkan',
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: `Error: ${errMsg}` }, { status: 500 });
  }
}
