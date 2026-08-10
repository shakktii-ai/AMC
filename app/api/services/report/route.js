import { NextResponse } from 'next/server';
import crypto from 'crypto';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db.js';
import ServiceReport from '@/models/ServiceReport.js';
import Service from '@/models/Service.js';
import Complaint from '@/models/Complaint.js';
import Certificate from '@/models/Certificate.js';
import { authorizeApi, ROLES } from '@/lib/rbac.js';
import { serviceReportSchema } from '@/validators/schemas.js';
import { logAudit } from '@/lib/audit.js';

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
      let query = {};
      if (mongoose.Types.ObjectId.isValid(validated.serviceId)) {
        query = { $or: [{ _id: validated.serviceId }, { serviceId: validated.serviceId }] };
      } else {
        query = { serviceId: validated.serviceId };
      }

      service = await Service.findOne(query);
      if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

      // Ownership Check: Technician must be assigned to this service
      if (auth.user.role === ROLES.TECHNICIAN && String(service.technicianId) !== String(auth.user.id)) {
        return NextResponse.json({ error: 'Forbidden: Cannot submit report for a service assigned to another technician' }, { status: 403 });
      }
    }

    if (validated.complaintId) {
      let query = {};
      if (mongoose.Types.ObjectId.isValid(validated.complaintId)) {
        query = { $or: [{ _id: validated.complaintId }, { complaintId: validated.complaintId }] };
      } else {
        query = { complaintId: validated.complaintId };
      }

      complaint = await Complaint.findOne(query);
      if (!complaint) return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });

      // Ownership Check: Technician must be assigned to this complaint
      if (auth.user.role === ROLES.TECHNICIAN && String(complaint.assignedTechnician) !== String(auth.user.id)) {
        return NextResponse.json({ error: 'Forbidden: Cannot submit report for a complaint assigned to another technician' }, { status: 403 });
      }
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

      // Sanitize scheduledStartTime / scheduledEndTime if stored as string time format ("09:00") in legacy data
      if (typeof service.scheduledStartTime === 'string') {
        const d = new Date();
        const parts = service.scheduledStartTime.split(':');
        if (parts.length >= 2) {
          d.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
          service.scheduledStartTime = d;
        } else {
          service.scheduledStartTime = new Date();
        }
      }
      if (typeof service.scheduledEndTime === 'string') {
        const d = new Date();
        const parts = service.scheduledEndTime.split(':');
        if (parts.length >= 2) {
          d.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
          service.scheduledEndTime = d;
        } else {
          service.scheduledEndTime = new Date(Date.now() + 2 * 3600 * 1000);
        }
      }

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
