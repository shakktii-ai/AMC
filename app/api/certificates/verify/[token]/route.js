import { NextResponse } from 'next/server';
import dbConnect from '../../../../../lib/db.js';
import Certificate from '../../../../../models/Certificate.js';

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const token = params.token;

    const cert = await Certificate.findOne({ verificationToken: token })
      .populate('customerId', 'companyName city state')
      .populate('liftId', 'assetCode buildingName');

    if (!cert) {
      return NextResponse.json({ error: 'Invalid or fraudulent certificate verification token' }, { status: 404 });
    }

    const safeCertData = {
      certificateId: cert.certificateId,
      title: cert.title,
      certificateType: cert.certificateType,
      issueDate: cert.issueDate,
      expiryDate: cert.expiryDate,
      details: cert.details,
      issuedTo: cert.customerId ? (cert.customerId.companyName || 'Registered Enterprise Customer') : 'Registered Customer',
      assetCode: cert.liftId ? cert.liftId.assetCode : 'N/A',
      location: cert.customerId ? `${cert.customerId.city}, ${cert.customerId.state}` : '',
      verificationStatus: 'VALID_AUTHENTIC_CERTIFICATE',
    };

    return NextResponse.json({ success: true, certificate: safeCertData });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
