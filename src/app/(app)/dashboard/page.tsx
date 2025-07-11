
'use client';

import React, { useState, useMemo } from 'react';
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
import type { Creation } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

type ViewMode = 'grid' | 'list';
type SortOrder = 'newest' | 'oldest';
type ProductFilter = 'all' | 'Laptop' | 'Phone' | 'Tablet';

export default function DashboardPage() {
    const { creations, startRemix } = useApp();
    const router = useRouter();
    const { toast } = useToast();

    const [modal, setModal] = useState({ isOpen: false, title: '', children: <></> });
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
                c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.prompt.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by product type
        if (productFilter !== 'all') {
            items = items.filter(c => c.deviceType.toLowerCase().includes(productFilter.toLowerCase()));
        }

        // Sort
        items.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        return items;
    }, [creations, searchTerm, productFilter, sortOrder]);

    const handleDescribe = async (creation: Creation) => {
        setIsDescribing(creation.id);
        try {
            const result = await describeImage({ imageDataUri: creation.url });
            setModal({
                isOpen: true,
                title: 'AI-Generated Prompts',
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
        } catch (error) {
            console.error('Describe error:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not generate descriptions for this image.' });
        } finally {
            setIsDescribing(null);
        }
    };
    
    const handleRemix = async (creation: Creation) => {
        setIsRemixing(creation.id);
        try {
            const result = await getRemixSuggestions({ prompt: creation.prompt });
            setModal({
                isOpen: true,
                title: 'Intelligent Remix Ideas',
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
        } catch (error) {
            console.error('Remix suggestions error:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not get remix ideas. Starting with original prompt.' });
            startRemix(creation);
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
                <h1 className="text-h1 font-bold font-headline mb-2">Your Design Library</h1>
                <p className="text-muted-foreground">All your unique SurfaceStory designs, ready to be revisited or remixed.</p>
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
                            className={viewMode === 'grid' ? "group relative rounded-xl overflow-hidden shadow-lg aspect-square" : "group bg-card border rounded-xl p-4 flex items-center gap-4"}
                            whileHover={viewMode === 'grid' ? { y: -5 } : {}}
                        >
                            <div className={viewMode === 'grid' ? 'relative w-full h-full' : 'relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden'}>
                                <Image src={creation.url} alt={creation.title || creation.prompt} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                            </div>

                            <div className={viewMode === 'grid' ? "absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end" : "flex-grow"}>
                                <p 
                                    className={`${viewMode === 'grid' ? 'text-white' : 'text-card-foreground'} text-sm font-semibold truncate`}
                                    title={creation.title}
                                >
                                    {creation.title || creation.prompt}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {creation.deviceType} &bull; {new Date(creation.createdAt).toLocaleDateString()}
                                </p>
                                <motion.div 
                                    className={`flex items-center gap-2 mt-2 ${viewMode === 'grid' ? 'opacity-0 group-hover:opacity-100' : ''} transition-opacity duration-300`}
                                >
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
                                </motion.div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-card rounded-xl border border-dashed">
                    <Icon name="ImageIcon" className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h4 className="text-xl font-semibold mb-2">No designs found</h4>
                    <p className="text-muted-foreground mb-6">
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
    );
}
