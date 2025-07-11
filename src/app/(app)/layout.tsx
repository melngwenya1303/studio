'use client';

import React from 'react';
import Sidebar from '@/components/shared/sidebar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-background text-gray-800 dark:text-gray-200">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="h-full pt-16 md:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
