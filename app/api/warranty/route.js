import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '../../../lib/db.js';
import Warranty from '../../../models/Warranty.js';
import Lift from '../../../models/Lift.js';
import Certificate from '../../../models/Certificate.js';
import { authorizeApi, ROLES } from '../../../lib/rbac.js';
import { calculateWarrantyStatus } from '../../../lib/warranty-service.js';
import { logAudit } from '../../../lib/audit.js';

export async function GET(req) {
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

    const { searchParams } = new URL(req.url);
    const liftId = searchParams.get('liftId');

    let query = {};
    if (liftId) query.liftId = liftId;

    if (auth.user.role === ROLES.CUSTOMER) {
      const customerLifts = await Lift.find({ customerId: auth.user.customerId }).select('_id');
      const liftIds = customerLifts.map((l) => l._id);
      query.liftId = { $in: liftIds };
    }

    const warranties = await Warranty.find(query)
      .populate({
        path: 'liftId',
        populate: { path: 'customerId', select: 'name companyName email phone' },
      })
      .sort({ endDate: -1 });

    const processedWarranties = warranties.map((w) => {
      const doc = w.toObject();
      doc.computedStatus = calculateWarrantyStatus(w);
      return doc;
    });

    return NextResponse.json({ success: true, warranties: processedWarranties });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const auth = await authorizeApi(req, [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SERVICE_MANAGER]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const lift = await Lift.findById(body.liftId);
    if (!lift) {
      return NextResponse.json({ error: 'Lift not found' }, { status: 404 });
    }

    const warrantyId = `WRN-${Date.now().toString().slice(-6)}`;
    const certificateToken = `CERT-WRN-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    const warranty = await Warranty.create({
      warrantyId,
      liftId: lift._id,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      coverage: body.coverage || 'Full manufacturer warranty including parts and preventive maintenance',
      exclusions: body.exclusions || 'Vandalism, acts of God, un-authorized tampering',
      status: 'ACTIVE',
      certificateToken,
    });

    lift.status = 'UNDER_WARRANTY';
    await lift.save();

    // Create Warranty Certificate
    await Certificate.create({
      certificateId: `CERT-W-${Date.now().toString().slice(-6)}`,
      certificateType: 'WARRANTY',
      verificationToken: certificateToken,
      title: `Warranty Certificate - ${lift.assetCode}`,
      liftId: lift._id,
      customerId: lift.customerId,
      warrantyId: warranty._id,
      issueDate: new Date(),
      expiryDate: new Date(body.endDate),
      details: `Official Warranty Coverage for Lift Serial #${lift.serialNumber}`,
    });

    await logAudit({
      userId: auth.user.id,
      action: 'CREATE_WARRANTY',
      entity: 'Warranty',
      entityId: warranty._id.toString(),
    });

    return NextResponse.json({ success: true, warranty }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
