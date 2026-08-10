import mongoose from 'mongoose';

const CertificateSchema = new mongoose.Schema(
  {
    certificateId: { type: String, required: true, unique: true },
    certificateType: {
      type: String,
      enum: ['INSTALLATION', 'HANDOVER', 'WARRANTY', 'AMC', 'SERVICE_COMPLETION'],
      required: true,
    },
    verificationToken: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    liftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lift' },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    amcId: { type: mongoose.Schema.Types.ObjectId, ref: 'AMC' },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    warrantyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warranty' },
    issueDate: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    details: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Certificate || mongoose.model('Certificate', CertificateSchema);
