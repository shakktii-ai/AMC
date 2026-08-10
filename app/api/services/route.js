import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db.js';
import Service from '../../../models/Service.js';
import Lift from '../../../models/Lift.js';
import { authorizeApi, ROLES, validateTechnicianOwnership, validateCustomerOwnership } from '../../../lib/rbac.js';
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
    const source = searchParams.get('source');
    const status = searchParams.get('status');

    let query = {};
    if (auth.user.role === ROLES.CUSTOMER) {
      if (!auth.user.customerId) return NextResponse.json({ success: true, services: [] });
      query.customerId = auth.user.customerId;
    } else if (auth.user.role === ROLES.TECHNICIAN) {
      // TECHNICIAN ownership: Technician can strictly only see assigned services!
      query.technicianId = auth.user.id;
    }

    if (source) query.serviceSource = source;
    if (status) query.status = status;

    const services = await Service.find(query)
      .populate('customerId', 'name companyName email phone')
      .populate('liftId', 'liftId assetCode buildingName floor wing')
      .populate('technicianId', 'name email phone')
      .sort({ scheduledStartTime: 1 });

    return NextResponse.json({ success: true, services });
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

    const serviceId = `SRV-${Date.now().toString().slice(-6)}`;
    const scheduledStart = new Date(body.scheduledStartTime);
    const scheduledEnd = body.scheduledEndTime ? new Date(body.scheduledEndTime) : new Date(scheduledStart.getTime() + 2 * 60 * 60 * 1000);

    const service = await Service.create({
      serviceId,
      customerId: lift.customerId,
      liftId: lift._id,
      amcId: body.amcId || null,
      technicianId: body.technicianId || null,
      serviceSource: body.serviceSource || 'ADHOC',
      scheduledStartTime: scheduledStart,
      scheduledEndTime: scheduledEnd,
      status: body.technicianId ? 'ASSIGNED' : 'SCHEDULED',
      notes: body.notes || '',
    });

    await logAudit({
      userId: auth.user.id,
      action: 'CREATE_SERVICE',
      entity: 'Service',
      entityId: service._id.toString(),
    });

    return NextResponse.json({ success: true, service }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
