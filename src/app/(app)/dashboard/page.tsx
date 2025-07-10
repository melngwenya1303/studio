'use client';

import React, { useState } from 'react';
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

export default function DashboardPage() {
    const { creations, startRemix } = useApp();
    const router = useRouter();
    const { toast } = useToast();

    const [modal, setModal] = useState({ isOpen: false, title: '', children: <></> });
    const [isDescribing, setIsDescribing] = useState<string | null>(null);
    const [isRemixing, setIsRemixing] = useState<string | null>(null);

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
            <header className="mb-8 p-8 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/30 rounded-full filter blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-600/30 rounded-full filter blur-3xl"></div>
                <h2 className="text-3xl font-bold mb-2 relative">Your Design Library</h2>
                <p className="text-gray-300 relative">All your unique SurfaceStory designs, ready to be revisited or remixed.</p>
            </header>
            
            {creations.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {creations.map((creation, i) => (
                        <motion.div 
                            key={creation.id} 
                            className="group relative rounded-xl overflow-hidden shadow-lg aspect-square"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                        >
                            <Image src={creation.url} alt={creation.title || creation.prompt} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
                                <p className="text-white text-sm font-semibold truncate" title={creation.title}>{creation.title || creation.prompt}</p>
                                <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <motion.button 
                                        onClick={() => handleRemix(creation)} 
                                        disabled={!!isRemixing}
                                        className="px-3 py-1.5 bg-white/20 text-white text-xs font-semibold rounded-full backdrop-blur-md hover:bg-white/30 transition-all flex items-center gap-1 disabled:opacity-50"
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        {isRemixing === creation.id ? <Icon name="Wand2" className="w-3 h-3 animate-pulse" /> : <Icon name="Sparkles" className="w-3 h-3" />}
                                        Remix
                                    </motion.button>
                                    <motion.button 
                                        onClick={() => handleDescribe(creation)}
                                        disabled={!!isDescribing}
                                        className="px-3 py-1.5 bg-white/20 text-white text-xs font-semibold rounded-full backdrop-blur-md hover:bg-white/30 transition-all flex items-center gap-1 disabled:opacity-50"
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        {isDescribing === creation.id ? <Icon name="Wand2" className="w-3 h-3 animate-pulse" /> : <Icon name="BookOpen" className="w-3 h-3" />}
                                        Describe
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <Icon name="ImageIcon" className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h4 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">Your canvas is blank</h4>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">Navigate to the 'Design Studio' to create your first decal.</p>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button onClick={() => router.push('/design-studio')} size="lg">Start Designing</Button>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
