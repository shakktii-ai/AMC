import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db.js';
import Service from '@/models/Service.js';
import ServiceReport from '@/models/ServiceReport.js';
import { authorizeApi, ROLES, validateTechnicianOwnership, validateCustomerOwnership } from '@/lib/rbac.js';
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

    const service = await Service.findById(params.id)
      .populate('customerId')
      .populate('liftId')
      .populate('amcId')
      .populate('technicianId', 'name email phone');

    if (!service) {
      return NextResponse.json({ error: 'Service record not found' }, { status: 404 });
    }

    // IDOR Protection: CUSTOMER role check
    if (auth.user.role === ROLES.CUSTOMER && !validateCustomerOwnership(auth.user, service.customerId._id.toString())) {
      return NextResponse.json({ error: 'Forbidden: Access denied to service' }, { status: 403 });
    }

    // Technician Ownership Protection: TECHNICIAN role check
    if (auth.user.role === ROLES.TECHNICIAN && String(service.technicianId?._id || service.technicianId) !== String(auth.user.id)) {
      return NextResponse.json({ error: 'Forbidden: Access denied to service assigned to another technician' }, { status: 403 });
    }

    const serviceReport = await ServiceReport.findOne({ serviceId: service._id });

    return NextResponse.json({ success: true, service, serviceReport });
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
    const service = await Service.findById(params.id);
    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Technician Ownership Check
    if (auth.user.role === ROLES.TECHNICIAN && String(service.technicianId) !== String(auth.user.id)) {
      return NextResponse.json({ error: 'Forbidden: Cannot modify service assigned to another technician' }, { status: 403 });
    }

    if (body.technicianId) {
      service.technicianId = body.technicianId;
      service.status = 'ASSIGNED';
    }

    if (body.status) {
      service.status = body.status;
      if (body.status === 'IN_PROGRESS' && !service.actualStartTime) {
        service.actualStartTime = new Date();
      }
      if (body.status === 'COMPLETED') {
        service.actualEndTime = new Date();
      }
    }

    if (body.scheduledStartTime) service.scheduledStartTime = body.scheduledStartTime;
    if (body.scheduledEndTime) service.scheduledEndTime = body.scheduledEndTime;
    if (body.notes) service.notes = body.notes;

    await service.save();

    await logAudit({
      userId: auth.user.id,
      action: 'UPDATE_SERVICE',
      entity: 'Service',
      entityId: service._id.toString(),
      metadata: { status: service.status },
    });

    return NextResponse.json({ success: true, service });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
