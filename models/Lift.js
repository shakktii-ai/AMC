import mongoose from 'mongoose';

const LiftSchema = new mongoose.Schema(
  {
    liftId: { type: String, required: true, unique: true, trim: true },
    assetCode: { type: String, required: true, unique: true, trim: true },
    serialNumber: { type: String, required: true, trim: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },

    buildingName: { type: String, required: true },
    buildingAddress: { type: String, required: true },
    wing: { type: String },
    floor: { type: String },
    locationNotes: { type: String },

    capacityKg: { type: Number, default: 408 },
    capacityPersons: { type: Number, default: 6 },
    speedMs: { type: Number, default: 1.0 },
    floors: { type: Number, default: 5 },
    stops: { type: Number, default: 5 },

    driveType: { type: String, default: 'GEARED' },
    controllerType: { type: String, default: 'MICROPROCESSOR' },
    doorType: { type: String, default: 'AUTOMATIC' },

    status: {
      type: String,
      enum: ['REGISTERED', 'UNDER_INSTALLATION', 'ACTIVE', 'UNDER_WARRANTY', 'UNDER_AMC', 'BREAKDOWN', 'DECOMMISSIONED'],
      default: 'REGISTERED',
    },

    verificationToken: { type: String, unique: true, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Lift || mongoose.model('Lift', LiftSchema);
