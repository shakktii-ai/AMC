export function calculateAmcStatus(amc) {
  if (!amc) return 'EXPIRED';
  if (amc.status === 'CANCELLED') return 'CANCELLED';
  if (amc.status === 'DRAFT') return 'DRAFT';
  if (amc.status === 'RENEWED') return 'RENEWED';

  const now = new Date();
  const start = new Date(amc.startDate);
  const end = new Date(amc.endDate);

  if (now < start) {
    return 'DRAFT';
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

export function datesOverlap(startA, endA, startB, endB) {
  const sA = new Date(startA).getTime();
  const eA = new Date(endA).getTime();
  const sB = new Date(startB).getTime();
  const eB = new Date(endB).getTime();

  return Math.max(sA, sB) <= Math.min(eA, eB);
}

export async function checkAmcOverlap(AMCModel, liftIds = [], startDate, endDate, excludeAmcId = null) {
  if (!liftIds || liftIds.length === 0) return false;

  const targetStart = new Date(startDate);
  const targetEnd = new Date(endDate);

  const query = {
    liftIds: { $in: liftIds },
    status: { $in: ['ACTIVE', 'EXPIRING_SOON', 'DRAFT'] },
  };

  if (excludeAmcId) {
    query._id = { $ne: excludeAmcId };
  }

  const existingAmcs = await AMCModel.find(query);

  for (const existing of existingAmcs) {
    if (datesOverlap(targetStart, targetEnd, existing.startDate, existing.endDate)) {
      return true; // Overlap detected
    }
  }

  return false;
}
