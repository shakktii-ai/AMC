import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db.js';
import Lift from '@/models/Lift.js';
import Warranty from '@/models/Warranty.js';
import AMC from '@/models/AMC.js';
import Service from '@/models/Service.js';
import Complaint from '@/models/Complaint.js';
import { authorizeApi, ROLES, validateCustomerOwnership } from '@/lib/rbac.js';
import { logAudit } from '@/lib/audit.js';

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const auth = await authorizeApi(req, [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.SERVICE_MANAGER,
      ROLES.TECHNICIAN,
      ROLES.ACCOUNTANT,
      ROLES.CUSTOMER,
    ]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let query = {};
    if (mongoose.Types.ObjectId.isValid(params.id)) {
      query = { $or: [{ _id: params.id }, { liftId: params.id }, { assetCode: params.id }] };
    } else {
      query = { $or: [{ liftId: params.id }, { assetCode: params.id }] };
    }

    const lift = await Lift.findOne(query).populate('customerId');
    if (!lift) {
      return NextResponse.json({ error: 'Lift not found' }, { status: 404 });
    }

    // IDOR Protection: CUSTOMER role must own this lift
    if (!validateCustomerOwnership(auth.user, lift.customerId._id.toString())) {
      return NextResponse.json({ error: 'Forbidden: Access denied to lift details' }, { status: 403 });
    }

    const [warranties, amcs, services, complaints] = await Promise.all([
      Warranty.find({ liftId: lift._id }).sort({ createdAt: -1 }),
      AMC.find({ liftIds: lift._id }).sort({ createdAt: -1 }),
      Service.find({ liftId: lift._id }).populate('technicianId', 'name phone').sort({ scheduledStartTime: -1 }),
      Complaint.find({ liftId: lift._id }).populate('assignedTechnician', 'name phone').sort({ createdAt: -1 }),
    ]);

    return NextResponse.json({
      success: true,
      lift,
      warranties,
      amcs,
      services,
      complaints,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const auth = await authorizeApi(req, [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SERVICE_MANAGER]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();

    let query = {};
    if (mongoose.Types.ObjectId.isValid(params.id)) {
      query = { $or: [{ _id: params.id }, { liftId: params.id }, { assetCode: params.id }] };
    } else {
      query = { $or: [{ liftId: params.id }, { assetCode: params.id }] };
    }

    const lift = await Lift.findOneAndUpdate(query, body, { new: true, runValidators: true });
    if (!lift) {
      return NextResponse.json({ error: 'Lift not found' }, { status: 404 });
    }

    await logAudit({
      userId: auth.user.id,
      action: 'UPDATE_LIFT',
      entity: 'Lift',
      entityId: lift._id.toString(),
    });

    return NextResponse.json({ success: true, lift });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
