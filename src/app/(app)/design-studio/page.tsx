
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const AiCreateView = dynamic(() => import('@/components/views/ai-create-view'), { 
    suspense: true, 
    loading: () => <div className="w-full h-full flex items-center justify-center"><Skeleton className="w-full h-[80vh]"/></div> 
});

export default function DesignStudioPage() {
    return (
        <div className="h-full flex items-center justify-center">
            <AiCreateView />
        </div>
    );
}
