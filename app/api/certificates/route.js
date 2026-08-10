import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '../../../lib/db.js';
import Certificate from '../../../models/Certificate.js';
import { authorizeApi, ROLES } from '../../../lib/rbac.js';
import { logAudit } from '../../../lib/audit.js';

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

    let query = {};
    if (auth.user.role === ROLES.CUSTOMER) {
      if (!auth.user.customerId) return NextResponse.json({ success: true, certificates: [] });
      query.customerId = auth.user.customerId;
    }

    const certificates = await Certificate.find(query)
      .populate('customerId', 'name companyName')
      .populate('liftId', 'liftId assetCode buildingName')
      .sort({ issueDate: -1 });

    return NextResponse.json({ success: true, certificates });
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
    const verificationToken = `CERT-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
    const certificateId = `CERT-${Date.now().toString().slice(-6)}`;

    const certificate = await Certificate.create({
      certificateId,
      certificateType: body.certificateType || 'AMC',
      verificationToken,
      title: body.title,
      liftId: body.liftId || null,
      customerId: body.customerId,
      amcId: body.amcId || null,
      serviceId: body.serviceId || null,
      warrantyId: body.warrantyId || null,
      issueDate: new Date(),
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
      details: body.details || '',
    });

    await logAudit({
      userId: auth.user.id,
      action: 'CREATE_CERTIFICATE',
      entity: 'Certificate',
      entityId: certificate._id.toString(),
    });

    return NextResponse.json({ success: true, certificate }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
