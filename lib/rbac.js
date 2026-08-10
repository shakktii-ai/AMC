import { getAuthUser } from './auth.js';

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  SERVICE_MANAGER: 'SERVICE_MANAGER',
  TECHNICIAN: 'TECHNICIAN',
  ACCOUNTANT: 'ACCOUNTANT',
  CUSTOMER: 'CUSTOMER',
};

export function hasRole(userRole, allowedRoles) {
  if (!userRole) return false;
  if (Array.isArray(allowedRoles)) {
    return allowedRoles.includes(userRole);
  }
  return userRole === allowedRoles;
}

export async function authorizeApi(req, allowedRoles = []) {
  const user = await getAuthUser(req);
  if (!user) {
    return { authorized: false, status: 401, error: 'Unauthorized: Authentication required', user: null };
  }

  if (user.status !== 'ACTIVE') {
    return { authorized: false, status: 403, error: 'Account is inactive', user: null };
  }

  if (allowedRoles.length > 0 && !hasRole(user.role, allowedRoles)) {
    return { authorized: false, status: 403, error: 'Forbidden: Insufficient permissions', user };
  }

  return { authorized: true, status: 200, error: null, user };
}

export function validateCustomerOwnership(user, targetCustomerId) {
  if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN || user.role === ROLES.SERVICE_MANAGER || user.role === ROLES.ACCOUNTANT) {
    return true;
  }
  if (user.role === ROLES.CUSTOMER) {
    return String(user.customerId) === String(targetCustomerId);
  }
  return false;
}

export function validateTechnicianOwnership(user, targetTechnicianUserId) {
  if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN || user.role === ROLES.SERVICE_MANAGER) {
    return true;
  }
  if (user.role === ROLES.TECHNICIAN) {
    return String(user.userId || user.id) === String(targetTechnicianUserId);
  }
  return false;
}
