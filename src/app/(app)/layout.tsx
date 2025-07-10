'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/shared/sidebar';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-black text-gray-800 dark:text-gray-200 font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="h-full pt-16 md:pt-0"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

    