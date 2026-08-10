import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db.js';
import Invoice from '../../../models/Invoice.js';
import Customer from '../../../models/Customer.js';
import CompanySettings from '../../../models/CompanySettings.js';
import { authorizeApi, ROLES } from '../../../lib/rbac.js';
import { invoiceSchema } from '../../../validators/schemas.js';
import { calculateGst } from '../../../lib/gst.js';
import { calculateInvoiceStatus } from '../../../lib/invoice-service.js';
import { logAudit } from '../../../lib/audit.js';

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
    const status = searchParams.get('status');

    let query = {};
    if (auth.user.role === ROLES.CUSTOMER) {
      if (!auth.user.customerId) return NextResponse.json({ success: true, invoices: [] });
      query.customerId = auth.user.customerId;
    }

    if (status) query.status = status;

    const invoices = await Invoice.find(query)
      .populate('customerId', 'name companyName email phone address city state pincode gstin')
      .sort({ createdAt: -1 });

    const processedInvoices = invoices.map((inv) => {
      const obj = inv.toObject();
      obj.computedStatus = calculateInvoiceStatus(inv);
      return obj;
    });

    return NextResponse.json({ success: true, invoices: processedInvoices });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const auth = await authorizeApi(req, [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ACCOUNTANT]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const validated = invoiceSchema.parse(body);

    const customer = await Customer.findById(validated.customerId);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const companySettings = (await CompanySettings.findOne({})) || { state: 'MAHARASHTRA' };

    let subtotal = 0;
    const items = validated.items.map((item) => {
      const amount = Math.round(item.quantity * item.unitPrice * 100) / 100;
      subtotal += amount;
      return { ...item, amount };
    });

    const gstCalc = calculateGst({
      items,
      subtotal,
      discount: validated.discount || 0,
      customerState: customer.state,
      companyState: companySettings.state || 'MAHARASHTRA',
    });

    const invoiceId = `INV-${Date.now().toString().slice(-6)}`;
    const invoiceNumber = validated.invoiceNumber;

    const invoice = await Invoice.create({
      invoiceId,
      invoiceNumber,
      type: validated.type,
      customerId: customer._id,
      items,
      billingSnapshot: {
        customerName: customer.name,
        customerCompany: customer.companyName,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        gstin: customer.gstin,
      },
      subtotal,
      discount: validated.discount || 0,
      cgst: gstCalc.cgstAmount,
      sgst: gstCalc.sgstAmount,
      igst: gstCalc.igstAmount,
      taxRate: gstCalc.isSameState ? 18 : 18,
      totalAmount: gstCalc.totalAmount,
      amountPaid: 0,
      dueDate: new Date(validated.dueDate),
      balanceDue: gstCalc.totalAmount,
      status: body.issueNow ? 'ISSUED' : 'DRAFT',
    });

    await logAudit({
      userId: auth.user.id,
      action: 'CREATE_INVOICE',
      entity: 'Invoice',
      entityId: invoice._id.toString(),
      metadata: { invoiceNumber: invoice.invoiceNumber, totalAmount: invoice.totalAmount },
    });

    return NextResponse.json({ success: true, invoice }, { status: 201 });
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
