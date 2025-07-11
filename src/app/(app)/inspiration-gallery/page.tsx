
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
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
import { Card, CardContent, CardFooter } from '@/components/ui/card';

type CategoryFilter = 'all' | 'trending' | 'popular' | 'recent';
type ViewMode = 'grid' | 'list';

const GalleryCard = React.memo(function GalleryCard({ 
    item, 
    isDescribing, 
    isRemixing, 
    onLike, 
    onDescribe, 
    onRemix 
}: { 
    item: GalleryItem;
    isDescribing: boolean;
    isRemixing: boolean;
    onLike: (id: number) => void;
    onDescribe: (item: GalleryItem) => void;
    onRemix: (item: GalleryItem) => void;
}) {
    return (
        <Card className="group h-full flex flex-col">
            <CardContent className="p-0 relative">
               <div className="w-full aspect-square relative">
                 <Image src={item.url} alt={item.prompt} fill className="object-cover rounded-t-lg" {...{ 'data-ai-hint': item['data-ai-hint'] }} />
                  <Tooltip>
                    <TooltipTrigger asChild>
                         <Button
                            onClick={() => onLike(item.id)}
                            size="icon"
                            variant="ghost"
                            className="absolute top-2 right-2 bg-black/30 text-white backdrop-blur-sm rounded-full hover:bg-black/50 hover:text-pink-400"
                          >
                           <Icon name="Heart" />
                         </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Like</p></TooltipContent>
                  </Tooltip>
               </div>
            </CardContent>
           <div className="p-4 flex flex-col flex-grow">
                <p className="text-base font-semibold text-card-foreground mb-2 line-clamp-2" title={item.prompt}>{item.prompt}</p>
                <p className="text-sm text-muted-foreground italic mb-4 line-clamp-2">Curator's Note: "{item.curatorNote}"</p>
                <div className="flex items-center gap-2 text-sm mt-auto">
                   <Badge variant="outline" className="flex-shrink-0">{item.style}</Badge>
                   <div className="flex items-center gap-1.5 text-muted-foreground">
                       <Icon name="Heart" className="text-pink-500"/>
                       <span>{item.likes}</span>
                   </div>
               </div>
           </div>
           <CardFooter className="p-4 pt-0 flex justify-end gap-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Button 
                            onClick={() => onDescribe(item)} 
                            disabled={isDescribing}
                            variant="outline" 
                            size="icon" 
                            className="flex-shrink-0"
                        >
                            {isDescribing ? <Icon name="Wand2" className="animate-pulse" /> : <Icon name="BookOpen" />}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Describe with AI</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button onClick={() => onRemix(item)} disabled={isRemixing} className="flex-grow">
                            {isRemixing ? <Icon name="Wand2" className="animate-pulse" /> : <Icon name="Sparkles" />}
                            Remix
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Remix with AI</p></TooltipContent>
                </Tooltip>
           </CardFooter>
        </Card>
    );
});
    
