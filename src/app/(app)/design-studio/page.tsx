
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/shared/icon';
import { useApp } from '@/contexts/AppContext';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const AiCreateView = dynamic(() => import('@/components/views/ai-create-view'), { 
    suspense: true, 
    loading: () => <div className="w-full h-full flex items-center justify-center"><Skeleton className="w-full h-[80vh]"/></div> 
});
const UploadView = dynamic(() => import('@/components/views/upload-view'), { 
    suspense: true, 
    loading: () => <div className="w-full h-full flex items-center justify-center"><Skeleton className="w-full h-[80vh]"/></div> 
});

type Flow = 'ai' | 'upload' | null;

export default function DesignStudioPage() {
    const { remixData } = useApp();
    const [flow, setFlow] = useState<Flow>(null);

    useEffect(() => {
        // If there's remix data (e.g., from Prompt Enhancer),
        // automatically set the flow to 'ai'.
        if (remixData) {
            setFlow('ai');
        }
    }, [remixData]);

    const handleResetFlow = () => {
        setFlow(null);
    };

    const SelectionScreen = () => (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center text-center p-8"
        >
            <div className="mb-8">
                <motion.div
                    className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-2xl mx-auto mb-6"
                    animate={{ rotate: [0, 15, -10, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                >
                    <Icon name="Wand2" className="w-12 h-12 text-white" />
                </motion.div>
                <h1 className="text-h1 font-headline mb-2">Start Your Creation</h1>
                <p className="text-muted-foreground max-w-md mx-auto text-body">
                    Choose your creative path. Generate a unique design with AI or upload your own artwork to see it on our products.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                <motion.div 
                    whileHover={{ y: -5 }} 
                    className="h-full"
                    onClick={() => setFlow('ai')}
                >
                    <div
                        className="w-full h-full p-8 flex flex-col items-start text-left bg-card text-card-foreground border rounded-lg hover:bg-card/90 cursor-pointer transition-colors"
                        role="button"
                        tabIndex={0}
                    >
                        <Icon name="Sparkles" className="w-8 h-8 mb-4 text-primary" />
                        <h2 className="text-h3 font-headline mb-2">Create with AI</h2>
                        <p className="text-muted-foreground text-body">
                            Describe your vision and let our AI bring it to life. Perfect for exploring new ideas.
                        </p>
                    </div>
                </motion.div>
                <motion.div 
                    whileHover={{ y: -5 }} 
                    className="h-full"
                    onClick={() => setFlow('upload')}
                >
                     <div
                        className="w-full h-full p-8 flex flex-col items-start text-left bg-card text-card-foreground border rounded-lg hover:bg-card/90 cursor-pointer transition-colors"
                        role="button"
                        tabIndex={0}
                    >
                        <Icon name="ImageIcon" className="w-8 h-8 mb-4 text-accent" />
                        <h2 className="text-h3 font-headline mb-2">Upload Artwork</h2>
                        <p className="text-muted-foreground text-body">
                            Already have a design? Upload your image and see how it looks on our products.
                        </p>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );

    const renderFlow = () => {
        switch (flow) {
            case 'ai':
                return <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Skeleton className="w-full h-full"/></div>}><AiCreateView onBack={handleResetFlow} /></Suspense>;
            case 'upload':
                return <Suspense fallback={<div className="w-full h-full flex items-center justify-center"><Skeleton className="w-full h-full"/></div>}><UploadView onBack={handleResetFlow} /></Suspense>;
            default:
                return <SelectionScreen />;
        }
    };
    
    return (
        <div className="h-full flex items-center justify-center">
            {renderFlow()}
        </div>
    );
}
