import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db.js';
import CompanySettings from '@/models/CompanySettings.js';
import { authorizeApi, ROLES } from '@/lib/rbac.js';
import { logAudit } from '@/lib/audit.js';

export async function GET(req) {
  try {
    await dbConnect();
    const auth = await authorizeApi(req, []);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let settings = await CompanySettings.findOne({});
    if (!settings) {
      settings = await CompanySettings.create({});
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const auth = await authorizeApi(req, [ROLES.SUPER_ADMIN, ROLES.ADMIN]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    let settings = await CompanySettings.findOne({});
    if (!settings) {
      settings = await CompanySettings.create(body);
    } else {
      Object.assign(settings, body);
      await settings.save();
    }

    await logAudit({
      userId: auth.user.id,
      action: 'UPDATE_SETTINGS',
      entity: 'CompanySettings',
      entityId: settings._id.toString(),
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
