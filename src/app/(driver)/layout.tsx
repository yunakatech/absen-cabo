import React from 'react';
import DriverHeader from '@/components/DriverHeader';
import { getSessionFromRequest } from '@/lib/auth';

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionFromRequest();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <DriverHeader userName={session?.name || 'Pak Driver'} />
      <div className="flex-1 w-full max-w-md mx-auto p-4 sm:p-6 flex flex-col justify-start">
        {children}
      </div>
    </div>
  );
}
