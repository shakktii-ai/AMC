export function calculateWarrantyStatus(warranty) {
  if (!warranty) return 'EXPIRED';
  if (warranty.status === 'VOID') return 'VOID';

  const now = new Date();
  const start = new Date(warranty.startDate);
  const end = new Date(warranty.endDate);

  if (now < start) {
    return 'NOT_STARTED';
  }

  if (now > end) {
    return 'EXPIRED';
  }

  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
  if (end.getTime() - now.getTime() <= thirtyDaysInMs) {
    return 'EXPIRING_SOON';
  }

  return 'ACTIVE';
}
