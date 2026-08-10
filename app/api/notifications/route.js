import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db.js';
import Notification from '../../../models/Notification.js';
import { authorizeApi } from '../../../lib/rbac.js';

export async function GET(req) {
  try {
    await dbConnect();
    const auth = await authorizeApi(req, []);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const notifications = await Notification.find({ userId: auth.user.id }).sort({ createdAt: -1 }).limit(20);
    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
