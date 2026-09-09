import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, hashPin } from '@/lib/auth';
import { db } from '@/lib/db';
import { User } from '@/lib/types';

// GET Users (Admin & Supervisor)
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPERVISOR')) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get('role');
    const statusParam = searchParams.get('status');

    let users = await db.getUsers();

    if (session.role === 'SUPERVISOR') {
      // Supervisor sees only their drivers
      users = users.filter((u) => u.supervisor_id === session.userId);
    }

    if (roleParam) {
      users = users.filter((u) => u.role === roleParam);
    }

    if (statusParam) {
      users = users.filter((u) => u.status === statusParam);
    }

    // Omit pin_hash for response security
    const safeUsers = users.map((u) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { pin_hash, ...rest } = u;
      return rest;
    });

    return NextResponse.json({
      success: true,
      users: safeUsers,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: `Error: ${errMsg}` }, { status: 500 });
  }
}

// POST Create User (Admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak. Hanya Admin yang dapat membuat user baru.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { employee_code, name, phone, pin, role = 'DRIVER', supervisor_id = '', status = 'ACTIVE' } = body;

    if (!name || !phone || !pin) {
      return NextResponse.json(
        { success: false, message: 'Nama, Nomor HP, dan PIN wajib diisi' },
        { status: 400 }
      );
    }

    const existingUser = await db.getUserByPhone(phone.trim());
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Nomor HP sudah terdaftar' },
        { status: 409 }
      );
    }

    const pinHash = await hashPin(pin.trim());
    const nowIso = new Date().toISOString();

    const newUser: User = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      employee_code: employee_code || `DR${Math.floor(100 + Math.random() * 900)}`,
      name: name.trim(),
      phone: phone.trim(),
      pin_hash: pinHash,
      role,
      supervisor_id: supervisor_id || '',
      status,
      created_at: nowIso,
      updated_at: nowIso,
    };

    await db.saveUser(newUser);

    await db.logAudit({
      user_id: session.userId,
      user_name: session.name,
      action: role === 'DRIVER' ? 'DRIVER_CREATED' : 'USER_CREATED',
      reference_id: newUser.id,
      new_value: JSON.stringify({ name: newUser.name, phone: newUser.phone, role: newUser.role }),
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { pin_hash, ...safeUser } = newUser;

    return NextResponse.json({
      success: true,
      message: `${role === 'DRIVER' ? 'Driver' : 'User'} berhasil ditambahkan`,
      user: safeUser,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, message: `Error: ${errMsg}` }, { status: 500 });
  }
}
