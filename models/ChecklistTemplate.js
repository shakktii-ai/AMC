import mongoose from 'mongoose';

const ChecklistTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, enum: ['PPM', 'SAFETY', 'INSPECTION', 'BREAKDOWN'], default: 'PPM' },
    items: [
      {
        task: { type: String, required: true },
        description: { type: String },
      },
    ],
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

export default mongoose.models.ChecklistTemplate || mongoose.model('ChecklistTemplate', ChecklistTemplateSchema);
