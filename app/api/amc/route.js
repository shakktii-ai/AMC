import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '../../../lib/db.js';
import AMC from '../../../models/AMC.js';
import Lift from '../../../models/Lift.js';
import Service from '../../../models/Service.js';
import Certificate from '../../../models/Certificate.js';
import { authorizeApi, ROLES } from '../../../lib/rbac.js';
import { amcSchema } from '../../../validators/schemas.js';
import { calculateAmcStatus, checkAmcOverlap } from '../../../lib/amc-service.js';
import { generatePpmServicesForAmc } from '../../../lib/ppm-generator.js';
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
    const customerIdParam = searchParams.get('customerId');
    const statusParam = searchParams.get('status');

    let query = {};
    if (auth.user.role === ROLES.CUSTOMER) {
      if (!auth.user.customerId) return NextResponse.json({ success: true, amcs: [] });
      query.customerId = auth.user.customerId;
    } else if (customerIdParam) {
      query.customerId = customerIdParam;
    }

    if (statusParam) {
      query.status = statusParam;
    }

    const amcs = await AMC.find(query)
      .populate('customerId', 'name companyName email phone')
      .populate('liftIds', 'liftId assetCode buildingName floor wing')
      .sort({ createdAt: -1 });

    const processedAmcs = amcs.map((item) => {
      const doc = item.toObject();
      doc.computedStatus = calculateAmcStatus(item);
      return doc;
    });

    return NextResponse.json({ success: true, amcs: processedAmcs });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const auth = await authorizeApi(req, [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SERVICE_MANAGER]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const validated = amcSchema.parse(body);

    // CRITICAL: Overlap Guard to prevent overlapping active AMC contracts for the same lift!
    const hasOverlap = await checkAmcOverlap(AMC, validated.liftIds, validated.startDate, validated.endDate);
    if (hasOverlap) {
      return NextResponse.json(
        { error: 'Cannot create AMC: One or more selected lifts already have an active/overlapping AMC contract for these dates.' },
        { status: 400 }
      );
    }

    const taxAmount = Math.round((validated.baseAmount - validated.discount) * 0.18 * 100) / 100;
    const totalAmount = Math.round((validated.baseAmount - validated.discount + taxAmount) * 100) / 100;

    const newAmc = await AMC.create({
      ...validated,
      taxAmount,
      totalAmount,
      status: body.activateNow ? 'ACTIVE' : 'DRAFT',
    });

    // Update lift statuses
    await Lift.updateMany({ _id: { $in: validated.liftIds } }, { status: 'UNDER_AMC' });

    // Generate PPM Services dynamically if active
    let generatedPpmServices = [];
    if (newAmc.status === 'ACTIVE') {
      generatedPpmServices = await generatePpmServicesForAmc(Service, newAmc);

      // Generate Certificate
      const certToken = `CERT-AMC-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
      await Certificate.create({
        certificateId: `CERT-AMC-${Date.now().toString().slice(-6)}`,
        certificateType: 'AMC',
        verificationToken: certToken,
        title: `Annual Maintenance Contract Certificate - ${newAmc.contractNumber}`,
        customerId: newAmc.customerId,
        amcId: newAmc._id,
        issueDate: new Date(),
        expiryDate: newAmc.endDate,
        details: `Official AMC Contract coverage for ${validated.liftIds.length} lift asset(s).`,
      });
    }

    await logAudit({
      userId: auth.user.id,
      action: 'CREATE_AMC',
      entity: 'AMC',
      entityId: newAmc._id.toString(),
      metadata: { contractNumber: newAmc.contractNumber, totalAmount: newAmc.totalAmount },
    });

    return NextResponse.json({ success: true, amc: newAmc, ppmCount: generatedPpmServices.length }, { status: 201 });
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
