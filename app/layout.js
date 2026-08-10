import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Lift AMC & Maintenance Management System',
  description: 'Production-usable Lift AMC & Maintenance Management Platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
