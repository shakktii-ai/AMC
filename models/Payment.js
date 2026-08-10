import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema(
  {
    paymentId: { type: String, required: true, unique: true },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    amountPaid: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'BANK_TRANSFER', 'UPI', 'CARD', 'CHEQUE', 'OTHER'],
      required: true,
    },
    transactionReference: { type: String },
    paymentDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['COMPLETED', 'REFUNDED', 'FAILED'], default: 'COMPLETED' },
  },
  { timestamps: true }
);

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
