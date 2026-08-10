import mongoose from 'mongoose';

const InvoiceSchema = new mongoose.Schema(
  {
    invoiceId: { type: String, required: true, unique: true },
    invoiceNumber: { type: String, required: true, unique: true },
    type: { type: String, enum: ['AMC', 'SERVICE', 'OTHER'], default: 'AMC' },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    
    items: [
      {
        description: { type: String, required: true },
        quantity: { type: Number, default: 1 },
        unitPrice: { type: Number, required: true },
        amount: { type: Number, required: true },
      },
    ],

    billingSnapshot: {
      customerName: { type: String },
      customerCompany: { type: String },
      address: { type: String },
      city: { type: String },
      state: { type: String },
      gstin: { type: String },
    },

    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },

    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    taxRate: { type: Number, default: 18 },

    totalAmount: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    dueDate: { type: Date, required: true },
    balanceDue: { type: Number, required: true },

    status: {
      type: String,
      enum: ['DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'],
      default: 'DRAFT',
    },
  },
  { timestamps: true }
);

export default mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);