const GalleryListItem = React.memo(function GalleryListItem({ 
    item, 
    isDescribing, 
    isRemixing, 
    onLike, 
    onDescribe, 
    onRemix 
}: { 
    item: GalleryItem;
    isDescribing: boolean;
    isRemixing: boolean;
    onLike: (id: number) => void;
    onDescribe: (item: GalleryItem) => void;
    onRemix: (item: GalleryItem) => void;
}) {
    return (
        <Card className="group flex flex-col md:flex-row items-center w-full">
            <div className="w-full md:w-48 h-48 md:h-auto md:self-stretch flex-shrink-0 relative">
                <Image src={item.url} alt={item.prompt} fill className="object-cover rounded-t-lg md:rounded-l-lg md:rounded-r-none" {...{ 'data-ai-hint': item['data-ai-hint'] }} />
            </div>
            <div className="p-4 flex flex-col flex-grow self-stretch">
                <p className="text-base font-semibold text-card-foreground mb-2 line-clamp-2" title={item.prompt}>{item.prompt}</p>
                <p className="text-sm text-muted-foreground italic mb-4 line-clamp-2">Curator's Note: "{item.curatorNote}"</p>
                <div className="flex-grow"></div>
                <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline">{item.style}</Badge>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Icon name="Heart" className="text-pink-500"/>
                            <span>{item.likes}</span>
                        </div>
                    </div>
                     <div className="flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild><Button onClick={() => onLike(item.id)} variant="outline" size="icon"><Icon name="Heart" /></Button></TooltipTrigger>
                            <TooltipContent><p>Like</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                 <Button 
                                    onClick={() => onDescribe(item)} 
                                    disabled={isDescribing}
                                    variant="outline" 
                                    size="icon" 
                                    className="flex-shrink-0"
                                >
                                    {isDescribing ? <Icon name="Wand2" className="animate-pulse" /> : <Icon name="BookOpen" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Describe with AI</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button onClick={() => onRemix(item)} disabled={isRemixing}>
                                    {isRemixing ? <Icon name="Wand2" className="animate-pulse" /> : <Icon name="Sparkles" />}
                                    Remix
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Remix with AI</p></TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </Card>
    );
});

export default function InspirationGalleryPage() {
    const { startRemix } = useApp();
    const { toast } = useToast();

    const [modal, setModal] = useState({ isOpen: false, title: '', children: <></> });
    const [isDescribing, setIsDescribing] = useState<number | null>(null);
    const [isRemixing, setIsRemixing] = useState<number | null>(null);

    // Filtering and view state
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
    const [styleFilter, setStyleFilter] = useState('all');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');

    const filteredItems = useMemo(() => {
        let items = [...GALLERY_ITEMS];
        
        if (categoryFilter !== 'all') {
            items = items.sort(() => 0.5 - Math.random());
        }

        if (styleFilter !== 'all') {
            items = items.filter(item => item.style === styleFilter);
        }

        return items;
    }, [categoryFilter, styleFilter]);


    const handleDescribe = useCallback(async (item: GalleryItem) => {
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
                              }} className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors">
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
    }, [startRemix, toast]);

    const handleRemix = useCallback(async (item: GalleryItem) => {
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
                            }} className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors">
                                <p className="font-semibold">Just take me to the original</p>
                            </li>
                            {result.suggestions.map((p, i) => (
                                <li key={i} onClick={() => {
                                    startRemix({ ...item, prompt: p });
                                    setModal(prev => ({ ...prev, isOpen: false }));
                                }} className="p-3 bg-muted rounded-lg cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors">
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
    }, [startRemix, toast]);

    const handleLike = useCallback((itemId: number) => {
        toast({ title: 'Liked!', description: 'You liked this design.' });
    }, [toast]);

    return (
        <TooltipProvider>
            <div className="p-4 md:p-8 animate-fade-in">
                <Modal isOpen={modal.isOpen} title={modal.title} onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}>
                    {modal.children}
                </Modal>
                <header className="mb-8">
                    <h1 className="text-h1 font-headline">Inspiration Gallery</h1>
                    <p className="text-muted-foreground mt-1 text-body">Discover decal designs from the community and start your own remix.</p>
                </header>

                <div className="mb-6 p-4 bg-card border rounded-lg flex flex-wrap items-center gap-4">
                    <ToggleGroup type="single" value={categoryFilter} onValueChange={(value: CategoryFilter) => value && setCategoryFilter(value)} className="bg-muted/50 rounded-full">
                        <ToggleGroupItem value="all" className="rounded-full px-4">All</ToggleGroupItem>
                        <ToggleGroupItem value="trending" className="rounded-full px-4">Trending</ToggleGroupItem>
                        <ToggleGroupItem value="popular" className="rounded-full px-4">Popular</ToggleGroupItem>
                        <ToggleGroupItem value="recent" className="rounded-full px-4">Recent</ToggleGroupItem>
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
                     <ToggleGroup type="single" value={viewMode} onValueChange={(value: ViewMode) => value && setViewMode(value)}>
                        <ToggleGroupItem value="grid" aria-label="Grid view"><Icon name="LayoutGrid" /></ToggleGroupItem>
                        <ToggleGroupItem value="list" aria-label="List view"><Icon name="List" /></ToggleGroupItem>
                    </ToggleGroup>
                </div>

                <div className={viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    : "space-y-4"
                }>
                    {filteredItems.map(item => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                           {viewMode === 'grid' ? (
                               <GalleryCard 
                                 item={item} 
                                 isDescribing={isDescribing === item.id}
                                 isRemixing={isRemixing === item.id}
                                 onDescribe={handleDescribe}
                                 onRemix={handleRemix}
                                 onLike={handleLike}
                                />
                            ) : (
                                <GalleryListItem
                                  item={item} 
                                  isDescribing={isDescribing === item.id}
                                  isRemixing={isRemixing === item.id}
                                  onDescribe={handleDescribe}
                                  onRemix={handleRemix}
                                  onLike={handleLike}
                                />
                            )}
                        </motion.div>
                    ))}
                </div>
                 {filteredItems.length === 0 && (
                    <div className="text-center py-20 bg-card rounded-xl border border-dashed col-span-full">
                        <Icon name="Search" className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <h4 className="text-xl font-semibold mb-2">No matching designs found</h4>
                        <p className="text-muted-foreground text-body">Try adjusting your style filter to see more results.</p>
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
};
