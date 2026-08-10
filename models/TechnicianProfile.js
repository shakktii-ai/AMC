import mongoose from 'mongoose';

const TechnicianProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    zone: { type: String, required: true, trim: true },
    skills: [{ type: String }],
    status: { type: String, enum: ['AVAILABLE', 'ON_JOB', 'OFF_DUTY'], default: 'AVAILABLE' },
    activeJobsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.TechnicianProfile || mongoose.model('TechnicianProfile', TechnicianProfileSchema);
