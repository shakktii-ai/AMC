import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db.js';
import ChecklistTemplate from '@/models/ChecklistTemplate.js';
import { authorizeApi, ROLES } from '@/lib/rbac.js';
import { logAudit } from '@/lib/audit.js';

export async function GET(req) {
  try {
    await dbConnect();
    const auth = await authorizeApi(req, []);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const checklists = await ChecklistTemplate.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, checklists });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const auth = await authorizeApi(req, [ROLES.SUPER_ADMIN, ROLES.ADMIN]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const checklist = await ChecklistTemplate.create({
      name: body.name,
      category: body.category || 'PPM',
      items: body.items || [],
      status: body.status || 'ACTIVE',
    });

    await logAudit({
      userId: auth.user.id,
      action: 'CREATE_CHECKLIST_TEMPLATE',
      entity: 'ChecklistTemplate',
      entityId: checklist._id.toString(),
    });

    return NextResponse.json({ success: true, checklist }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
