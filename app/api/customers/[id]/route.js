import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db.js';
import Customer from '@/models/Customer.js';
import Lift from '@/models/Lift.js';
import AMC from '@/models/AMC.js';
import Service from '@/models/Service.js';
import Complaint from '@/models/Complaint.js';
import Invoice from '@/models/Invoice.js';
import Payment from '@/models/Payment.js';
import Certificate from '@/models/Certificate.js';
import Document from '@/models/Document.js';
import { authorizeApi, ROLES, validateCustomerOwnership } from '@/lib/rbac.js';
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

    const customer = await Customer.findOneAndUpdate(query, body, { new: true, runValidators: true });
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

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
