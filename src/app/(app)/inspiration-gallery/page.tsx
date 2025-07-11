
'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/contexts/AppContext';
import { GALLERY_ITEMS, STYLES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Modal from '@/components/shared/modal';
import { useToast } from '@/hooks/use-toast';
import { describeImage } from '@/ai/flows/describe-image';
import { getRemixSuggestions } from '@/ai/flows/get-remix-suggestions';
import type { GalleryItem } from '@/lib/types';
import Icon from '@/components/shared/icon';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

type CategoryFilter = 'all' | 'trending' | 'popular' | 'recent';

export default function InspirationGalleryPage() {
    const { startRemix } = useApp();
    const { toast } = useToast();

    const [modal, setModal] = useState({ isOpen: false, title: '', children: <></> });
    const [isDescribing, setIsDescribing] = useState<number | null>(null);
    const [isRemixing, setIsRemixing] = useState<number | null>(null);

    // Filtering state
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
    const [styleFilter, setStyleFilter] = useState('all');

    const filteredItems = useMemo(() => {
        let items = [...GALLERY_ITEMS];
        
        // This is a placeholder for real filtering logic
        if (categoryFilter !== 'all') {
            // e.g., sort by popularity or date, for now just shuffle
            items = items.sort(() => 0.5 - Math.random());
        }

        if (styleFilter !== 'all') {
            items = items.filter(item => item.style === styleFilter);
        }

        return items;
    }, [categoryFilter, styleFilter]);


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
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error Describing Image', description: error.message });
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
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error Getting Suggestions', description: error.message });
            startRemix(item);
        } finally {
            setIsRemixing(null);
        }
    };

    const handleLike = (itemId: number) => {
        // Placeholder for like functionality
        toast({ title: 'Liked!', description: 'You liked this design.' });
    };

    return (
        <TooltipProvider>
            <div className="p-4 md:p-8 animate-fade-in">
                <Modal isOpen={modal.isOpen} title={modal.title} onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}>
                    {modal.children}
                </Modal>
                <header className="mb-8">
                    <h1 className="text-h1 font-bold font-headline">Inspiration Gallery</h1>
                    <p className="text-muted-foreground mt-1">Discover decal designs from the community and start your own remix.</p>
                </header>

                <div className="mb-6 p-4 bg-card border rounded-lg flex flex-wrap items-center gap-4">
                    <ToggleGroup type="single" value={categoryFilter} onValueChange={(value: CategoryFilter) => value && setCategoryFilter(value)}>
                        <ToggleGroupItem value="all">All</ToggleGroupItem>
                        <ToggleGroupItem value="trending">Trending</ToggleGroupItem>
                        <ToggleGroupItem value="popular">Popular</ToggleGroupItem>
                        <ToggleGroupItem value="recent">Recent</ToggleGroupItem>
                    </ToggleGroup>
                    <div className="flex-grow"></div>
                    <Select value={styleFilter} onValueChange={setStyleFilter}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filter by style..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Styles</SelectItem>
                            {STYLES.map(style => (
                                <SelectItem key={style.name} value={style.name}>{style.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-8">
                    {filteredItems.map(item => (
                        <div key={item.id} className="group relative rounded-xl overflow-hidden shadow-lg bg-card border flex flex-col break-inside-avoid">
                           <div className="relative w-full h-56">
                             <Image src={item.url} alt={item.prompt} fill className="object-cover" {...{ 'data-ai-hint': item['data-ai-hint'] }} />
                              <div className="absolute top-2 right-2 flex items-center gap-2">
                                 <Tooltip>
                                    <TooltipTrigger asChild>
                                         <Button
                                            onClick={() => handleLike(item.id)}
                                            size="icon"
                                            variant="ghost"
                                            className="bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 hover:text-pink-400"
                                          >
                                           <Icon name="Heart" />
                                         </Button>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Like</p></TooltipContent>
                                 </Tooltip>
                               </div>
                           </div>
                           <div className="p-4 flex flex-col flex-grow">
                                <div className="flex justify-between items-start">
                                    <p className="text-sm font-semibold text-card-foreground mb-2 line-clamp-2" title={item.prompt}>{item.prompt}</p>
                                    <Badge variant="outline" className="flex-shrink-0">{item.style}</Badge>
                                </div>
                               <p className="text-xs text-muted-foreground italic mb-4 line-clamp-3">Curator's Note: "{item.curatorNote}"</p>
                               
                               <div className="mt-auto flex justify-between items-center">
                                   <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                       <Icon name="Heart" className="text-pink-500"/>
                                       <span>{item.likes}</span>
                                   </div>
                                    <div className="flex items-center gap-2">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                 <Button 
                                                    onClick={() => handleDescribe(item)} 
                                                    disabled={!!isDescribing}
                                                    variant="outline" 
                                                    size="icon" 
                                                    className="flex-shrink-0"
                                                >
                                                    {isDescribing === item.id ? <Icon name="Wand2" className="w-4 h-4 animate-pulse" /> : <Icon name="BookOpen" className="w-4 h-4" />}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>Describe with AI</p></TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button onClick={() => handleRemix(item)} disabled={!!isRemixing} size="sm">
                                                    {isRemixing === item.id ? <Icon name="Wand2" className="animate-pulse" /> : <Icon name="Sparkles" />}
                                                    Remix
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>Remix with AI</p></TooltipContent>
                                        </Tooltip>
                                    </div>
                               </div>
                           </div>
                        </div>
                    ))}
                </div>
                 {filteredItems.length === 0 && (
                    <div className="text-center py-20 bg-card rounded-xl border border-dashed col-span-full">
                        <Icon name="Search" className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <h4 className="text-xl font-semibold mb-2">No matching designs found</h4>
                        <p className="text-muted-foreground">Try adjusting your style filter to see more results.</p>
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
};
