import mongoose from 'mongoose';

const CompanySettingsSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, default: 'Lift Tech AMC Solutions' },
    legalName: { type: String, default: 'Lift Tech Maintenance Pvt Ltd' },
    logo: { type: String },
    address: { type: String, default: '123 Elevator Tech Park, MIDC' },
    phone: { type: String, default: '+91 98765 43210' },
    email: { type: String, default: 'support@lifttech.local' },
    website: { type: String, default: 'https://lifttech.local' },
    gstin: { type: String, default: '27AAAAA0000A1Z5' },
    currency: { type: String, default: 'INR' },
    invoicePrefix: { type: String, default: 'INV-2026-' },
    invoiceDueDays: { type: Number, default: 30 },
    invoiceTerms: { type: String, default: 'Payment due within 30 days of invoice date.' },
    invoiceFooter: { type: String, default: 'Thank you for choosing Lift Tech Maintenance.' },
  },
  { timestamps: true }
);

export default mongoose.models.CompanySettings || mongoose.model('CompanySettings', CompanySettingsSchema);
