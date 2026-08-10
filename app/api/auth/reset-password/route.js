import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db.js';
import User from '../../../../models/User.js';
import { hashPassword } from '../../../../lib/auth.js';

export async function POST(req) {
  try {
    await dbConnect();
    const { email, newPassword } = await req.json();

    if (!email || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Valid email and password (min 6 chars) required' }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.password = await hashPassword(newPassword);
    await user.save();

    return NextResponse.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
