'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import Icon from '@/components/shared/icon';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function DashboardPage() {
    const { creations, remix } = useApp();
    const router = useRouter();

    return (
        <div className="p-4 md:p-8 animate-fade-in">
            <header className="mb-8 p-8 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/30 rounded-full filter blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-600/30 rounded-full filter blur-3xl"></div>
                <h2 className="text-3xl font-bold mb-2 relative font-headline">Your Design Library</h2>
                <p className="text-gray-300 relative">All your unique SurfaceStory designs, ready to be revisited or remixed.</p>
            </header>
            
            {creations.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {creations.map((creation, i) => (
                        <motion.div 
                            key={creation.id} 
                            className="group relative rounded-xl overflow-hidden cursor-pointer shadow-lg aspect-square"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: i * 0.05 }}
                        >
                            <Image src={creation.url} alt={creation.title || creation.prompt} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
                                <p className="text-white text-sm font-semibold truncate">{creation.title || creation.prompt}</p>
                                <motion.button 
                                    onClick={() => remix(creation)} 
                                    className="mt-2 text-left self-start px-3 py-1.5 bg-white/20 text-white text-xs font-semibold rounded-full backdrop-blur-md hover:bg-white/30 transition-all opacity-0 group-hover:opacity-100"
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                >
                                    Remix ✨
                                </motion.button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <Icon name="ImageIcon" className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h4 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2 font-headline">Your canvas is blank</h4>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">Navigate to the 'Design Studio' to create your first decal.</p>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button onClick={() => router.push('/design-studio')} size="lg">Start Designing</Button>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
