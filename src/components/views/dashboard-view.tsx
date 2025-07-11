
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import Icon from '@/components/shared/icon';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Modal from '@/components/shared/modal';
import { useToast } from '@/hooks/use-toast';
import { describeImage } from '@/ai/flows/describe-image';
import { getRemixSuggestions } from '@/ai/flows/get-remix-suggestions';
import type { Creation, User } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Label } from '../ui/label';

type ViewMode = 'grid' | 'list';
type SortOrder = 'newest' | 'oldest';
type ProductFilter = 'all' | 'Laptop' | 'Phone' | 'Tablet';

const ShareModalContent = ({ creation, user }: { creation: Creation, user: { uid: string } }) => {
    const { toast } = useToast();
    const profileUrl = `${window.location.origin}/profile/${user.uid}`;
    const creationTitle = creation.title || 'My SurfaceStory Design';
    const twitterText = `Check out my new design "${creationTitle}" on @SurfaceStoryAI! #AIArt #SurfaceStory`;
    const pinterestDescription = `${creationTitle} - Created with SurfaceStory.`;

    const handleCopy = () => {
        navigator.clipboard.writeText(profileUrl);
        toast({ title: "Link Copied!", description: "Profile URL is now on your clipboard." });
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Share this creation with your friends and followers.</p>
            <div className="space-y-2">
                <Label htmlFor="share-link">Share Link</Label>
                <div className="flex gap-2">
                    <Input id="share-link" readOnly value={profileUrl} />
                    <Button onClick={handleCopy} variant="outline" size="icon"><Icon name="Copy" /></Button>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                 <Button asChild variant="outline">
                    <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(profileUrl)}`} target="_blank" rel="noopener noreferrer">
                        <Icon name="Share2" /> Share on X
                    </a>
                </Button>
                <Button asChild variant="outline">
                    <a href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(profileUrl)}&media=${encodeURIComponent(creation.url)}&description=${encodeURIComponent(pinterestDescription)}`} target="_blank" rel="noopener noreferrer">
                       <Icon name="Share2" /> Share on Pinterest
                    </a>
                </Button>
            </div>
        </div>
    )
}

