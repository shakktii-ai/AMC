# TEST ACCOUNTS & SYSTEM ACCESS CREDENTIALS

The Lift AMC & Maintenance Management System implements strict server-side Role-Based Access Control (RBAC) across 6 distinct user roles.

All test accounts use password: `Test@12345`

---

## 🔑 System User Credentials

| Role | Email Address | Password | Scoped Permissions & Accessible Features |
| :--- | :--- | :--- | :--- |
| **SUPER_ADMIN** | `superadmin@test.local` | `Test@12345` | Complete system control, user management, company settings, audit logs, full data access. |
| **ADMIN** | `admin@test.local` | `Test@12345` | Full operational management, AMC contracts, lift assets, breakdown dispatches, financial invoices. |
| **SERVICE_MANAGER** | `manager@test.local` | `Test@12345` | Field operations, technician dispatching, PPM scheduling, breakdown ticket handling. |
| **TECHNICIAN** | `technician@test.local` | `Test@12345` | Field job queue, mobile execution interface, safety checklist verification, service report submission (Strictly ownership-scoped). |
| **ACCOUNTANT** | `accountant@test.local` | `Test@12345` | Financial dashboard, tax invoice creation with state GST calculation, payment recording, receipts. |
| **CUSTOMER** | `customer@test.local` | `Test@12345` | Customer portal, registered lift assets, active AMCs, emergency breakdown logging, invoice status (Strictly IDOR-scoped). |

---

## 🛠 Database Management & Commands

* **Database Seeding**: `npm run db:seed`
  Seeds all 6 mandatory test accounts along with realistic initial customer profiles, lift assets, AMC contracts, PPM service routines, complaints, invoices, payments, and certificates.

* **Database Reset (Dev Guarded)**: `npm run db:reset`
  Requires environment variables: `ALLOW_DB_RESET=true` and `NODE_ENV !== 'production'`. Prevents accidental production data deletion.

* **Run Test Suite**: `npm test`
  Executes all 14 unit tests covering Auth, RBAC, Customer IDOR, Technician Ownership, AMC Overlap Guard, Complaint SLA, GST Calculation, and Payment Overpayment Prevention.
