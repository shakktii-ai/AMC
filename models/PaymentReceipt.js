import mongoose from 'mongoose';

const PaymentReceiptSchema = new mongoose.Schema(
  {
    receiptId: { type: String, required: true, unique: true },
    receiptNumber: { type: String, required: true, unique: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
    invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    amount: { type: Number, required: true },
    receiptDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.PaymentReceipt || mongoose.model('PaymentReceipt', PaymentReceiptSchema);
