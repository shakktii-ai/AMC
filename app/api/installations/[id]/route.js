import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db.js';
import Installation from '@/models/Installation.js';
import Lift from '@/models/Lift.js';
import Certificate from '@/models/Certificate.js';
import { authorizeApi, ROLES } from '@/lib/rbac.js';
import { logAudit } from '@/lib/audit.js';

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

    const installation = await Installation.findById(params.id)
      .populate('liftId')
      .populate('customerId')
      .populate('assignedTechnicianId', 'name phone email');

    if (!installation) {
      return NextResponse.json({ error: 'Installation record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, installation });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const auth = await authorizeApi(req, [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SERVICE_MANAGER, ROLES.TECHNICIAN]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const installation = await Installation.findById(params.id);
    if (!installation) {
      return NextResponse.json({ error: 'Installation not found' }, { status: 404 });
    }

    if (body.assignedTechnicianId) installation.assignedTechnicianId = body.assignedTechnicianId;
    if (body.scheduledDate) installation.scheduledDate = body.scheduledDate;
    if (body.status) installation.status = body.status;
    if (body.safetyChecklist) installation.safetyChecklist = body.safetyChecklist;
    if (body.inspectionNotes) installation.inspectionNotes = body.inspectionNotes;

    if (body.status === 'COMMISSIONED') {
      installation.commissioningDate = new Date();
    }

    if (body.status === 'HANDED_OVER') {
      installation.handoverDate = new Date();
      installation.completedDate = new Date();

      // Update lift status to ACTIVE or UNDER_WARRANTY
      const lift = await Lift.findById(installation.liftId);
      if (lift) {
        lift.status = 'ACTIVE';
        await lift.save();
      }

      // Generate Handover Certificate
      const verificationToken = `CERT-HANDOVER-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
      await Certificate.create({
        certificateId: `CERT-HO-${Date.now().toString().slice(-6)}`,
        certificateType: 'HANDOVER',
        verificationToken,
        title: `Handover Certificate - Lift ${lift ? lift.assetCode : installation.liftId}`,
        liftId: installation.liftId,
        customerId: installation.customerId,
        issueDate: new Date(),
        details: `Lift installation successfully inspected, commissioned, and handed over to customer.`,
      });
    }

    await installation.save();

    await logAudit({
      userId: auth.user.id,
      action: 'UPDATE_INSTALLATION',
      entity: 'Installation',
      entityId: installation._id.toString(),
      metadata: { status: installation.status },
    });

    return NextResponse.json({ success: true, installation });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
