export function calculateGst({ items = [], subtotal, discount = 0, customerState, companyState = 'MAHARASHTRA' }) {
  const taxableAmount = Math.max(0, (subtotal ?? 0) - discount);
  const isSameState = !customerState || customerState.trim().toUpperCase() === companyState.trim().toUpperCase();

  let cgstRate = 0;
  let sgstRate = 0;
  let igstRate = 0;

  if (isSameState) {
    cgstRate = 9;
    sgstRate = 9;
  } else {
    igstRate = 18;
  }

  const cgstAmount = Math.round((taxableAmount * cgstRate) / 100 * 100) / 100;
  const sgstAmount = Math.round((taxableAmount * sgstRate) / 100 * 100) / 100;
  const igstAmount = Math.round((taxableAmount * igstRate) / 100 * 100) / 100;

  const totalTax = cgstAmount + sgstAmount + igstAmount;
  const totalAmount = Math.round((taxableAmount + totalTax) * 100) / 100;

  return {
    taxableAmount,
    isSameState,
    cgstRate,
    sgstRate,
    igstRate,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalTax,
    totalAmount,
  };
}
