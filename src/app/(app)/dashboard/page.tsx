
'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const DashboardView = dynamic(() => import('@/components/views/dashboard-view'), {
    suspense: true,
    loading: () => <DashboardSkeleton />,
});

const DashboardSkeleton = () => (
    <div className="p-4 md:p-8 space-y-8">
        <div className="space-y-2">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-6 w-1/2" />
        </div>
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <Skeleton className="aspect-square" />
            <Skeleton className="aspect-square" />
            <Skeleton className="aspect-square" />
            <Skeleton className="aspect-square" />
            <Skeleton className="aspect-square" />
            <Skeleton className="aspect-square" />
            <Skeleton className="aspect-square" />
            <Skeleton className="aspect-square" />
        </div>
    </div>
);

export default function DashboardPage() {
    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardView />
        </Suspense>
    );
}
