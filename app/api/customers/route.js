import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db.js';
import Customer from '../../../models/Customer.js';
import { authorizeApi, ROLES, validateCustomerOwnership } from '../../../lib/rbac.js';
import { customerSchema } from '../../../validators/schemas.js';
import { logAudit } from '../../../lib/audit.js';

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
    return NextResponse.json({ success: true, customers });
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
    const validated = customerSchema.parse(body);

    const existing = await Customer.findOne({ customerId: validated.customerId });
    if (existing) {
      return NextResponse.json({ error: 'Customer ID already exists' }, { status: 400 });
    }

    const customer = await Customer.create(validated);

    await logAudit({
      userId: auth.user.id,
      action: 'CREATE_CUSTOMER',
      entity: 'Customer',
      entityId: customer._id.toString(),
      metadata: { customerId: customer.customerId, name: customer.name },
    });

    return NextResponse.json({ success: true, customer }, { status: 201 });
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
