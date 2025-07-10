'use client';

import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { GALLERY_ITEMS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function InspirationGalleryPage() {
    const { remix } = useApp();

    return (
        <div className="p-4 md:p-8 animate-fade-in">
            <header className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white font-headline">Inspiration Gallery</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Discover decal designs from the community and start your own remix.</p>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {GALLERY_ITEMS.map(item => (
                    <div key={item.id} className="group relative rounded-xl overflow-hidden shadow-lg bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 flex flex-col">
                       <div className="relative w-full h-56">
                         <Image src={item.url} alt={item.prompt} layout="fill" className="object-cover" {...{ 'data-ai-hint': item['data-ai-hint'] }} />
                       </div>
                       <div className="p-4 flex flex-col flex-grow">
                           <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 line-clamp-2" title={item.prompt}>{item.prompt}</p>
                           <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-4 line-clamp-3">Curator's Note: "{item.curatorNote}"</p>
                           <div className="mt-auto">
                            <Button onClick={() => remix(item)} className="w-full">Remix this Design ✨</Button>
                           </div>
                       </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
