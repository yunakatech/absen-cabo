import React from 'react';
import SupervisorHeader from '@/components/SupervisorHeader';
import { getSessionFromRequest } from '@/lib/auth';

export default async function SupervisorLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionFromRequest();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <SupervisorHeader userName={session?.name || 'Supervisor'} />
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
