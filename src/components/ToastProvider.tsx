'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3500,
        style: {
          background: '#1e293b',
          color: '#fff',
          fontSize: '14px',
          borderRadius: '10px',
          padding: '12px 16px',
        },
      }}
    />
  );
}
