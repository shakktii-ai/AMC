import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db.js';
import Installation from '../../../models/Installation.js';
import Lift from '../../../models/Lift.js';
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
      ROLES.CUSTOMER,
    ]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let query = {};
    if (auth.user.role === ROLES.CUSTOMER) {
      query.customerId = auth.user.customerId;
    } else if (auth.user.role === ROLES.TECHNICIAN) {
      query.assignedTechnicianId = auth.user.id;
    }

    if (status) query.status = status;

    const installations = await Installation.find(query)
      .populate('liftId')
      .populate('customerId', 'name companyName phone')
      .populate('assignedTechnicianId', 'name phone')
      .sort({ scheduledDate: -1 });

    return NextResponse.json({ success: true, installations });
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

    const installationId = `INST-${Date.now().toString().slice(-6)}`;

    const defaultChecklist = [
      { item: 'Structural shaft inspection', checked: false, notes: '' },
      { item: 'Guide rail alignment check', checked: false, notes: '' },
      { item: 'Motor & traction machine mounting', checked: false, notes: '' },
      { item: 'Car & counterweight balancing', checked: false, notes: '' },
      { item: 'Electrical controller wiring & earthing', checked: false, notes: '' },
      { item: 'Safety gear & governor testing', checked: false, notes: '' },
      { item: 'Door operator and lock mechanism test', checked: false, notes: '' },
      { item: 'Emergency stop & alarm battery check', checked: false, notes: '' },
    ];

    const installation = await Installation.create({
      installationId,
      liftId: lift._id,
      customerId: lift.customerId,
      assignedTechnicianId: body.assignedTechnicianId || null,
      scheduledDate: body.scheduledDate || new Date(),
      status: 'PLANNED',
      safetyChecklist: body.safetyChecklist || defaultChecklist,
      inspectionNotes: body.inspectionNotes || '',
    });

    lift.status = 'UNDER_INSTALLATION';
    await lift.save();

    await logAudit({
      userId: auth.user.id,
      action: 'CREATE_INSTALLATION',
      entity: 'Installation',
      entityId: installation._id.toString(),
    });

    return NextResponse.json({ success: true, installation }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
