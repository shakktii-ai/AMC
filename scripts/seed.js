import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dbConnect from '../lib/db.js';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import TechnicianProfile from '../models/TechnicianProfile.js';
import Lift from '../models/Lift.js';
import Warranty from '../models/Warranty.js';
import AMC from '../models/AMC.js';
import Service from '../models/Service.js';
import Complaint from '../models/Complaint.js';
import ServiceReport from '../models/ServiceReport.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import PaymentReceipt from '../models/PaymentReceipt.js';
import Certificate from '../models/Certificate.js';
import Document from '../models/Document.js';
import Notification from '../models/Notification.js';
import CompanySettings from '../models/CompanySettings.js';
import ChecklistTemplate from '../models/ChecklistTemplate.js';

async function seed() {
  console.log('🌱 Starting database seeding (DEVELOPMENT / TEST ONLY)...');
  await dbConnect();

  // Clear existing collections
  await Promise.all([
    User.deleteMany({}),
    Customer.deleteMany({}),
    TechnicianProfile.deleteMany({}),
    Lift.deleteMany({}),
    Warranty.deleteMany({}),
    AMC.deleteMany({}),
    Service.deleteMany({}),
    Complaint.deleteMany({}),
    ServiceReport.deleteMany({}),
    Invoice.deleteMany({}),
    Payment.deleteMany({}),
    PaymentReceipt.deleteMany({}),
    Certificate.deleteMany({}),
    Document.deleteMany({}),
    Notification.deleteMany({}),
    CompanySettings.deleteMany({}),
    ChecklistTemplate.deleteMany({}),
  ]);

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Test@12345', salt);

  // 1. Seed Customer Record first
  const customerDoc = await Customer.create({
    customerId: 'CUST-1001',
    name: 'Rajesh Sharma',
    companyName: 'Royal Crest Luxury Apartments CHS',
    email: 'customer@test.local',
    phone: '+91 98200 12345',
    alternatePhone: '+91 98200 54321',
    address: 'Plot 12, Off Link Road, Malad West',
    city: 'Mumbai',
    state: 'MAHARASHTRA',
    pincode: '400064',
    gstin: '27ABCDE1234F1Z5',
    status: 'ACTIVE',
  });

  // 2. Seed 6 Standard Test Users
  const superAdmin = await User.create({
    name: 'System Super Admin',
    email: 'superadmin@test.local',
    phone: '+91 99000 00001',
    password: passwordHash,
    role: 'SUPER_ADMIN',
    status: 'ACTIVE',
  });

  const admin = await User.create({
    name: 'Operational Admin',
    email: 'admin@test.local',
    phone: '+91 99000 00002',
    password: passwordHash,
    role: 'ADMIN',
    status: 'ACTIVE',
  });

  const manager = await User.create({
    name: 'Vikram Singh (Service Mgr)',
    email: 'manager@test.local',
    phone: '+91 99000 00003',
    password: passwordHash,
    role: 'SERVICE_MANAGER',
    status: 'ACTIVE',
  });

  const technicianUser = await User.create({
    name: 'Suresh Patil (Field Tech)',
    email: 'technician@test.local',
    phone: '+91 99000 00004',
    password: passwordHash,
    role: 'TECHNICIAN',
    status: 'ACTIVE',
  });

  await TechnicianProfile.create({
    userId: technicianUser._id,
    zone: 'WEST_MUMBAI',
    skills: ['GEARED', 'GEARLESS', 'MICROPROCESSOR_VVVF', 'SAFETY_INSPECTION'],
    status: 'AVAILABLE',
    activeJobsCount: 1,
  });

  const accountant = await User.create({
    name: 'Anita Verma (Accountant)',
    email: 'accountant@test.local',
    phone: '+91 99000 00005',
    password: passwordHash,
    role: 'ACCOUNTANT',
    status: 'ACTIVE',
  });

  const customerUser = await User.create({
    name: 'Rajesh Sharma',
    email: 'customer@test.local',
    phone: '+91 98200 12345',
    password: passwordHash,
    role: 'CUSTOMER',
    status: 'ACTIVE',
    customerId: customerDoc._id,
  });

  // 3. Seed Lifts
  const liftToken1 = `LIFT-QR-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
  const lift1 = await Lift.create({
    liftId: 'LFT-8001',
    assetCode: 'AST-MUM-01',
    serialNumber: 'SN-2026-9901',
    customerId: customerDoc._id,
    buildingName: 'Royal Crest Building A',
    buildingAddress: 'Plot 12, Off Link Road, Malad West',
    wing: 'A',
    floor: 'G',
    locationNotes: 'Main Passenger Elevator Shaft #1',
    capacityKg: 408,
    capacityPersons: 6,
    speedMs: 1.5,
    floors: 10,
    stops: 10,
    driveType: 'GEARLESS',
    controllerType: 'MICROPROCESSOR',
    doorType: 'AUTOMATIC',
    status: 'UNDER_AMC',
    verificationToken: liftToken1,
  });

  const liftToken2 = `LIFT-QR-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
  const lift2 = await Lift.create({
    liftId: 'LFT-8002',
    assetCode: 'AST-MUM-02',
    serialNumber: 'SN-2026-9902',
    customerId: customerDoc._id,
    buildingName: 'Royal Crest Service Lift',
    buildingAddress: 'Plot 12, Off Link Road, Malad West',
    wing: 'B',
    floor: 'G',
    locationNotes: 'Goods & Service Shaft',
    capacityKg: 1020,
    capacityPersons: 15,
    speedMs: 1.0,
    floors: 10,
    stops: 10,
    driveType: 'GEARED',
    controllerType: 'VVVF',
    doorType: 'AUTOMATIC',
    status: 'ACTIVE',
    verificationToken: liftToken2,
  });

  // 4. Seed Warranty
  const warrantyToken = `CERT-WRN-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
  const warranty = await Warranty.create({
    warrantyId: 'WRN-3001',
    liftId: lift2._id,
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-12-31'),
    coverage: 'Comprehensive manufacturer warranty covering machine motor, control board, and safety gears.',
    exclusions: 'Damage caused by water seepage or customer tampering.',
    status: 'ACTIVE',
    certificateToken: warrantyToken,
  });

  // 5. Seed AMC
  const now = new Date();
  const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  const amcDoc = await AMC.create({
    amcId: 'AMC-5001',
    contractNumber: 'AMC-2026-ROYAL',
    customerId: customerDoc._id,
    liftIds: [lift1._id, lift2._id],
    planType: 'COMPREHENSIVE',
    ppmInterval: 'MONTHLY',
    startDate: now,
    endDate: oneYearLater,
    baseAmount: 60000,
    discount: 5000,
    taxAmount: 9900,
    totalAmount: 64900,
    coverage: 'Full comprehensive maintenance including 12 monthly visits and emergency breakdown callouts.',
    terms: 'Emergency response within 60 mins for trapped passengers.',
    status: 'ACTIVE',
  });

  // 6. Seed Services (PPM & Adhoc)
  const service1 = await Service.create({
    serviceId: 'SRV-7001',
    customerId: customerDoc._id,
    liftId: lift1._id,
    amcId: amcDoc._id,
    technicianId: technicianUser._id,
    serviceSource: 'PPM',
    scheduledStartTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    scheduledEndTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 2 * 3600 * 1000),
    actualStartTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    actualEndTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 2 * 3600 * 1000),
    status: 'COMPLETED',
    notes: 'Routine monthly PPM service visit completed.',
  });

  // Service Report
  await ServiceReport.create({
    reportId: 'RPT-9001',
    serviceId: service1._id,
    technicianId: technicianUser._id,
    checklist: [
      { task: 'Motor & Traction Machine Inspection', status: 'PASS', notes: 'Smooth operation' },
      { task: 'Brake Mechanism & Shoe Clearance Test', status: 'PASS', notes: 'Tension adjusted' },
      { task: 'Door Sensor & Safety Edge Check', status: 'PASS', notes: 'Cleaned' },
    ],
    findings: 'All safety components function properly.',
    workPerformed: 'Checked motor oil levels, adjusted brake shoe clearance, cleaned door optical sensors.',
    partsReplacedNotes: 'Cleaned sensor lens; no major parts replaced.',
    customerConfirmation: true,
    signature: 'CUSTOMER_DIGITAL_SIGNATURE_OK',
    signedAt: new Date(),
  });

  // 7. Seed Complaint
  const complaint1 = await Complaint.create({
    complaintId: 'CMP-4001',
    customerId: customerDoc._id,
    liftId: lift1._id,
    category: 'DOOR_PROBLEM',
    priority: 'HIGH',
    description: 'Lift car doors opening and closing repeatedly on the 3rd floor without moving.',
    assignedTechnician: technicianUser._id,
    status: 'TECHNICIAN_DISPATCHED',
    slaTargetMinutes: 120,
    slaDueDate: new Date(now.getTime() + 90 * 60 * 1000),
  });

  // 8. Seed Invoice
  const invoice1 = await Invoice.create({
    invoiceId: 'INV-1001',
    invoiceNumber: 'INV-2026-0001',
    type: 'AMC',
    customerId: customerDoc._id,
    items: [
      { description: 'Annual Maintenance Contract - Comprehensive Package (2 Lifts)', quantity: 1, unitPrice: 55000, amount: 55000 },
    ],
    billingSnapshot: {
      customerName: customerDoc.name,
      customerCompany: customerDoc.companyName,
      address: customerDoc.address,
      city: customerDoc.city,
      state: customerDoc.state,
      gstin: customerDoc.gstin,
    },
    subtotal: 55000,
    discount: 0,
    cgst: 4950,
    sgst: 4950,
    igst: 0,
    taxRate: 18,
    totalAmount: 64900,
    amountPaid: 25000,
    dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
    balanceDue: 39900,
    status: 'PARTIALLY_PAID',
  });

  // 9. Seed Payment
  const payment1 = await Payment.create({
    paymentId: 'PAY-2001',
    invoiceId: invoice1._id,
    customerId: customerDoc._id,
    amountPaid: 25000,
    paymentMethod: 'BANK_TRANSFER',
    transactionReference: 'NEFT-88392019',
    paymentDate: new Date(),
    status: 'COMPLETED',
  });

  await PaymentReceipt.create({
    receiptId: 'RCP-6001',
    receiptNumber: 'RCP-2026-0001',
    paymentId: payment1._id,
    invoiceId: invoice1._id,
    customerId: customerDoc._id,
    amount: 25000,
    receiptDate: new Date(),
  });

  // 10. Seed Certificate
  const certToken = `CERT-AMC-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
  await Certificate.create({
    certificateId: 'CERT-1001',
    certificateType: 'AMC',
    verificationToken: certToken,
    title: 'Annual Maintenance Contract Certificate',
    liftId: lift1._id,
    customerId: customerDoc._id,
    amcId: amcDoc._id,
    issueDate: new Date(),
    expiryDate: oneYearLater,
    details: 'Certified coverage under Comprehensive AMC Plan.',
  });

  // 11. Company Settings & Checklists
  await CompanySettings.create({
    companyName: 'Lift Tech AMC Solutions',
    legalName: 'Lift Tech Maintenance Pvt Ltd',
    address: '123 Elevator Tech Park, MIDC Industrial Area, Mumbai',
    phone: '+91 98765 43210',
    email: 'support@lifttech.local',
    gstin: '27AAAAA0000A1Z5',
  });

  await ChecklistTemplate.create({
    name: 'Standard Elevator Preventive Maintenance Checklist',
    category: 'PPM',
    items: [
      { task: 'Check traction machine motor, gear housing oil levels, and mounting bolts' },
      { task: 'Test brake shoe operation, air gap clearance, and emergency stop circuit' },
      { task: 'Inspect car door operator belt, door lock switches, and optical safety curtain' },
      { task: 'Clean shaft pit, check counterweight guide shoes, and oil buffers' },
      { task: 'Inspect hoist ropes, governor cable, and safety gear trip mechanisms' },
    ],
    status: 'ACTIVE',
  });

  console.log('✅ Database seeded successfully with 6 test accounts!');
  console.log('\n--- TEST ACCOUNTS SUMMARY ---');
  console.log('SUPER_ADMIN       : superadmin@test.local | Test@12345');
  console.log('ADMIN             : admin@test.local      | Test@12345');
  console.log('SERVICE_MANAGER   : manager@test.local    | Test@12345');
  console.log('TECHNICIAN        : technician@test.local | Test@12345');
  console.log('ACCOUNTANT        : accountant@test.local | Test@12345');
  console.log('CUSTOMER          : customer@test.local   | Test@12345');

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding error:', err);
  process.exit(1);
});
