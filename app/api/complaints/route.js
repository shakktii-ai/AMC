import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db.js';
import Complaint from '@/models/Complaint.js';
import Lift from '@/models/Lift.js';
import { authorizeApi, ROLES } from '@/lib/rbac.js';
import { complaintSchema } from '@/validators/schemas.js';
import { getSlaTargetMinutes, calculateSlaDueDate, calculateSlaStatus } from '@/lib/sla.js';
import { logAudit } from '@/lib/audit.js';

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
    const priority = searchParams.get('priority');
    const status = searchParams.get('status');

    let query = {};

    if (auth.user.role === ROLES.CUSTOMER) {
      if (!auth.user.customerId) return NextResponse.json({ success: true, complaints: [] });
      query.customerId = auth.user.customerId;
    } else if (auth.user.role === ROLES.TECHNICIAN) {
      query.assignedTechnician = auth.user.id;
    }

    if (priority) query.priority = priority;
    if (status) query.status = status;

    const complaints = await Complaint.find(query)
      .populate('customerId', 'name companyName email phone')
      .populate('liftId', 'liftId assetCode buildingName floor wing locationNotes')
      .populate('assignedTechnician', 'name phone email')
      .sort({ createdAt: -1 });

    const processedComplaints = complaints.map((c) => {
      const obj = c.toObject();
      obj.slaStatus = calculateSlaStatus(c);
      return obj;
    });

    return NextResponse.json({ success: true, complaints: processedComplaints });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const auth = await authorizeApi(req, [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SERVICE_MANAGER, ROLES.CUSTOMER]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const validated = complaintSchema.parse(body);

    const lift = await Lift.findById(validated.liftId);
    if (!lift) {
      return NextResponse.json({ error: 'Lift not found' }, { status: 404 });
    }

    let customerId = lift.customerId;
    if (auth.user.role === ROLES.CUSTOMER) {
      if (String(lift.customerId) !== String(auth.user.customerId)) {
        return NextResponse.json({ error: 'Forbidden: Cannot log complaint for another customer lift' }, { status: 403 });
      }
      customerId = auth.user.customerId;
    }

    const complaintId = `CMP-${Date.now().toString().slice(-6)}`;
    const slaTargetMinutes = getSlaTargetMinutes(validated.priority);
    const createdAt = new Date();
    const slaDueDate = calculateSlaDueDate(createdAt, validated.priority);

    const complaint = await Complaint.create({
      complaintId,
      customerId,
      liftId: lift._id,
      category: validated.category,
      priority: validated.priority,
      description: validated.description,
      status: 'REGISTERED',
      slaTargetMinutes,
      slaDueDate,
    });

    lift.status = 'BREAKDOWN';
    await lift.save();

    await logAudit({
      userId: auth.user.id,
      action: 'RAISE_COMPLAINT',
      entity: 'Complaint',
      entityId: complaint._id.toString(),
      metadata: { priority: complaint.priority, category: complaint.category },
    });

    return NextResponse.json({ success: true, complaint }, { status: 201 });
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
