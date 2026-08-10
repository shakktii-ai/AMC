import { NextResponse } from 'next/server';
import dbConnect from '../../../../lib/db.js';
import User from '../../../../models/User.js';
import { sendEmail } from '../../../../lib/email.js';

export async function POST(req) {
  try {
    await dbConnect();
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Code - Lift AMC System',
        text: `Your password reset code is: ${resetCode}. Use this code to reset your password.`,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a reset code has been sent.',
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
