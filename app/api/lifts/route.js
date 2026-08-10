import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db.js';
import Lift from '@/models/Lift.js';
import Customer from '@/models/Customer.js';
import { authorizeApi, ROLES } from '@/lib/rbac.js';
import { liftSchema } from '@/validators/schemas.js';
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
      ROLES.CUSTOMER,
    ]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const customerIdParam = searchParams.get('customerId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    let query = {};

    if (auth.user.role === ROLES.CUSTOMER) {
      if (!auth.user.customerId) {
        return NextResponse.json({ success: true, lifts: [] });
      }
      query.customerId = auth.user.customerId;
    } else if (customerIdParam) {
      query.customerId = customerIdParam;
    }

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { liftId: { $regex: search, $options: 'i' } },
        { assetCode: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
        { buildingName: { $regex: search, $options: 'i' } },
      ];
    }

    const lifts = await Lift.find(query).populate('customerId', 'name companyName email phone').sort({ createdAt: -1 });
    return NextResponse.json({ success: true, lifts });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    // Strictly restricted to SUPER_ADMIN & ADMIN (Customers cannot create official master assets!)
    const auth = await authorizeApi(req, [ROLES.SUPER_ADMIN, ROLES.ADMIN]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const validated = liftSchema.parse(body);

    // Parent validation: Ensure Customer exists
    const customer = await Customer.findById(validated.customerId);
    if (!customer) {
      return NextResponse.json({ error: 'Parent Customer record not found. Orphan lifts are not allowed.' }, { status: 400 });
    }

    const existing = await Lift.findOne({ $or: [{ liftId: validated.liftId }, { assetCode: validated.assetCode }] });
    if (existing) {
      return NextResponse.json({ error: 'Lift ID or Asset Code already exists' }, { status: 400 });
    }

    const verificationToken = `LIFT-QR-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    const lift = await Lift.create({
      ...validated,
      verificationToken,
    });

    await logAudit({
      userId: auth.user.id,
      action: 'CREATE_LIFT',
      entity: 'Lift',
      entityId: lift._id.toString(),
      metadata: { liftId: lift.liftId, buildingName: lift.buildingName },
    });

    return NextResponse.json({ success: true, lift }, { status: 201 });
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
