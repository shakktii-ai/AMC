import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db.js';
import Document from '../../../models/Document.js';
import { authorizeApi, ROLES } from '../../../lib/rbac.js';
import { logAudit } from '../../../lib/audit.js';

export async function GET(req) {
  try {
    await dbConnect();
    const auth = await authorizeApi(req, [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.SERVICE_MANAGER,
      ROLES.ACCOUNTANT,
      ROLES.CUSTOMER,
    ]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let query = {};
    if (auth.user.role === ROLES.CUSTOMER) {
      if (!auth.user.customerId) return NextResponse.json({ success: true, documents: [] });
      query.customerId = auth.user.customerId;
    }

    const documents = await Document.find(query)
      .populate('customerId', 'name companyName')
      .populate('liftId', 'liftId assetCode')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, documents });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const auth = await authorizeApi(req, [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SERVICE_MANAGER, ROLES.ACCOUNTANT]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const documentId = `DOC-${Date.now().toString().slice(-6)}`;

    const doc = await Document.create({
      documentId,
      name: body.name,
      fileUrl: body.fileUrl || '#',
      fileType: body.fileType || 'application/pdf',
      fileSize: body.fileSize || 1024,
      category: body.category || 'OTHER',
      customerId: body.customerId,
      liftId: body.liftId || null,
      amcId: body.amcId || null,
      serviceId: body.serviceId || null,
      invoiceId: body.invoiceId || null,
      uploadedBy: auth.user.id,
    });

    await logAudit({
      userId: auth.user.id,
      action: 'UPLOAD_DOCUMENT',
      entity: 'Document',
      entityId: doc._id.toString(),
    });

    return NextResponse.json({ success: true, document: doc }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