export default function DashboardView() {
    const { user, creations, startRemix, fetchMoreCreations, hasMoreCreations, isLoadingCreations } = useApp();
    const router = useRouter();
    const { toast } = useToast();

    const [modal, setModal] = useState({ isOpen: false, title: '', children: <></>, size: 'md' as 'md' | 'lg' | 'xl'});
    const [isDescribing, setIsDescribing] = useState<string | null>(null);
    const [isRemixing, setIsRemixing] = useState<string | null>(null);

    // Filtering and sorting state
    const [searchTerm, setSearchTerm] = useState('');
    const [productFilter, setProductFilter] = useState<ProductFilter>('all');
    const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');

    const filteredAndSortedCreations = useMemo(() => {
        let items = [...creations];

        // Filter by search term
        if (searchTerm) {
            items = items.filter(c => 
                (c.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                c.prompt.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by product type
        if (productFilter !== 'all') {
            items = items.filter(c => c.deviceType.toLowerCase().includes(productFilter.toLowerCase()));
        }

        // Sort
        items.sort((a, b) => {
            const dateA = a.createdAt ? (a.createdAt as any).toDate().getTime() : 0;
            const dateB = b.createdAt ? (b.createdAt as any).toDate().getTime() : 0;
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        return items;
    }, [creations, searchTerm, productFilter, sortOrder]);

    const handleDescribe = useCallback(async (creation: Creation) => {
        setIsDescribing(creation.id);
        try {
            // Because we now store URLs instead of data URIs, we need to fetch the image data first.
            const response = await fetch(creation.url);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64data = reader.result as string;
                const result = await describeImage({ imageDataUri: base64data });
                setModal({
                    isOpen: true,
                    title: 'AI-Generated Prompts',
                    size: 'lg',
                    children: (
                      <div className="space-y-4">
                          <p>Here are a few prompts our AI thinks could create an image like this. Click one to remix!</p>
                          <ul className="space-y-3">
                              {result.prompts.map((p, i) => (
                                  <li key={i} onClick={() => {
                                    startRemix({ ...creation, prompt: p });
                                    setModal(prev => ({...prev, isOpen: false}));
                                  }} className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors">
                                      <p className="font-mono text-sm">"{p}"</p>
                                  </li>
                              ))}
                          </ul>
                      </div>
                    ),
                });
                setIsDescribing(null);
            };
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error Describing Image', description: error.message });
            setIsDescribing(null);
        }
    }, [startRemix, toast]);
    
    const handleRemix = useCallback(async (creation: Creation) => {
        setIsRemixing(creation.id);
        try {
            const result = await getRemixSuggestions({ prompt: creation.prompt });
            setModal({
                isOpen: true,
                title: 'Intelligent Remix Ideas',
                size: 'lg',
                children: (
                    <div className="space-y-4">
                        <p>Not sure where to start? Try one of these AI-powered ideas to remix your creation!</p>
                        <ul className="space-y-3">
                            <li onClick={() => {
                                startRemix(creation);
                                setModal(prev => ({ ...prev, isOpen: false }));
                            }} className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors">
                                <p className="font-semibold">Just take me to the original</p>
                            </li>
                            {result.suggestions.map((p, i) => (
                                <li key={i} onClick={() => {
                                    startRemix({ ...creation, prompt: p });
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
            startRemix(creation);
        } finally {
            setIsRemixing(null);
        }
    }, [startRemix, toast]);
    
    const handleLike = useCallback((creationId: string) => {
        // Placeholder for like functionality
        toast({ title: 'Liked!', description: 'You have favorited this design.' });
    }, [toast]);

    const handleShare = useCallback((creation: Creation) => {
        if (!user) return;
        setModal({
            isOpen: true,
            title: `Share "${creation.title || 'My Design'}"`,
            size: 'md',
            children: <ShareModalContent creation={creation} user={user} />,
        });
    }, [user]);

    return (
        <TooltipProvider>
            <div className="p-4 md:p-8 animate-fade-in">
                 <Modal isOpen={modal.isOpen} title={modal.title} onClose={() => setModal(prev => ({ ...prev, isOpen: false }))} size={modal.size}>
                    {modal.children}
                </Modal>
                <header className="mb-8">
                    <h1 className="text-h1 font-headline mb-2">Your Design Library</h1>
                    <p className="text-muted-foreground text-body">All your unique SurfaceStory designs, ready to be revisited or remixed.</p>
                </header>
                
                <div className="mb-6 p-4 bg-card border rounded-lg flex flex-wrap items-center gap-4">
                    <div className="relative flex-grow">
                        <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input 
                            placeholder="Search by title or prompt..."
                            className="pl-10 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <ToggleGroup type="single" value={productFilter} onValueChange={(value: ProductFilter) => value && setProductFilter(value)}>
                        <ToggleGroupItem value="all">All</ToggleGroupItem>
                        <ToggleGroupItem value="Laptop"><Icon name="Laptop" /> Laptop</ToggleGroupItem>
                        <ToggleGroupItem value="Phone"><Icon name="Smartphone" /> Phone</ToggleGroupItem>
                        <ToggleGroupItem value="Tablet"><Icon name="Tablet" /> Tablet</ToggleGroupItem>
                    </ToggleGroup>
                     <Select value={sortOrder} onValueChange={(value: SortOrder) => setSortOrder(value)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Sort by..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Newest First</SelectItem>
                            <SelectItem value="oldest">Oldest First</SelectItem>
                        </SelectContent>
                    </Select>
                    <ToggleGroup type="single" value={viewMode} onValueChange={(value: ViewMode) => value && setViewMode(value)}>
                        <ToggleGroupItem value="grid" aria-label="Grid view"><Icon name="LayoutGrid" /></ToggleGroupItem>
                        <ToggleGroupItem value="list" aria-label="List view"><Icon name="List" /></ToggleGroupItem>
                    </ToggleGroup>
                </div>

                {filteredAndSortedCreations.length > 0 ? (
                    <>
                        <div className={viewMode === 'grid' 
                            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                            : "space-y-4"
                        }>
                            {filteredAndSortedCreations.map((creation, i) => (
                                <motion.div 
                                    key={creation.id} 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: i * 0.05 }}
                                    className={viewMode === 'grid' ? "group relative rounded-xl overflow-hidden shadow-lg aspect-square bg-card border" : "bg-card border rounded-xl p-4 flex items-center gap-4"}
                                    whileHover={viewMode === 'grid' ? { y: -5 } : {}}
                                >
                                    <div className={viewMode === 'grid' ? 'relative w-full h-full' : 'relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden'}>
                                        <Image src={creation.url} alt={creation.title || creation.prompt} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                                        {viewMode === 'grid' && (
                                            <div className="absolute top-2 right-2 flex flex-col gap-2">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button onClick={() => handleLike(creation.id)} size="icon" variant="ghost" className="bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 hover:text-pink-400">
                                                            <Icon name="Heart" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent><p>Like</p></TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button onClick={() => handleShare(creation)} size="icon" variant="ghost" className="bg-black/30 text-white backdrop-blur-sm hover:bg-black/50 hover:text-white">
                                                            <Icon name="Share2" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent><p>Share</p></TooltipContent>
                                                </Tooltip>
                                            </div>
                                        )}
                                    </div>

                                    <div className={viewMode === 'grid' ? "absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end" : "flex-grow"}>
                                        <p 
                                            className={`${viewMode === 'grid' ? 'text-white' : 'text-card-foreground'} font-semibold truncate`}
                                            title={creation.title}
                                        >
                                            {creation.title || creation.prompt}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline">{creation.style}</Badge>
                                            <Badge variant="secondary">{creation.deviceType}</Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Created: {creation.createdAt ? (creation.createdAt as any).toDate().toLocaleDateString() : 'Just now'}
                                        </p>
                                        <motion.div 
                                            className={`flex items-center gap-2 mt-2 ${viewMode === 'grid' ? 'opacity-0 group-hover:opacity-100' : ''} transition-opacity duration-300`}
                                        >
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        onClick={() => handleRemix(creation)} 
                                                        disabled={!!isRemixing}
                                                        size="sm"
                                                        variant={viewMode === 'grid' ? 'default' : 'outline'}
                                                        className={`${viewMode === 'grid' ? 'bg-white/20 text-white backdrop-blur-md hover:bg-white/30' : ''} text-xs font-semibold rounded-full flex items-center gap-1 disabled:opacity-50`}
                                                    >
                                                        {isRemixing === creation.id ? <Icon name="Wand2" className="w-3 h-3 animate-pulse" /> : <Icon name="Sparkles" className="w-3 h-3" />}
                                                        Remix
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent><p>Remix with AI</p></TooltipContent>
                                            </Tooltip>

                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        onClick={() => handleDescribe(creation)}
                                                        disabled={!!isDescribing}
                                                        size="sm"
                                                        variant={viewMode === 'grid' ? 'default' : 'outline'}
                                                        className={`${viewMode === 'grid' ? 'bg-white/20 text-white backdrop-blur-md hover:bg-white/30' : ''} text-xs font-semibold rounded-full flex items-center gap-1 disabled:opacity-50`}
                                                    >
                                                        {isDescribing === creation.id ? <Icon name="Wand2" className="w-3 h-3 animate-pulse" /> : <Icon name="BookOpen" className="w-3 h-3" />}
                                                        Describe
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent><p>Describe with AI</p></TooltipContent>
                                            </Tooltip>
                                            
                                            {viewMode === 'list' && (
                                                <>
                                                 <Tooltip>
                                                    <TooltipTrigger asChild><Button onClick={() => handleShare(creation)} size="sm" variant="outline"><Icon name="Share2" /></Button></TooltipTrigger>
                                                    <TooltipContent><p>Share</p></TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            onClick={() => handleLike(creation.id)}
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-xs font-semibold rounded-full flex items-center gap-1 hover:text-pink-500"
                                                        >
                                                            <Icon name="Heart" className="w-3 h-3" />
                                                            Like
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent><p>Like</p></TooltipContent>
                                                </Tooltip>
                                                </>
                                            )}
                                        </motion.div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        {hasMoreCreations && (
                             <div className="mt-8 text-center">
                                <Button onClick={fetchMoreCreations} disabled={isLoadingCreations}>
                                    {isLoadingCreations ? 'Loading...' : 'Load More'}
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-20 bg-card rounded-xl border border-dashed">
                        <Icon name="ImageIcon" className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <h4 className="text-xl font-semibold mb-2">No designs found</h4>
                        <p className="text-muted-foreground mb-6 text-body">
                            {creations.length > 0 ? "Try adjusting your search or filters." : "Navigate to the 'Design Studio' to create your first masterpiece."}
                        </p>
                        {creations.length === 0 && (
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button onClick={() => router.push('/design-studio')} size="lg">Start Designing</Button>
                            </motion.div>
                        )}
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}
