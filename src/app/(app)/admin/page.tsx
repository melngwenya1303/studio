
'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const AdminView = dynamic(() => import('@/components/views/admin-view'), {
    suspense: true,
    loading: () => <AdminSkeleton />,
});

const AdminSkeleton = () => (
    <div className="p-4 md:p-8 space-y-8">
        <div className="space-y-2">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-6 w-1/2" />
        </div>
        <div className="w-full">
            <Skeleton className="h-12 w-full" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-[400px]" />
    </div>
);

export default function AdminPage() {
    return (
        <Suspense fallback={<AdminSkeleton />}>
            <AdminView />
        </Suspense>
    );
}
