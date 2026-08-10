export function calculateInvoiceStatus(invoice) {
  if (!invoice) return 'DRAFT';
  if (['CANCELLED', 'DRAFT'].includes(invoice.status)) {
    return invoice.status;
  }

  const balance = invoice.balanceDue ?? (invoice.totalAmount - (invoice.amountPaid || 0));
  if (balance <= 0) {
    return 'PAID';
  }

  const now = new Date();
  const due = new Date(invoice.dueDate);

  if (now > due) {
    return 'OVERDUE';
  }

  if (invoice.amountPaid > 0 && balance > 0) {
    return 'PARTIALLY_PAID';
  }

  return 'ISSUED';
}
