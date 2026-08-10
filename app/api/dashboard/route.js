import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db.js';
import Customer from '../../../models/Customer.js';
import Lift from '../../../models/Lift.js';
import AMC from '../../../models/AMC.js';
import Service from '../../../models/Service.js';
import Complaint from '../../../models/Complaint.js';
import Invoice from '../../../models/Invoice.js';
import { authorizeApi, ROLES } from '../../../lib/rbac.js';
import { calculateAmcStatus } from '../../../lib/amc-service.js';

export async function GET(req) {
  try {
    await dbConnect();
    const auth = await authorizeApi(req, []);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const role = auth.user.role;
    let customerFilter = {};

    if (role === ROLES.CUSTOMER) {
      if (!auth.user.customerId) {
        return NextResponse.json({
          success: true,
          stats: { totalCustomers: 0, totalLifts: 0, activeAmc: 0, upcomingAmcExpiry: 0, openComplaints: 0, pendingServices: 0, pendingInvoices: 0, outstandingAmount: 0 },
        });
      }
      customerFilter = { customerId: auth.user.customerId };
    }

    // Role-specific stats queries
    let totalCustomersQuery = Customer.countDocuments({ status: 'ACTIVE' });
    let totalLiftsQuery = Lift.countDocuments(customerFilter);
    let allAmcsQuery = AMC.find(role === ROLES.CUSTOMER ? { customerId: auth.user.customerId } : {});
    let openComplaintsQuery = Complaint.countDocuments({
      ...customerFilter,
      status: { $nin: ['RESOLVED', 'CLOSED', 'CANCELLED'] },
      ...(role === ROLES.TECHNICIAN ? { assignedTechnician: auth.user.id } : {}),
    });
    let pendingServicesQuery = Service.countDocuments({
      ...customerFilter,
      status: { $nin: ['COMPLETED', 'CANCELLED'] },
      ...(role === ROLES.TECHNICIAN ? { technicianId: auth.user.id } : {}),
    });
    let pendingInvoicesQuery = Invoice.find({
      ...customerFilter,
      status: { $in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] },
    });

    const [totalCustomers, totalLifts, allAmcs, openComplaints, pendingServices, pendingInvoices] = await Promise.all([
      totalCustomersQuery,
      totalLiftsQuery,
      allAmcsQuery,
      openComplaintsQuery,
      pendingServicesQuery,
      pendingInvoicesQuery,
    ]);

    let activeAmc = 0;
    let upcomingAmcExpiry = 0;

    allAmcs.forEach((amc) => {
      const status = calculateAmcStatus(amc);
      if (status === 'ACTIVE') activeAmc++;
      if (status === 'EXPIRING_SOON') upcomingAmcExpiry++;
    });

    const pendingInvoicesCount = pendingInvoices.length;
    const outstandingAmount = pendingInvoices.reduce((acc, inv) => acc + (inv.balanceDue || 0), 0);

    return NextResponse.json({
      success: true,
      stats: {
        totalCustomers: role === ROLES.CUSTOMER ? 1 : totalCustomers,
        totalLifts,
        activeAmc,
        upcomingAmcExpiry,
        openComplaints,
        pendingServices,
        pendingInvoices: pendingInvoicesCount,
        outstandingAmount: Math.round(outstandingAmount * 100) / 100,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
