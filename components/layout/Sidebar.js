'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Wrench,
  FileText,
  CalendarCheck,
  AlertTriangle,
  Receipt,
  CreditCard,
  Award,
  FolderDown,
  Settings,
  History,
  ShieldCheck,
  ListChecks,
  PlusCircle,
  Truck,
} from 'lucide-react';

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const role = user?.role || 'CUSTOMER';

  const navItems = [
    {
      title: 'OVERVIEW',
      roles: ['SUPER_ADMIN', 'ADMIN', 'SERVICE_MANAGER', 'ACCOUNTANT', 'CUSTOMER'],
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'SERVICE_MANAGER', 'ACCOUNTANT', 'CUSTOMER'] },
        { label: 'Technician Portal', href: '/technician', icon: Wrench, roles: ['TECHNICIAN'] },
      ],
    },
    {
      title: 'OPERATIONS & ASSETS',
      roles: ['SUPER_ADMIN', 'ADMIN', 'SERVICE_MANAGER', 'TECHNICIAN', 'CUSTOMER'],
      items: [
        { label: 'Customers', href: '/customers', icon: Building2, roles: ['SUPER_ADMIN', 'ADMIN', 'SERVICE_MANAGER', 'ACCOUNTANT'] },
        { label: 'Lift Assets', href: '/lifts', icon: Wrench, roles: ['SUPER_ADMIN', 'ADMIN', 'SERVICE_MANAGER', 'TECHNICIAN', 'CUSTOMER'] },
        { label: 'Installations', href: '/installations', icon: Wrench, roles: ['SUPER_ADMIN', 'ADMIN', 'SERVICE_MANAGER', 'TECHNICIAN'] },
        { label: 'Warranty Register', href: '/warranty', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'ADMIN', 'SERVICE_MANAGER', 'CUSTOMER'] },
        { label: 'AMC Contracts', href: '/amc', icon: FileText, roles: ['SUPER_ADMIN', 'ADMIN', 'SERVICE_MANAGER', 'CUSTOMER'] },
      ],
    },
    {
      title: 'FIELD & DISPATCH',
      roles: ['SUPER_ADMIN', 'ADMIN', 'SERVICE_MANAGER', 'TECHNICIAN', 'CUSTOMER'],
      items: [
        { label: 'Service Schedule', href: '/services', icon: CalendarCheck, roles: ['SUPER_ADMIN', 'ADMIN', 'SERVICE_MANAGER', 'TECHNICIAN'] },
        { label: 'PPM Routines', href: '/services/ppm', icon: CalendarCheck, roles: ['SUPER_ADMIN', 'ADMIN', 'SERVICE_MANAGER'] },
        { label: 'Breakdown Complaints', href: '/complaints', icon: AlertTriangle, roles: ['SUPER_ADMIN', 'ADMIN', 'SERVICE_MANAGER', 'TECHNICIAN', 'CUSTOMER'] },
      ],
    },
    {
      title: 'FINANCE & RECEIPTS',
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'CUSTOMER'],
      items: [
        { label: 'Finance Dashboard', href: '/finance', icon: CreditCard, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
        { label: 'Invoices', href: '/invoices', icon: Receipt, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'CUSTOMER'] },
        { label: 'Payments', href: '/payments', icon: CreditCard, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'CUSTOMER'] },
      ],
    },
    {
      title: 'COMPLIANCE & DOCUMENTS',
      roles: ['SUPER_ADMIN', 'ADMIN', 'SERVICE_MANAGER', 'ACCOUNTANT', 'CUSTOMER'],
      items: [
        { label: 'Certificates', href: '/certificates', icon: Award, roles: ['SUPER_ADMIN', 'ADMIN', 'SERVICE_MANAGER', 'CUSTOMER'] },
        { label: 'Document Repository', href: '/documents', icon: FolderDown, roles: ['SUPER_ADMIN', 'ADMIN', 'SERVICE_MANAGER', 'ACCOUNTANT', 'CUSTOMER'] },
      ],
    },
    {
      title: 'ADMINISTRATION',
      roles: ['SUPER_ADMIN', 'ADMIN'],
      items: [
        { label: 'User Directory', href: '/users', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN'] },
        { label: 'Checklists', href: '/settings/checklists', icon: ListChecks, roles: ['SUPER_ADMIN', 'ADMIN', 'SERVICE_MANAGER'] },
        { label: 'Settings', href: '/settings', icon: Settings, roles: ['SUPER_ADMIN', 'ADMIN'] },
        { label: 'Audit Trail', href: '/audit-logs', icon: History, roles: ['SUPER_ADMIN', 'ADMIN'] },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col min-h-screen border-r border-slate-800 flex-shrink-0">
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center text-white font-black text-lg shadow-md">
          L
        </div>
        <div>
          <div className="font-bold text-white text-sm tracking-wide">LIFT AMC SYSTEM</div>
          <div className="text-[10px] font-mono text-sky-400">OPERATIONAL V1.0</div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {navItems.map((group, idx) => {
          if (!group.roles.includes(role)) return null;

          const filteredItems = group.items.filter((item) => item.roles.includes(role));
          if (filteredItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1.5">
              <div className="px-3 text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                {group.title}
              </div>
              {filteredItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
