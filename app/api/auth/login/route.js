import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db.js';
import User from '@/models/User.js';
import Customer from '@/models/Customer.js';
import { comparePassword, signToken, TOKEN_COOKIE_NAME } from '@/lib/auth.js';
import { loginSchema } from '@/validators/schemas.js';
import { logAudit } from '@/lib/audit.js';

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const validated = loginSchema.parse(body);

    const user = await User.findOne({ email: validated.email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Account is inactive' }, { status: 403 });
    }

    const isMatch = await comparePassword(validated.password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const payload = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      customerId: user.customerId ? user.customerId.toString() : null,
    };

    const token = signToken(payload);

    await logAudit({
      userId: user._id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user._id.toString(),
      metadata: { email: user.email, role: user.role },
    });

    const response = NextResponse.json({
      success: true,
      user: payload,
      token,
    });

    response.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
