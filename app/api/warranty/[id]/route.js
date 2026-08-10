import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db.js';
import Warranty from '../../../../models/Warranty.js';
import { authorizeApi, ROLES } from '../../../../lib/rbac.js';
import { calculateWarrantyStatus } from '../../../../lib/warranty-service.js';
import { logAudit } from '../../../../lib/audit.js';

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const auth = await authorizeApi(req, [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.SERVICE_MANAGER,
      ROLES.TECHNICIAN,
      ROLES.CUSTOMER,
    ]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const warranty = await Warranty.findById(params.id).populate({
      path: 'liftId',
      populate: { path: 'customerId' },
    });

    if (!warranty) {
      return NextResponse.json({ error: 'Warranty record not found' }, { status: 404 });
    }

    const obj = warranty.toObject();
    obj.computedStatus = calculateWarrantyStatus(warranty);

    return NextResponse.json({ success: true, warranty: obj });
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
    const warranty = await Warranty.findByIdAndUpdate(params.id, body, { new: true });
    if (!warranty) {
      return NextResponse.json({ error: 'Warranty record not found' }, { status: 404 });
    }

    await logAudit({
      userId: auth.user.id,
      action: 'UPDATE_WARRANTY',
      entity: 'Warranty',
      entityId: warranty._id.toString(),
    });

    return NextResponse.json({ success: true, warranty });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
