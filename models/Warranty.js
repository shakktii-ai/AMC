import mongoose from 'mongoose';

const WarrantySchema = new mongoose.Schema(
  {
    warrantyId: { type: String, required: true, unique: true },
    liftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lift', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    coverage: { type: String, required: true },
    exclusions: { type: String },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'VOID'],
      default: 'ACTIVE',
    },
    certificateToken: { type: String, unique: true },
  },
  { timestamps: true }
);

export default mongoose.models.Warranty || mongoose.model('Warranty', WarrantySchema);
