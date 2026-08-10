import { NextResponse } from 'next/server';
import { getAuthUser } from '../../../../lib/auth.js';
import dbConnect from '../../../../lib/db.js';
import User from '../../../../models/User.js';

export async function GET(req) {
  try {
    await dbConnect();
    const auth = await getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const user = await User.findById(auth.id).select('-password').populate('customerId');
    if (!user || user.status !== 'ACTIVE') {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        customerId: user.customerId ? user.customerId._id.toString() : null,
        customerDetails: user.customerId,
      },
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
  }
}
