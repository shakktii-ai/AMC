import mongoose from 'mongoose';

const ServiceReportSchema = new mongoose.Schema(
  {
    reportId: { type: String, required: true, unique: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    complaintId: { type: mongoose.Schema.Types.ObjectId, ref: 'Complaint' },
    technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    checklist: [
      {
        task: { type: String },
        status: { type: String, enum: ['PASS', 'FAIL', 'NA'], default: 'PASS' },
        notes: { type: String },
      },
    ],

    findings: { type: String },
    workPerformed: { type: String, required: true },
    partsReplacedNotes: { type: String },
    beforePhotos: [{ type: String }],
    afterPhotos: [{ type: String }],

    customerConfirmation: { type: Boolean, default: false },
    signature: { type: String }, // Base64 or URL
    signedAt: { type: Date },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.ServiceReport || mongoose.model('ServiceReport', ServiceReportSchema);
