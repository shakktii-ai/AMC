import AuditLog from '../models/AuditLog.js';

export async function logAudit({ userId, action, entity, entityId, metadata = {} }) {
  try {
    const log = await AuditLog.create({
      userId: userId || null,
      action,
      entity,
      entityId: entityId ? String(entityId) : null,
      metadata,
      timestamp: new Date(),
    });
    return log;
  } catch (err) {
    console.error('[Audit Logger error]', err);
    return null;
  }
}
