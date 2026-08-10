import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const userCreateSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'SERVICE_MANAGER', 'TECHNICIAN', 'ACCOUNTANT', 'CUSTOMER']),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  customerId: z.string().optional().nullable(),
  zone: z.string().optional(),
  skills: z.array(z.string()).optional(),
});

export const customerSchema = z.object({
  customerId: z.string().min(2, 'Customer ID is required'),
  name: z.string().min(2, 'Name is required'),
  companyName: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(7, 'Phone number is required'),
  alternatePhone: z.string().optional(),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(4, 'Pincode is required'),
  gstin: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const liftSchema = z.object({
  liftId: z.string().min(2, 'Lift ID is required'),
  assetCode: z.string().min(2, 'Asset code is required'),
  serialNumber: z.string().min(2, 'Serial number is required'),
  customerId: z.string().min(1, 'Customer selection is required'),
  buildingName: z.string().min(2, 'Building name is required'),
  buildingAddress: z.string().min(5, 'Building address is required'),
  wing: z.string().optional(),
  floor: z.string().optional(),
  locationNotes: z.string().optional(),
  capacityKg: z.number().positive().default(408),
  capacityPersons: z.number().positive().default(6),
  speedMs: z.number().positive().default(1.0),
  floors: z.number().positive().default(5),
  stops: z.number().positive().default(5),
  driveType: z.string().default('GEARED'),
  controllerType: z.string().default('MICROPROCESSOR'),
  doorType: z.string().default('AUTOMATIC'),
  status: z.enum(['REGISTERED', 'UNDER_INSTALLATION', 'ACTIVE', 'UNDER_WARRANTY', 'UNDER_AMC', 'BREAKDOWN', 'DECOMMISSIONED']).default('REGISTERED'),
});

export const amcSchema = z.object({
  amcId: z.string().min(2, 'AMC ID is required'),
  contractNumber: z.string().min(2, 'Contract number is required'),
  customerId: z.string().min(1, 'Customer selection is required'),
  liftIds: z.array(z.string()).min(1, 'At least one lift must be selected'),
  planType: z.enum(['COMPREHENSIVE', 'NON_COMPREHENSIVE', 'PREVENTIVE_MAINTENANCE', 'CUSTOM']).default('COMPREHENSIVE'),
  ppmInterval: z.enum(['MONTHLY', 'QUARTERLY', 'BI_MONTHLY', 'CUSTOM']).default('MONTHLY'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  baseAmount: z.number().min(0),
  discount: z.number().min(0).default(0),
  coverage: z.string().optional(),
  terms: z.string().optional(),
});

export const complaintSchema = z.object({
  customerId: z.string().optional(),
  liftId: z.string().min(1, 'Lift selection is required'),
  category: z.enum(['PASSENGER_TRAPPED', 'LIFT_NOT_WORKING', 'DOOR_PROBLEM', 'NOISE', 'POWER_FAILURE', 'OTHER']),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  description: z.string().min(5, 'Description is required'),
});

export const invoiceSchema = z.object({
  invoiceNumber: z.string().min(2, 'Invoice number is required'),
  type: z.enum(['AMC', 'SERVICE', 'OTHER']).default('AMC'),
  customerId: z.string().min(1, 'Customer selection is required'),
  items: z.array(
    z.object({
      description: z.string().min(1, 'Description required'),
      quantity: z.number().positive().default(1),
      unitPrice: z.number().min(0),
    })
  ).min(1, 'At least one line item required'),
  discount: z.number().min(0).default(0),
  dueDate: z.string().or(z.date()),
});

export const paymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice selection is required'),
  amountPaid: z.number().positive('Payment amount must be greater than zero'),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'UPI', 'CARD', 'CHEQUE', 'OTHER']),
  transactionReference: z.string().optional(),
});

export const serviceReportSchema = z.object({
  serviceId: z.string().optional(),
  complaintId: z.string().optional(),
  checklist: z.array(
    z.object({
      task: z.string(),
      status: z.enum(['PASS', 'FAIL', 'NA']),
      notes: z.string().optional(),
    })
  ).optional(),
  findings: z.string().optional(),
  workPerformed: z.string().min(3, 'Work performed notes are required'),
  partsReplacedNotes: z.string().optional(),
  beforePhotos: z.array(z.string()).optional(),
  afterPhotos: z.array(z.string()).optional(),
  signature: z.string().optional(),
  customerConfirmation: z.boolean().default(true),
});
