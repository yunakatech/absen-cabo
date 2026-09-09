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
        color = 'bg-purple-100 text-purple-700 font-semibold';
        break;
      case 'SUPERVISOR':
        color = 'bg-blue-100 text-blue-700 font-semibold';
        break;
      case 'DRIVER':
        color = 'bg-orange-100 text-orange-700 font-semibold';
        break;
    }
  } else if (type === 'leave') {
    switch (value) {
      case 'PENDING':
        color = 'bg-amber-100 text-amber-800 border border-amber-300';
        break;
      case 'APPROVED':
        color = 'bg-orange-100 text-orange-800 border border-orange-300';
        break;
      case 'REJECTED':
        color = 'bg-rose-100 text-rose-800 border border-rose-300';
        break;
    }
  } else if (type === 'attendance_source') {
    switch (value) {
      case 'DRIVER':
        color = 'bg-orange-50 text-orange-600 border border-orange-200';
        break;
      case 'ADMIN':
        color = 'bg-indigo-50 text-indigo-600 border border-indigo-200';
        break;
    }
  } else if (type === 'status') {
    switch (value) {
      case 'ACTIVE':
        color = 'bg-orange-100 text-orange-700';
        break;
      case 'INACTIVE':
        color = 'bg-rose-100 text-rose-700';
        break;
    }
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {value}
    </span>
  );
}
