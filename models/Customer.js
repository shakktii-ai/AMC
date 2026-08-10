import mongoose from 'mongoose';

const CustomerSchema = new mongoose.Schema(
  {
    customerId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    companyName: { type: String, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    alternatePhone: { type: String, trim: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    gstin: { type: String, trim: true },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
