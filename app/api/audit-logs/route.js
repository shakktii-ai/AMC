import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db.js';
import AuditLog from '../../../models/AuditLog.js';
import { authorizeApi, ROLES } from '../../../lib/rbac.js';

export async function GET(req) {
  try {
    await dbConnect();
    const auth = await authorizeApi(req, [ROLES.SUPER_ADMIN, ROLES.ADMIN]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const entity = searchParams.get('entity');
    const action = searchParams.get('action');

    let query = {};
    if (entity) query.entity = entity;
    if (action) query.action = action;

    const logs = await AuditLog.find(query)
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 })
      .limit(100);

    return NextResponse.json({ success: true, logs });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
