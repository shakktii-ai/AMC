import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db.js';
import User from '../../../../models/User.js';
import TechnicianProfile from '../../../../models/TechnicianProfile.js';
import { authorizeApi, ROLES } from '../../../../lib/rbac.js';
import { hashPassword } from '../../../../lib/auth.js';
import { logAudit } from '../../../../lib/audit.js';

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const auth = await authorizeApi(req, [ROLES.SUPER_ADMIN, ROLES.ADMIN]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const user = await User.findById(params.id).select('-password').populate('customerId');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let technicianProfile = null;
    if (user.role === ROLES.TECHNICIAN) {
      technicianProfile = await TechnicianProfile.findOne({ userId: user._id });
    }

    return NextResponse.json({ success: true, user, technicianProfile });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const auth = await authorizeApi(req, [ROLES.SUPER_ADMIN]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (body.name) user.name = body.name;
    if (body.phone) user.phone = body.phone;
    if (body.role) user.role = body.role;
    if (body.status) user.status = body.status;
    if (body.customerId !== undefined) user.customerId = body.customerId || null;

    if (body.password && body.password.length >= 6) {
      user.password = await hashPassword(body.password);
    }

    await user.save();

    if (user.role === ROLES.TECHNICIAN) {
      await TechnicianProfile.findOneAndUpdate(
        { userId: user._id },
        {
          zone: body.zone || 'DEFAULT_ZONE',
          skills: body.skills || ['GENERAL_MAINTENANCE'],
        },
        { upsert: true }
      );
    }

    await logAudit({
      userId: auth.user.id,
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: user._id.toString(),
      metadata: { role: user.role, status: user.status },
    });

    const userObj = user.toObject();
    delete userObj.password;

    return NextResponse.json({ success: true, user: userObj });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const auth = await authorizeApi(req, [ROLES.SUPER_ADMIN]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.status = 'INACTIVE';
    await user.save();

    await logAudit({
      userId: auth.user.id,
      action: 'DEACTIVATE_USER',
      entity: 'User',
      entityId: user._id.toString(),
    });

    return NextResponse.json({ success: true, message: 'User deactivated' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
