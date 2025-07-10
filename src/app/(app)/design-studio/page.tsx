
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { useToast } from "@/hooks/use-toast";
import { enhancePrompt } from '@/ai/flows/enhance-prompt';
import { generateImage } from '@/ai/flows/generate-image';
import { generateTitle } from '@/ai/flows/generate-title';
import { DEVICES, STYLES } from '@/lib/constants';
import type { Device, Style, Creation } from '@/lib/types';
import Icon from '@/components/shared/icon';
import Modal from '@/components/shared/modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

const Scene = dynamic(() => import('@/components/canvas/Scene'), {
    ssr: false,
    loading: () => (
        <div className="flex flex-col items-center justify-center h-full w-full text-primary">
            <Skeleton className="w-full h-full" />
            <div className="absolute flex flex-col items-center justify-center">
                <Icon name="Laptop" className="w-16 h-16 animate-pulse" />
                <p className="mt-4 font-semibold">Loading 3D Preview...</p>
            </div>
        </div>
    )
});


export default function DesignStudioPage() {
    const { user, addCreation, remixData, clearRemixData } = useApp();
    const { toast } = useToast();

    const [prompt, setPrompt] = useState('');
    const [selectedDevice, setSelectedDevice] = useState<Omit<Device, 'model'>>(DEVICES[0]);
    const [selectedStyle, setSelectedStyle] = useState<Style>(STYLES[0]);
    const [generatedDecal, setGeneratedDecal] = useState<Omit<Creation, 'id' | 'createdAt' | 'title'> | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [modal, setModal] = useState({ isOpen: false, title: '', children: <></> });

    useEffect(() => {
        if (remixData) {
            setPrompt(remixData.prompt);
            const style = STYLES.find(s => s.name === remixData.style) || STYLES[0];
            setSelectedStyle(style);
            const device = DEVICES.find(d => d.name === (remixData as Creation).deviceType) || DEVICES[0];
            setSelectedDevice(device);
            setGeneratedDecal({
                url: remixData.url,
                prompt: remixData.prompt,
                style: remixData.style,
                deviceType: device.name,
            });
            clearRemixData();
        }
    }, [remixData, clearRemixData]);

    const handleGenerate = async (basePrompt: string) => {
        if (!basePrompt.trim()) {
            toast({ variant: "destructive", title: "Input Required", description: "Please enter a prompt." });
            return;
        }
        setIsLoading(true);
        setGeneratedDecal(null);
        try {
            const fullPrompt = `A decal design for a ${selectedDevice.name}. ${basePrompt}, in the style of ${selectedStyle.name}, high resolution, clean edges, sticker, vector art`;
            const result = await generateImage({ prompt: fullPrompt });
            const newDecal = { url: result.media, prompt: basePrompt, style: selectedStyle.name, deviceType: selectedDevice.name };
            setGeneratedDecal(newDecal);
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Generation Error", description: "Could not generate decal. Please try again." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnhancePrompt = async () => {
        if (!prompt.trim()) return;
        setIsEnhancing(true);
        try {
            const result = await enhancePrompt({ prompt, deviceType: selectedDevice.name, style: selectedStyle.name });
            setPrompt(result.enhancedPrompt);
            toast({ title: "Prompt Enhanced!", description: "Your prompt has been improved by AI." });
        } catch (error) {
            toast({ variant: "destructive", title: "Enhancement Failed", description: "The AI could not enhance the prompt." });
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleSaveCreation = async () => {
        if (!generatedDecal || !user) return;
        try {
            const result = await generateTitle({ prompt: generatedDecal.prompt });
            const title = result.title;
            addCreation({ ...generatedDecal, title });
            toast({ title: 'Success!', description: 'Your design has been saved to My Designs.' });
        } catch (error) {
            toast({ variant: "destructive", title: "Save Error", description: "Could not save your design." });
        }
    };

    const handleFinalize = () => {
      setModal({
        isOpen: true,
        title: "Finalizing Your Design ✨",
        children: (
          <div>
            <p className="mb-4">Our system would now prepare your masterpiece for printing and shipping!</p>
            <ul className="list-disc list-inside space-y-2 text-sm bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg">
              <li>Optimizing resolution for your {selectedDevice.name}...</li>
              <li>Calibrating colors for our premium vinyl...</li>
              <li>Perfectly scaling the design to your device's dimensions...</li>
            </ul>
            <p className="mt-4 font-semibold">Your unique SurfaceStory is ready for the real world!</p>
          </div>
        ),
      });
    };

    return (
        <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            <Modal isOpen={modal.isOpen} title={modal.title} onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}>
                {modal.children}
            </Modal>
            <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5 }} className="lg:col-span-1 flex flex-col space-y-6">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white font-headline">Design Studio</h2>
                
                <div className="space-y-2">
                    <label className="text-lg font-semibold text-gray-700 dark:text-gray-200 block">1. Choose your canvas</label>
                    <div className="grid grid-cols-3 gap-3">
                        {DEVICES.map(device => (
                            <motion.button key={device.name} onClick={() => setSelectedDevice(device)}
                                className={`flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 border-2 ${selectedDevice.name === device.name ? 'bg-primary text-primary-foreground border-primary' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border-transparent'}`}
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Icon name={device.icon as any} className="w-8 h-8 mb-1" />
                                <span className="text-sm font-medium">{device.name}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-lg font-semibold text-gray-700 dark:text-gray-200 block">2. Describe your vision</label>
                    <div className="relative">
                        <Textarea
                            className="w-full p-4 pr-12 rounded-lg bg-gray-50 dark:bg-gray-800/80 text-gray-800 dark:text-white border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 resize-none"
                            placeholder={`A decal for my ${selectedDevice.name}... e.g., 'a serene koi pond'`}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={4}
                            disabled={isLoading || isEnhancing}
                        />
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleEnhancePrompt} disabled={isLoading || isEnhancing || !prompt.trim()}
                            className="absolute top-3 right-3 p-2 rounded-full bg-purple-100 dark:bg-purple-900/50 text-primary dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900 disabled:opacity-50"
                            title="Enhance with AI ✨">
                            <Icon name="Sparkles" className={`w-5 h-5 ${isEnhancing ? 'animate-pulse' : ''}`} />
                        </motion.button>
                    </div>
                </div>
                
                <div className="space-y-2">
                    <label className="text-lg font-semibold text-gray-700 dark:text-gray-200 block">3. Choose an artistic style</label>
                    <div className="grid grid-cols-3 gap-3">
                        {STYLES.map(style => (
                            <motion.button key={style.name} onClick={() => setSelectedStyle(style)}
                                className={`relative rounded-lg border-2 transition-all duration-200 overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${selectedStyle.name === style.name ? 'border-primary' : 'border-transparent hover:border-primary/50'}`}
                                disabled={isLoading}
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Image src={style.image} alt={style.name} width={150} height={150} className="w-full h-auto" />
                                <div className={`absolute inset-0 flex items-center justify-center text-center p-1 text-xs font-semibold text-white transition-opacity duration-200 ${selectedStyle.name === style.name ? 'bg-primary/80' : 'bg-black/50 opacity-0 group-hover:opacity-100'}`}>
                                    {style.name}
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </div>

                <div className="mt-auto pt-4 space-y-3">
                    <motion.button onClick={() => handleGenerate(prompt)} disabled={isLoading || !prompt.trim()}
                        className="w-full py-3 px-6 rounded-xl font-semibold text-lg text-white transition-all duration-300 bg-gradient-to-r from-primary to-pink-600 hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
                        whileHover={{ y: -2 }} whileTap={{ y: 1 }}>
                        {isLoading ? 'Designing...' : 'Create My Decal'}
                    </motion.button>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={handleSaveCreation} disabled={isLoading || !generatedDecal} className="w-full">Save Design</Button>
                        <Button onClick={handleFinalize} disabled={isLoading || !generatedDecal} className="w-full bg-green-600 hover:bg-green-700">Add to Cart</Button>
                    </div>
                </div>
            </motion.div>

            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.7, delay: 0.2 }} className="lg:col-span-2 flex items-center justify-center">
                <Card className="w-full h-full bg-gray-100 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl p-2 md:p-6 flex items-center justify-center overflow-hidden">
                    <CardContent className="w-full h-full p-0">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full text-primary">
                                <Icon name="Wand2" className="w-16 h-16 animate-pulse" />
                                <p className="mt-4 font-semibold">AI is creating magic...</p>
                            </div>
                        ) : (
                            <Scene deviceName={selectedDevice.name} decalUrl={generatedDecal?.url || 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='} />
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
