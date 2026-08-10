import mongoose from 'mongoose';

const InstallationSchema = new mongoose.Schema(
  {
    installationId: { type: String, required: true, unique: true },
    liftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lift', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    assignedTechnicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    scheduledDate: { type: Date, required: true },
    completedDate: { type: Date },

    status: {
      type: String,
      enum: ['PLANNED', 'SCHEDULED', 'IN_PROGRESS', 'TESTING', 'INSPECTION', 'COMMISSIONED', 'HANDED_OVER', 'CANCELLED'],
      default: 'PLANNED',
    },

    safetyChecklist: [
      {
        item: { type: String },
        checked: { type: Boolean, default: false },
        notes: { type: String },
      },
    ],

    inspectionNotes: { type: String },
    commissioningDate: { type: Date },
    handoverDate: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Installation || mongoose.model('Installation', InstallationSchema);
