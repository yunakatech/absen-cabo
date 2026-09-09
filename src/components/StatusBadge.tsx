import React from 'react';

type BadgeType = 'role' | 'leave' | 'attendance_source' | 'status';

interface Props {
  type: BadgeType;
  value: string;
}

export default function StatusBadge({ type, value }: Props) {
  let color = 'bg-slate-100 text-slate-700';

  if (type === 'role') {
    switch (value) {
      case 'ADMIN':
        color = 'bg-purple-950/80 text-purple-300 border border-purple-800/50 font-semibold';
        break;
      case 'SUPERVISOR':
        color = 'bg-blue-950/80 text-blue-300 border border-blue-800/50 font-semibold';
        break;
      case 'DRIVER':
        color = 'bg-orange-950/80 text-orange-300 border border-orange-800/50 font-semibold';
        break;
    }
  } else if (type === 'leave') {
    switch (value) {
      case 'PENDING':
        color = 'bg-amber-950/80 text-amber-300 border border-amber-800/60 font-semibold';
        break;
      case 'APPROVED':
        color = 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-semibold';
        break;
      case 'REJECTED':
        color = 'bg-rose-950/80 text-rose-400 border border-rose-800/60 font-semibold';
        break;
    }
  } else if (type === 'attendance_source') {
    switch (value) {
      case 'DRIVER':
        color = 'bg-orange-950/80 text-orange-300 border border-orange-800/50';
        break;
      case 'ADMIN':
        color = 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/50';
        break;
    }
  } else if (type === 'status') {
    switch (value) {
      case 'ACTIVE':
        color = 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 font-semibold';
        break;
      case 'INACTIVE':
        color = 'bg-rose-950/80 text-rose-400 border border-rose-800/50 font-semibold';
        break;
    }
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${color}`}>
      {value}
    </span>
  );
}
