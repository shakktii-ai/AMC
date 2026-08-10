import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db.js';
import Complaint from '../../../../models/Complaint.js';
import Lift from '../../../../models/Lift.js';
import ServiceReport from '../../../../models/ServiceReport.js';
import { authorizeApi, ROLES, validateCustomerOwnership, validateTechnicianOwnership } from '../../../../lib/rbac.js';
import { calculateSlaStatus } from '../../../../lib/sla.js';
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

    const complaint = await Complaint.findById(params.id)
      .populate('customerId')
      .populate('liftId')
      .populate('assignedTechnician', 'name phone email');

    if (!complaint) {
      return NextResponse.json({ error: 'Complaint record not found' }, { status: 404 });
    }

    // IDOR Protection: CUSTOMER role check
    if (auth.user.role === ROLES.CUSTOMER && !validateCustomerOwnership(auth.user, complaint.customerId._id.toString())) {
      return NextResponse.json({ error: 'Forbidden: Access denied to complaint' }, { status: 403 });
    }

    // Technician Ownership Check: TECHNICIAN role check
    if (auth.user.role === ROLES.TECHNICIAN && String(complaint.assignedTechnician?._id || complaint.assignedTechnician) !== String(auth.user.id)) {
      return NextResponse.json({ error: 'Forbidden: Access denied to complaint assigned to another technician' }, { status: 403 });
    }

    const serviceReport = await ServiceReport.findOne({ complaintId: complaint._id });

    const obj = complaint.toObject();
    obj.slaStatus = calculateSlaStatus(complaint);

    return NextResponse.json({ success: true, complaint: obj, serviceReport });
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
    const complaint = await Complaint.findById(params.id);
    if (!complaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    if (auth.user.role === ROLES.TECHNICIAN && String(complaint.assignedTechnician) !== String(auth.user.id)) {
      return NextResponse.json({ error: 'Forbidden: Cannot update complaint assigned to another technician' }, { status: 403 });
    }

    if (body.status) {
      complaint.status = body.status;
      if (['RESOLVED', 'CLOSED'].includes(body.status)) {
        complaint.resolvedAt = new Date();
        const lift = await Lift.findById(complaint.liftId);
        if (lift && lift.status === 'BREAKDOWN') {
          lift.status = 'ACTIVE';
          await lift.save();
        }
      }
    }

    if (body.priority) complaint.priority = body.priority;
    if (body.assignedTechnician) complaint.assignedTechnician = body.assignedTechnician;

    await complaint.save();

    await logAudit({
      userId: auth.user.id,
      action: 'UPDATE_COMPLAINT',
      entity: 'Complaint',
      entityId: complaint._id.toString(),
      metadata: { status: complaint.status },
    });

    return NextResponse.json({ success: true, complaint });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
