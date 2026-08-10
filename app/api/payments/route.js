import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db.js';
import Payment from '@/models/Payment.js';
import PaymentReceipt from '@/models/PaymentReceipt.js';
import Invoice from '@/models/Invoice.js';
import { authorizeApi, ROLES } from '@/lib/rbac.js';
import { paymentSchema } from '@/validators/schemas.js';
import { logAudit } from '@/lib/audit.js';

export async function GET(req) {
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

    const { searchParams } = new URL(req.url);
    const invoiceId = searchParams.get('invoiceId');

    let query = {};
    if (auth.user.role === ROLES.CUSTOMER) {
      if (!auth.user.customerId) return NextResponse.json({ success: true, payments: [] });
      query.customerId = auth.user.customerId;
    }

    if (invoiceId) query.invoiceId = invoiceId;

    const payments = await Payment.find(query)
      .populate('customerId', 'name companyName email phone')
      .populate('invoiceId', 'invoiceNumber totalAmount balanceDue status')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, payments });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    // Strictly restricted to financial staff: SUPER_ADMIN, ADMIN, ACCOUNTANT (Customers view payments/receipts, cannot post manual payments!)
    const auth = await authorizeApi(req, [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const validated = paymentSchema.parse(body);

    const invoice = await Invoice.findById(validated.invoiceId);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const currentBalance = invoice.balanceDue ?? (invoice.totalAmount - (invoice.amountPaid || 0));

    // CRITICAL: Prevent Overpayment!
    if (validated.amountPaid > currentBalance + 0.01) { // 0.01 margin for floating point
      return NextResponse.json(
        { error: `Overpayment rejected: Payment amount (₹${validated.amountPaid}) exceeds remaining balance due (₹${currentBalance}).` },
        { status: 400 }
      );
    }

    const paymentId = `PAY-${Date.now().toString().slice(-6)}`;
    const payment = await Payment.create({
      paymentId,
      invoiceId: invoice._id,
      customerId: invoice.customerId,
      amountPaid: validated.amountPaid,
      paymentMethod: validated.paymentMethod,
      transactionReference: validated.transactionReference || '',
      status: 'COMPLETED',
    });

    // Update invoice amounts and balance
    invoice.amountPaid = (invoice.amountPaid || 0) + validated.amountPaid;
    invoice.balanceDue = Math.max(0, invoice.totalAmount - invoice.amountPaid);

    if (invoice.balanceDue <= 0) {
      invoice.status = 'PAID';
    } else {
      invoice.status = 'PARTIALLY_PAID';
    }
    await invoice.save();

    // Create Payment Receipt
    const receiptNumber = `RCP-${Date.now().toString().slice(-6)}`;
    const receipt = await PaymentReceipt.create({
      receiptId: `RCP-ID-${Date.now().toString().slice(-6)}`,
      receiptNumber,
      paymentId: payment._id,
      invoiceId: invoice._id,
      customerId: invoice.customerId,
      amount: validated.amountPaid,
      receiptDate: new Date(),
    });

    await logAudit({
      userId: auth.user.id,
      action: 'RECORD_PAYMENT',
      entity: 'Payment',
      entityId: payment._id.toString(),
      metadata: { amount: payment.amountPaid, invoiceNumber: invoice.invoiceNumber },
    });

    return NextResponse.json({ success: true, payment, receipt, invoiceStatus: invoice.status }, { status: 201 });
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
