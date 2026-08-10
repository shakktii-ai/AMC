import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/db.js';
import Lift from '../../../../../models/Lift.js';
import Warranty from '../../../../../models/Warranty.js';
import AMC from '../../../../../models/AMC.js';
import { calculateAmcStatus } from '../../../../../lib/amc-service.js';
import { calculateWarrantyStatus } from '../../../../../lib/warranty-service.js';

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const token = params.token;

    const lift = await Lift.findOne({ verificationToken: token }).populate('customerId', 'companyName city state');
    if (!lift) {
      return NextResponse.json({ error: 'Invalid or expired QR verification token' }, { status: 404 });
    }

    const latestWarranty = await Warranty.findOne({ liftId: lift._id }).sort({ endDate: -1 });
    const latestAmc = await AMC.findOne({ liftIds: lift._id, status: { $ne: 'CANCELLED' } }).sort({ endDate: -1 });

    const safeLiftData = {
      liftId: lift.liftId,
      assetCode: lift.assetCode,
      serialNumber: lift.serialNumber,
      buildingName: lift.buildingName,
      wing: lift.wing,
      floor: lift.floor,
      capacityKg: lift.capacityKg,
      capacityPersons: lift.capacityPersons,
      speedMs: lift.speedMs,
      floors: lift.floors,
      stops: lift.stops,
      driveType: lift.driveType,
      controllerType: lift.controllerType,
      doorType: lift.doorType,
      status: lift.status,
      customerName: lift.customerId ? (lift.customerId.companyName || 'Registered Customer') : 'Registered Customer',
      location: lift.customerId ? `${lift.customerId.city}, ${lift.customerId.state}` : '',
      warrantyStatus: latestWarranty ? calculateWarrantyStatus(latestWarranty) : 'NO_WARRANTY',
      warrantyExpiry: latestWarranty ? latestWarranty.endDate : null,
      amcStatus: latestAmc ? calculateAmcStatus(latestAmc) : 'NO_AMC',
      amcContractNumber: latestAmc ? latestAmc.contractNumber : null,
      amcExpiry: latestAmc ? latestAmc.endDate : null,
    };

    return NextResponse.json({ success: true, lift: safeLiftData });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
