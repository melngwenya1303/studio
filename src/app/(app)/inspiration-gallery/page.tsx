
'use client';

import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { GALLERY_ITEMS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Modal from '@/components/shared/modal';
import { useToast } from '@/hooks/use-toast';
import { describeImage } from '@/ai/flows/describe-image';
import { getRemixSuggestions } from '@/ai/flows/get-remix-suggestions';
import type { GalleryItem } from '@/lib/types';
import Icon from '@/components/shared/icon';

export default function InspirationGalleryPage() {
    const { startRemix } = useApp();
    const { toast } = useToast();

    const [modal, setModal] = useState({ isOpen: false, title: '', children: <></> });
    const [isDescribing, setIsDescribing] = useState<number | null>(null);
    const [isRemixing, setIsRemixing] = useState<number | null>(null);

    const handleDescribe = async (item: GalleryItem) => {
        setIsDescribing(item.id);
        try {
            const result = await describeImage({ imageDataUri: item.url });
            setModal({
                isOpen: true,
                title: 'AI-Generated Prompts',
                children: (
                  <div className="space-y-4">
                      <p>Here are a few prompts our AI thinks could create an image like this. Click one to remix!</p>
                      <ul className="space-y-3">
                          {result.prompts.map((p, i) => (
                              <li key={i} onClick={() => {
                                startRemix({ ...item, prompt: p });
                                setModal(prev => ({...prev, isOpen: false}));
                              }} className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors">
                                  <p className="font-mono text-sm">"{p}"</p>
                              </li>
                          ))}
                      </ul>
                  </div>
                ),
            });
        } catch (error) {
            console.error('Describe error:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not generate descriptions for this image.' });
        } finally {
            setIsDescribing(null);
        }
    };

    const handleRemix = async (item: GalleryItem) => {
        setIsRemixing(item.id);
        try {
            const result = await getRemixSuggestions({ prompt: item.prompt });
            setModal({
                isOpen: true,
                title: 'Intelligent Remix Ideas',
                children: (
                    <div className="space-y-4">
                        <p>Not sure where to start? Try one of these AI-powered ideas to remix this design!</p>
                        <ul className="space-y-3">
                             <li onClick={() => {
                                startRemix(item);
                                setModal(prev => ({ ...prev, isOpen: false }));
                            }} className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors">
                                <p className="font-semibold">Just take me to the original</p>
                            </li>
                            {result.suggestions.map((p, i) => (
                                <li key={i} onClick={() => {
                                    startRemix({ ...item, prompt: p });
                                    setModal(prev => ({ ...prev, isOpen: false }));
                                }} className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors">
                                    <p className="font-mono text-sm">"{p}"</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                ),
            });
        } catch (error) {
            console.error('Remix suggestions error:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not get remix ideas. Starting with original prompt.' });
            startRemix(item);
        } finally {
            setIsRemixing(null);
        }
    };

    return (
        <div className="p-4 md:p-8 animate-fade-in">
            <Modal isOpen={modal.isOpen} title={modal.title} onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}>
                {modal.children}
            </Modal>
            <header className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white font-headline">Inspiration Gallery</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Discover decal designs from the community and start your own remix.</p>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {GALLERY_ITEMS.map(item => (
                    <div key={item.id} className="group relative rounded-xl overflow-hidden shadow-lg bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 flex flex-col">
                       <div className="relative w-full h-56">
                         <Image src={item.url} alt={item.prompt} fill className="object-cover" {...{ 'data-ai-hint': item['data-ai-hint'] }} />
                       </div>
                       <div className="p-4 flex flex-col flex-grow">
                           <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 line-clamp-2" title={item.prompt}>{item.prompt}</p>
                           <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-4 line-clamp-3">Curator's Note: "{item.curatorNote}"</p>
                           <div className="mt-auto flex items-center gap-2">
                            <Button onClick={() => handleRemix(item)} disabled={!!isRemixing} className="w-full">
                                {isRemixing === item.id ? <Icon name="Wand2" className="animate-pulse" /> : <Icon name="Sparkles" />}
                                Remix this Design
                            </Button>
                            <Button 
                                onClick={() => handleDescribe(item)} 
                                disabled={!!isDescribing}
                                variant="outline" 
                                size="icon" 
                                className="flex-shrink-0"
                                title="Describe with AI"
                            >
                                {isDescribing === item.id ? <Icon name="Wand2" className="w-4 h-4 animate-pulse" /> : <Icon name="BookOpen" className="w-4 h-4" />}
                            </Button>
                           </div>
                       </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
