export const SLA_TARGETS_MINUTES = {
  CRITICAL: 60,
  HIGH: 120,
  MEDIUM: 240,
  LOW: 480,
};

export function getSlaTargetMinutes(priority) {
  return SLA_TARGETS_MINUTES[priority] || SLA_TARGETS_MINUTES.MEDIUM;
}

export function calculateSlaDueDate(createdAt, priority) {
  const targetMinutes = getSlaTargetMinutes(priority);
  const created = new Date(createdAt);
  return new Date(created.getTime() + targetMinutes * 60 * 1000);
}

export function calculateSlaStatus(complaint) {
  const { createdAt, priority, status, resolvedAt } = complaint;
  const targetMinutes = complaint.slaTargetMinutes || getSlaTargetMinutes(priority);
  const createdTime = new Date(createdAt).getTime();
  const slaDueTime = createdTime + targetMinutes * 60 * 1000;
  const comparisonTime = resolvedAt ? new Date(resolvedAt).getTime() : Date.now();

  const isCompleted = ['RESOLVED', 'CLOSED'].includes(status);

  if (comparisonTime > slaDueTime) {
    return 'BREACHED';
  }

  const totalAllowedMs = targetMinutes * 60 * 1000;
  const elapsedMs = comparisonTime - createdTime;
  const percentage = (elapsedMs / totalAllowedMs) * 100;

  if (percentage >= 75) {
    return 'AT_RISK';
  }

  return 'WITHIN_SLA';
}
