import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: Object },
  },
  { timestamps: true }
);

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
