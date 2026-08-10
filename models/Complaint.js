import mongoose from 'mongoose';

const ComplaintSchema = new mongoose.Schema(
  {
    complaintId: { type: String, required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    liftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lift', required: true },
    category: {
      type: String,
      enum: ['PASSENGER_TRAPPED', 'LIFT_NOT_WORKING', 'DOOR_PROBLEM', 'NOISE', 'POWER_FAILURE', 'OTHER'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
      default: 'MEDIUM',
    },
    description: { type: String, required: true },
    assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: [
        'REGISTERED',
        'ACKNOWLEDGED',
        'DISPATCH_PENDING',
        'TECHNICIAN_DISPATCHED',
        'ACCEPTED',
        'ON_THE_WAY',
        'ON_SITE',
        'DIAGNOSING',
        'WORK_IN_PROGRESS',
        'RESOLVED',
        'CLOSED',
        'CANCELLED',
      ],
      default: 'REGISTERED',
    },
    slaTargetMinutes: { type: Number, required: true },
    slaDueDate: { type: Date, required: true },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Complaint || mongoose.model('Complaint', ComplaintSchema);
