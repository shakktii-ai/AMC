import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '../../../../lib/db.js';
import ServiceReport from '../../../../models/ServiceReport.js';
import Service from '../../../../models/Service.js';
import Complaint from '../../../../models/Complaint.js';
import Certificate from '../../../../models/Certificate.js';
import { authorizeApi, ROLES } from '../../../../lib/rbac.js';
import { serviceReportSchema } from '../../../../validators/schemas.js';
import { logAudit } from '../../../../lib/audit.js';

export async function POST(req) {
  try {
    await dbConnect();
    const auth = await authorizeApi(req, [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SERVICE_MANAGER, ROLES.TECHNICIAN]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const validated = serviceReportSchema.parse(body);

    let service = null;
    let complaint = null;

    if (validated.serviceId) {
      service = await Service.findById(validated.serviceId);
      if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    if (validated.complaintId) {
      complaint = await Complaint.findById(validated.complaintId);
      if (!complaint) return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    const reportId = `RPT-${Date.now().toString().slice(-6)}`;

    const report = await ServiceReport.create({
      reportId,
      serviceId: service ? service._id : null,
      complaintId: complaint ? complaint._id : null,
      technicianId: auth.user.id,
      checklist: validated.checklist || [],
      findings: validated.findings || '',
      workPerformed: validated.workPerformed,
      partsReplacedNotes: validated.partsReplacedNotes || '',
      beforePhotos: validated.beforePhotos || [],
      afterPhotos: validated.afterPhotos || [],
      customerConfirmation: validated.customerConfirmation ?? true,
      signature: validated.signature || '',
      signedAt: validated.signature ? new Date() : null,
      completedAt: new Date(),
    });

    if (service) {
      service.status = 'COMPLETED';
      service.actualEndTime = new Date();
      await service.save();
    }

    if (complaint) {
      complaint.status = 'RESOLVED';
      complaint.resolvedAt = new Date();
      await complaint.save();
    }

    // Generate Service Completion Certificate if linked to customer
    const customerId = service ? service.customerId : complaint ? complaint.customerId : null;
    const liftId = service ? service.liftId : complaint ? complaint.liftId : null;

    if (customerId) {
      const certToken = `CERT-SRV-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
      await Certificate.create({
        certificateId: `CERT-SC-${Date.now().toString().slice(-6)}`,
        certificateType: 'SERVICE_COMPLETION',
        verificationToken: certToken,
        title: `Service Completion Certificate - ${reportId}`,
        liftId,
        customerId,
        serviceId: service ? service._id : null,
        issueDate: new Date(),
        details: `Service work performed: ${validated.workPerformed}`,
      });
    }

    await logAudit({
      userId: auth.user.id,
      action: 'SUBMIT_SERVICE_REPORT',
      entity: 'ServiceReport',
      entityId: report._id.toString(),
    });

    return NextResponse.json({ success: true, report }, { status: 201 });
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
