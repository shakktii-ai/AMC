import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'ADMIN', 'SERVICE_MANAGER', 'TECHNICIAN', 'ACCOUNTANT', 'CUSTOMER'],
      required: true,
    },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
