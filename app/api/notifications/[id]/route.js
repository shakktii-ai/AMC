import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db.js';
import Notification from '../../../../models/Notification.js';
import { authorizeApi } from '../../../../lib/rbac.js';

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const auth = await authorizeApi(req, []);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const notification = await Notification.findOne({ _id: params.id, userId: auth.user.id });
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    notification.isRead = true;
    await notification.save();

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
