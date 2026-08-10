import { NextResponse } from 'next/server';
import crypto from 'crypto';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db.js';
import AMC from '@/models/AMC.js';
import Lift from '@/models/Lift.js';
import Service from '@/models/Service.js';
import Certificate from '@/models/Certificate.js';
import { authorizeApi, ROLES, validateCustomerOwnership } from '@/lib/rbac.js';
import { calculateAmcStatus, checkAmcOverlap } from '@/lib/amc-service.js';
import { generatePpmServicesForAmc } from '@/lib/ppm-generator.js';
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
      query = { $or: [{ _id: params.id }, { amcId: params.id }, { contractNumber: params.id }] };
    } else {
      query = { $or: [{ amcId: params.id }, { contractNumber: params.id }] };
    }

    const amc = await AMC.findOne(query)
      .populate('customerId')
      .populate('liftIds')
      .populate('renewalOf');

    if (!amc) {
      return NextResponse.json({ error: 'AMC record not found' }, { status: 404 });
    }

    // IDOR Protection: CUSTOMER role must own this AMC
    if (!validateCustomerOwnership(auth.user, amc.customerId._id.toString())) {
      return NextResponse.json({ error: 'Forbidden: Access denied to AMC details' }, { status: 403 });
    }

    // Auto-generate PPM Services if active and none generated yet
    if (amc.status === 'ACTIVE') {
      await generatePpmServicesForAmc(Service, amc);
    }

    const services = await Service.find({ amcId: amc._id }).populate('technicianId', 'name phone').sort({ scheduledStartTime: 1 });

    const obj = amc.toObject();
    obj.computedStatus = calculateAmcStatus(amc);

    return NextResponse.json({ success: true, amc: obj, services });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const auth = await authorizeApi(req, [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SERVICE_MANAGER]);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();

    let query = {};
    if (mongoose.Types.ObjectId.isValid(params.id)) {
      query = { $or: [{ _id: params.id }, { amcId: params.id }, { contractNumber: params.id }] };
    } else {
      query = { $or: [{ amcId: params.id }, { contractNumber: params.id }] };
    }

    const amc = await AMC.findOne(query);
    if (!amc) {
      return NextResponse.json({ error: 'AMC record not found' }, { status: 404 });
    }

    const action = body.action; // 'ACTIVATE', 'RENEW', 'CANCEL', 'UPDATE'

    if (action === 'ACTIVATE') {
      amc.status = 'ACTIVE';
      await amc.save();
      await generatePpmServicesForAmc(Service, amc);

      const certToken = `CERT-AMC-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
      await Certificate.create({
        certificateId: `CERT-AMC-${Date.now().toString().slice(-6)}`,
        certificateType: 'AMC',
        verificationToken: certToken,
        title: `Annual Maintenance Contract Certificate - ${amc.contractNumber}`,
        customerId: amc.customerId,
        amcId: amc._id,
        issueDate: new Date(),
        expiryDate: amc.endDate,
        details: `Official AMC Contract active coverage.`,
      });
    } else if (action === 'CANCEL') {
      amc.status = 'CANCELLED';
      await amc.save();
    } else if (action === 'RENEW') {
      // Create new AMC as renewal
      const newStartDate = new Date(amc.endDate.getTime() + 24 * 60 * 60 * 1000);
      const newEndDate = new Date(newStartDate);
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);

      const renewedAmc = await AMC.create({
        amcId: `AMC-${Date.now().toString().slice(-6)}`,
        contractNumber: `${amc.contractNumber}-RN`,
        customerId: amc.customerId,
        liftIds: amc.liftIds,
        planType: amc.planType,
        ppmInterval: amc.ppmInterval,
        startDate: newStartDate,
        endDate: newEndDate,
        baseAmount: amc.baseAmount,
        discount: amc.discount,
        taxAmount: amc.taxAmount,
        totalAmount: amc.totalAmount,
        coverage: amc.coverage,
        terms: amc.terms,
        status: 'ACTIVE',
        renewalOf: amc._id,
      });

      amc.status = 'RENEWED';
      await amc.save();
      await generatePpmServicesForAmc(Service, renewedAmc);

      return NextResponse.json({ success: true, message: 'AMC Renewed successfully', amc: renewedAmc });
    } else {
      // Normal update
      if (body.liftIds || body.startDate || body.endDate) {
        const checkLifts = body.liftIds || amc.liftIds;
        const checkStart = body.startDate || amc.startDate;
        const checkEnd = body.endDate || amc.endDate;
        const hasOverlap = await checkAmcOverlap(AMC, checkLifts, checkStart, checkEnd, amc._id);
        if (hasOverlap) {
          return NextResponse.json(
            { error: 'Cannot update AMC: Overlapping active contract exists for the updated lift/dates.' },
            { status: 400 }
          );
        }
      }

      Object.assign(amc, body);
      await amc.save();
    }

    await logAudit({
      userId: auth.user.id,
      action: `AMC_${action || 'UPDATE'}`,
      entity: 'AMC',
      entityId: amc._id.toString(),
    });

    return NextResponse.json({ success: true, amc });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
