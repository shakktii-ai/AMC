import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db.js';
import Customer from '@/models/Customer.js';
import User from '@/models/User.js';
import Lift from '@/models/Lift.js';
import AMC from '@/models/AMC.js';
import Service from '@/models/Service.js';
import Complaint from '@/models/Complaint.js';
import Invoice from '@/models/Invoice.js';
import Payment from '@/models/Payment.js';
import Certificate from '@/models/Certificate.js';
import Document from '@/models/Document.js';
import { authorizeApi, ROLES, validateCustomerOwnership } from '@/lib/rbac.js';
import { hashPassword } from '@/lib/auth.js';
import { logAudit } from '@/lib/audit.js';

export async function GET(req, { params }) {
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

    let query = {};
    if (mongoose.Types.ObjectId.isValid(params.id)) {
      query = { $or: [{ _id: params.id }, { customerId: params.id }] };
    } else {
      query = { customerId: params.id };
    }

    const customer = await Customer.findOne(query);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // IDOR Protection: CUSTOMER role can strictly only access their own customer ID!
    if (!validateCustomerOwnership(auth.user, customer._id.toString())) {
      return NextResponse.json({ error: 'Forbidden: Access denied to customer details' }, { status: 403 });
    }

    // Fetch linked login account
    const userAccount = await User.findOne({ role: ROLES.CUSTOMER, customerId: customer._id }).select('email role status createdAt');

    // Fetch related records
    const [lifts, amcs, services, complaints, invoices, payments, certificates, documents] = await Promise.all([
      Lift.find({ customerId: customer._id }),
      AMC.find({ customerId: customer._id }).sort({ createdAt: -1 }),
      Service.find({ customerId: customer._id }).populate('liftId').populate('technicianId', 'name email phone').sort({ scheduledStartTime: -1 }),
      Complaint.find({ customerId: customer._id }).populate('liftId').populate('assignedTechnician', 'name email phone').sort({ createdAt: -1 }),
      Invoice.find({ customerId: customer._id }).sort({ createdAt: -1 }),
      Payment.find({ customerId: customer._id }).populate('invoiceId', 'invoiceNumber').sort({ createdAt: -1 }),
      Certificate.find({ customerId: customer._id }).sort({ issueDate: -1 }),
      Document.find({ customerId: customer._id }).sort({ createdAt: -1 }),
    ]);

    return NextResponse.json({
      success: true,
      customer,
      userAccount: userAccount ? { email: userAccount.email, role: userAccount.role, status: userAccount.status, createdAt: userAccount.createdAt } : null,
      lifts,
      amcs,
      services,
      complaints,
      invoices,
      payments,
      certificates,
      documents,
    });
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

    let query = {};
    if (mongoose.Types.ObjectId.isValid(params.id)) {
      query = { $or: [{ _id: params.id }, { customerId: params.id }] };
    } else {
      query = { customerId: params.id };
    }

    const customer = await Customer.findOne(query);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Action: Create Login Account for existing customer
    if (body.action === 'CREATE_LOGIN') {
      const loginEmail = (body.loginEmail || customer.email).toLowerCase().trim();
      const rawPassword = body.password;

      if (!rawPassword || rawPassword.trim().length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
      }

      // Check if user already exists with email
      const existingEmailUser = await User.findOne({ email: loginEmail });
      if (existingEmailUser) {
        return NextResponse.json({ error: `A user account with email "${loginEmail}" already exists.` }, { status: 400 });
      }

      // Check if user is already linked to this customer
      const existingCustomerUser = await User.findOne({ role: ROLES.CUSTOMER, customerId: customer._id });
      if (existingCustomerUser) {
        return NextResponse.json({ error: 'This customer already has an active login account.' }, { status: 400 });
      }

      const hashedPassword = await hashPassword(rawPassword);
      const newUser = await User.create({
        name: customer.name,
        email: loginEmail,
        password: hashedPassword,
        role: ROLES.CUSTOMER,
        status: 'ACTIVE',
        customerId: customer._id,
      });

      await logAudit({
        userId: auth.user.id,
        action: 'CREATE_CUSTOMER_LOGIN',
        entity: 'User',
        entityId: newUser._id.toString(),
        metadata: { customerId: customer.customerId, email: newUser.email },
      });

      return NextResponse.json({
        success: true,
        message: 'Customer login account created successfully',
        userAccount: { email: newUser.email, role: newUser.role, status: newUser.status },
      });
    }

    // Normal customer details update (Does NOT automatically recreate User account)
    Object.assign(customer, body);
    await customer.save();

    await logAudit({
      userId: auth.user.id,
      action: 'UPDATE_CUSTOMER',
      entity: 'Customer',
      entityId: customer._id.toString(),
    });

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
