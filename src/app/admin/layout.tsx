import React from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { getSessionFromRequest } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionFromRequest();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      <AdminSidebar userName={session?.name || 'Admin'} />
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8 min-w-0 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">{children}</div>
      </main>
    </div>
  );
}
