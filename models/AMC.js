import mongoose from 'mongoose';

const AMCSchema = new mongoose.Schema(
  {
    amcId: { type: String, required: true, unique: true },
    contractNumber: { type: String, required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    liftIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lift', required: true }],
    planType: {
      type: String,
      enum: ['COMPREHENSIVE', 'NON_COMPREHENSIVE', 'PREVENTIVE_MAINTENANCE', 'CUSTOM'],
      default: 'COMPREHENSIVE',
    },
    ppmInterval: {
      type: String,
      enum: ['MONTHLY', 'QUARTERLY', 'BI_MONTHLY', 'CUSTOM'],
      default: 'MONTHLY',
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    baseAmount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    taxAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },

    coverage: { type: String },
    terms: { type: String },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'RENEWED', 'CANCELLED'],
      default: 'DRAFT',
    },
    renewalOf: { type: mongoose.Schema.Types.ObjectId, ref: 'AMC', default: null },
  },
  { timestamps: true }
);

export default mongoose.models.AMC || mongoose.model('AMC', AMCSchema);
