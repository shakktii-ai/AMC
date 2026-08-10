import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db.js';
import Invoice from '@/models/Invoice.js';
import Payment from '@/models/Payment.js';
import { authorizeApi, ROLES, validateCustomerOwnership } from '@/lib/rbac.js';
import { calculateInvoiceStatus } from '@/lib/invoice-service.js';
import { logAudit } from '@/lib/audit.js';

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const auth = await authorizeApi(req, [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.ACCOUNTANT,
      ROLES.CUSTOMER,
    ]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let query = {};
    if (mongoose.Types.ObjectId.isValid(params.id)) {
      query = { $or: [{ _id: params.id }, { invoiceId: params.id }, { invoiceNumber: params.id }] };
    } else {
      query = { $or: [{ invoiceId: params.id }, { invoiceNumber: params.id }] };
    }

    const invoice = await Invoice.findOne(query).populate('customerId');
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // IDOR Protection for Customer
    if (auth.user.role === ROLES.CUSTOMER && !validateCustomerOwnership(auth.user, invoice.customerId._id.toString())) {
      return NextResponse.json({ error: 'Forbidden: Access denied to invoice' }, { status: 403 });
    }

    const payments = await Payment.find({ invoiceId: invoice._id }).sort({ createdAt: -1 });

    const obj = invoice.toObject();
    obj.computedStatus = calculateInvoiceStatus(invoice);

    return NextResponse.json({ success: true, invoice: obj, payments });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const auth = await authorizeApi(req, [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();

    let query = {};
    if (mongoose.Types.ObjectId.isValid(params.id)) {
      query = { $or: [{ _id: params.id }, { invoiceId: params.id }, { invoiceNumber: params.id }] };
    } else {
      query = { $or: [{ invoiceId: params.id }, { invoiceNumber: params.id }] };
    }

    const invoice = await Invoice.findOne(query);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (body.status) {
      invoice.status = body.status;
    }

    if (body.dueDate) invoice.dueDate = new Date(body.dueDate);

    await invoice.save();

    await logAudit({
      userId: auth.user.id,
      action: 'UPDATE_INVOICE',
      entity: 'Invoice',
      entityId: invoice._id.toString(),
      metadata: { status: invoice.status },
    });

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
