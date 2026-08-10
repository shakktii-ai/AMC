import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema(
  {
    documentId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileType: { type: String },
    fileSize: { type: Number },
    category: { type: String, enum: ['CONTRACT', 'MANUAL', 'CERTIFICATE', 'INVOICE', 'SERVICE_REPORT', 'OTHER'], default: 'OTHER' },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    liftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lift' },
    amcId: { type: mongoose.Schema.Types.ObjectId, ref: 'AMC' },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.models.Document || mongoose.model('Document', DocumentSchema);
