import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema(
  {
    serviceId: { type: String, required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    liftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lift', required: true },
    amcId: { type: mongoose.Schema.Types.ObjectId, ref: 'AMC' },
    technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    serviceSource: { type: String, enum: ['PPM', 'BREAKDOWN', 'ADHOC'], default: 'PPM' },

    scheduledStartTime: { type: Date, required: true },
    scheduledEndTime: { type: Date, required: true },
    actualStartTime: { type: Date },
    actualEndTime: { type: Date },

    status: {
      type: String,
      enum: ['SCHEDULED', 'ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'ON_SITE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'SCHEDULED',
    },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Service || mongoose.model('Service', ServiceSchema);
