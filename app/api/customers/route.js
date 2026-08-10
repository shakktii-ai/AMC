import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db.js';
import Customer from '@/models/Customer.js';
import User from '@/models/User.js';
import { authorizeApi, ROLES } from '@/lib/rbac.js';
import { customerSchema } from '@/validators/schemas.js';
import { hashPassword } from '@/lib/auth.js';
import { logAudit } from '@/lib/audit.js';

export async function GET(req) {
  try {
    await dbConnect();
    const auth = await authorizeApi(req, [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.SERVICE_MANAGER,
      ROLES.ACCOUNTANT,
      ROLES.CUSTOMER,
    ]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    let query = {};
    if (auth.user.role === ROLES.CUSTOMER) {
      if (!auth.user.customerId) {
        return NextResponse.json({ success: true, customers: [] });
      }
      query._id = auth.user.customerId;
    } else {
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { companyName: { $regex: search, $options: 'i' } },
          { customerId: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ];
      }
    }

    const customers = await Customer.find(query).sort({ createdAt: -1 });

    // Join linked User login accounts for Admin UI list view
    const customerIds = customers.map((c) => c._id);
    const linkedUsers = await User.find({ role: ROLES.CUSTOMER, customerId: { $in: customerIds } }).select('email customerId status role createdAt');
    const userMap = new Map();
    linkedUsers.forEach((u) => {
      if (u.customerId) {
        userMap.set(u.customerId.toString(), u);
      }
    });

    const processedCustomers = customers.map((c) => {
      const obj = c.toObject();
      const linkedUser = userMap.get(c._id.toString());
      obj.hasLogin = !!linkedUser;
      obj.userAccount = linkedUser ? { email: linkedUser.email, status: linkedUser.status, role: linkedUser.role, createdAt: linkedUser.createdAt } : null;
      return obj;
    });

    return NextResponse.json({ success: true, customers: processedCustomers });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    // Strictly restricted to SUPER_ADMIN & ADMIN
    const auth = await authorizeApi(req, [ROLES.SUPER_ADMIN, ROLES.ADMIN]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const validated = customerSchema.parse(body);

    const existing = await Customer.findOne({ customerId: validated.customerId });
    if (existing) {
      return NextResponse.json({ error: 'Customer ID already exists' }, { status: 400 });
    }

    // Determine login email
    const loginEmail = (validated.loginEmail || validated.email).toLowerCase().trim();

    // Check duplicate account protection
    const existingUser = await User.findOne({ email: loginEmail });
    if (existingUser) {
      return NextResponse.json({ error: `A user account with email "${loginEmail}" already exists.` }, { status: 400 });
    }

    // Create Customer record
    const customer = await Customer.create(validated);

    let userAccount = null;
    if (validated.createLogin !== false) {
      const rawPassword = validated.password && validated.password.trim().length >= 6 ? validated.password : 'Test@12345';
      const hashedPassword = await hashPassword(rawPassword);

      try {
        userAccount = await User.create({
          name: customer.name,
          email: loginEmail,
          password: hashedPassword,
          role: ROLES.CUSTOMER,
          status: 'ACTIVE',
          customerId: customer._id,
        });
      } catch (userErr) {
        // Rollback Customer record to prevent orphan data
        await Customer.findByIdAndDelete(customer._id);
        return NextResponse.json({ error: `Failed to create Customer login account: ${userErr.message}. Customer creation rolled back.` }, { status: 400 });
      }
    }

    await logAudit({
      userId: auth.user.id,
      action: 'CREATE_CUSTOMER',
      entity: 'Customer',
      entityId: customer._id.toString(),
      metadata: { customerId: customer.customerId, name: customer.name, userAccountCreated: !!userAccount },
    });

    return NextResponse.json({
      success: true,
      customer,
      userAccountCreated: !!userAccount,
      userEmail: userAccount ? userAccount.email : null,
      message: 'Customer and Customer login account created successfully.',
    }, { status: 201 });
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
