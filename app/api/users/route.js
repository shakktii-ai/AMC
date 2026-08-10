import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db.js';
import User from '@/models/User.js';
import TechnicianProfile from '@/models/TechnicianProfile.js';
import { authorizeApi, ROLES } from '@/lib/rbac.js';
import { userCreateSchema } from '@/validators/schemas.js';
import { hashPassword } from '@/lib/auth.js';
import { logAudit } from '@/lib/audit.js';

export async function GET(req) {
  try {
    await dbConnect();
    const auth = await authorizeApi(req, [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.SERVICE_MANAGER,
      ROLES.TECHNICIAN,
      ROLES.ACCOUNTANT,
    ]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const query = {};
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).select('-password').populate('customerId').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, users });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const auth = await authorizeApi(req, [ROLES.SUPER_ADMIN]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const validated = userCreateSchema.parse(body);

    const existing = await User.findOne({ email: validated.email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const hashedPassword = await hashPassword(validated.password);

    const newUser = await User.create({
      name: validated.name,
      email: validated.email.toLowerCase(),
      phone: validated.phone,
      password: hashedPassword,
      role: validated.role,
      status: validated.status || 'ACTIVE',
      customerId: validated.customerId || null,
    });

    if (validated.role === ROLES.TECHNICIAN) {
      await TechnicianProfile.create({
        userId: newUser._id,
        zone: validated.zone || 'DEFAULT_ZONE',
        skills: validated.skills || ['GENERAL_MAINTENANCE'],
        status: 'AVAILABLE',
        activeJobsCount: 0,
      });
    }

    await logAudit({
      userId: auth.user.id,
      action: 'CREATE_USER',
      entity: 'User',
      entityId: newUser._id.toString(),
      metadata: { role: newUser.role, email: newUser.email },
    });

    const userObj = newUser.toObject();
    delete userObj.password;

    return NextResponse.json({ success: true, user: userObj }, { status: 201 });
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
