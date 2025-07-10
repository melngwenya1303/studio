
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { useToast } from "@/hooks/use-toast";
import { enhancePrompt } from '@/ai/flows/enhance-prompt';
import { generateImage } from '@/ai/flows/generate-image';
import { generateTitle } from '@/ai/flows/generate-title';
import { getCreativeFeedback } from '@/ai/flows/get-creative-feedback';
import { generateStory } from '@/ai/flows/generate-story';
import { generateAudio } from '@/ai/flows/generate-audio';
import { DEVICES, STYLES } from '@/lib/constants';
import type { Device, Style, Creation, DeviceModel } from '@/lib/types';
import Icon from '@/components/shared/icon';
import Modal from '@/components/shared/modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function DesignStudioPage() {
    const { user, addCreation, remixData, clearRemixData } = useApp();
    const { toast } = useToast();

    const [prompt, setPrompt] = useState('');
    const [selectedDevice, setSelectedDevice] = useState<Device>(DEVICES[0]);
    const [selectedModel, setSelectedModel] = useState<DeviceModel | null>(DEVICES[0].models ? DEVICES[0].models[0] : null);
    const [selectedStyle, setSelectedStyle] = useState<Style>(STYLES[0]);
    const [generatedDecal, setGeneratedDecal] = useState<Omit<Creation, 'id' | 'createdAt' | 'title'> | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [isGettingFeedback, setIsGettingFeedback] = useState(false);
    const [isTellingStory, setIsTellingStory] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [policyAccepted, setPolicyAccepted] = useState(false);
    const [modal, setModal] = useState({ isOpen: false, title: '', children: <></> });
    
    // Accessibility States
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    const recognitionRef = useRef<any>(null);

    const handleDeviceSelection = (device: Device) => {
        setSelectedDevice(device);
        if (device.models && device.models.length > 0) {
            setSelectedModel(device.models[0]);
        } else {
            setSelectedModel(null);
        }
    };
    
    const currentCanvas = selectedModel || selectedDevice;

    useEffect(() => {
        if (remixData) {
            setPrompt(remixData.prompt);
            const style = STYLES.find(s => s.name === remixData.style) || STYLES[0];
            setSelectedStyle(style);
            const device = DEVICES.find(d => d.name === (remixData as Creation).deviceType) || DEVICES[0];
            handleDeviceSelection(device);
            // This part might need adjustment if remixData includes model info
            setGeneratedDecal({
                url: remixData.url,
                prompt: remixData.prompt,
                style: remixData.style,
                deviceType: device.name,
            });
            clearRemixData();
        }
    }, [remixData, clearRemixData]);

    // Speech-to-Text Effect
    useEffect(() => {
        if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            const recognition = recognitionRef.current;
            recognition.continuous = false;
            recognition.lang = 'en-US';
            recognition.interimResults = false;

            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setPrompt(prev => prev ? `${prev} ${transcript}` : transcript);
                setIsListening(false);
            };
            recognition.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                toast({ variant: "destructive", title: "Voice Error", description: "Could not recognize speech. Please try again." });
                setIsListening(false);
            };
            recognition.onend = () => {
                setIsListening(false);
            };
        }
    }, [toast]);

    const handleToggleListening = () => {
        if (!recognitionRef.current) {
            toast({ variant: "destructive", title: "Not Supported", description: "Voice recognition is not supported in your browser." });
            return;
        }
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    // Text-to-Speech Handler
    const handleTextToSpeech = async () => {
        if (!prompt.trim()) return;
        setIsSpeaking(true);
        try {
            const { media } = await generateAudio({ text: prompt });
            if (audioRef.current) {
                audioRef.current.src = media;
                audioRef.current.play();
                audioRef.current.onended = () => setIsSpeaking(false);
            }
        } catch (error) {
            console.error(error);
            toast({ variant: "destructive", title: "Audio Error", description: "Could not generate audio for the prompt." });
            setIsSpeaking(false);
        }
    };


    const handleGenerate = async (basePrompt: string) => {
        if (!basePrompt.trim()) {
            toast({ variant: "destructive", title: "Input Required", description: "Please enter a prompt." });
            return;
        }
        setIsLoading(true);
        setGeneratedDecal(null);
        try {
            const deviceName = selectedModel ? `${selectedDevice.name} (${selectedModel.name})` : selectedDevice.name;
            const fullPrompt = `A decal design for a ${deviceName}. ${basePrompt}, in the style of ${selectedStyle.name}, high resolution, clean edges, sticker, vector art`;
            const result = await generateImage({ prompt: fullPrompt });
            const newDecal = { url: result.media, prompt: basePrompt, style: selectedStyle.name, deviceType: deviceName };
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
            const deviceName = selectedModel ? `${selectedDevice.name} (${selectedModel.name})` : selectedDevice.name;
            const result = await enhancePrompt({ prompt, deviceType: deviceName, style: selectedStyle.name });
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
        setIsSaving(true);
        try {
            const result = await generateTitle({ prompt: generatedDecal.prompt });
            const title = result.title;
            addCreation({ ...generatedDecal, title });
            toast({ title: 'Success!', description: 'Your design has been saved to My Designs.' });
        } catch (error) {
            toast({ variant: "destructive", title: "Save Error", description: "Could not save your design." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleFinalize = () => {
      setModal({
        isOpen: true,
        title: "Finalizing Your Design ✨",
        children: (
          <div>
            <p className="mb-4">Our system is now preparing your masterpiece for printing and shipping!</p>
            <ul className="list-disc list-inside space-y-2 text-sm bg-gray-100 dark:bg-gray-700/50 p-4 rounded-lg">
              <li>Optimizing resolution for your {currentCanvas.name}...</li>
              <li>Calibrating colors for our premium vinyl...</li>
              <li>Perfectly scaling the design to your device's dimensions...</li>
            </ul>
            <p className="mt-4 font-semibold">Your unique SurfaceStory is ready for the real world!</p>
          </div>
        ),
      });
    };

    const handleGetFeedback = async () => {
        if (!generatedDecal) return;
        setIsGettingFeedback(true);
        try {
            const result = await getCreativeFeedback({ prompt: generatedDecal.prompt });
            setModal({
                isOpen: true,
                title: 'AI Prompt Editor',
                children: (
                    <div className="space-y-4">
                        <p>Our AI coach has some ideas to refine your prompt. Click one to try it out!</p>
                        <ul className="space-y-3">
                            {result.suggestions.map((p, i) => (
                                <li key={i} onClick={() => {
                                  setPrompt(p);
                                  handleGenerate(p);
                                  setModal(prev => ({...prev, isOpen: false}));
                                }} className="p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors">
                                    <p className="font-mono text-sm">"{p}"</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                ),
                size: 'lg'
            });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not get AI feedback at this time.' });
        } finally {
            setIsGettingFeedback(false);
        }
    }

    const handleTellStory = async () => {
        if (!generatedDecal) return;
        setIsTellingStory(true);
        try {
            const result = await generateStory({ prompt: generatedDecal.prompt });
            setModal({
                isOpen: true,
                title: 'A Creation\'s Story',
                children: <p className="leading-relaxed">{result.story}</p>,
                size: 'lg'
            });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not generate a story at this time.' });
        } finally {
            setIsTellingStory(false);
        }
    }

    return (
        <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            <Modal isOpen={modal.isOpen} title={modal.title} onClose={() => setModal(prev => ({ ...prev, isOpen: false }))} size={(modal as any).size}>
                {modal.children}
            </Modal>
            <audio ref={audioRef} className="hidden" />
            <motion.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5 }} className="lg:col-span-1 flex flex-col space-y-6">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white font-headline">Design Studio</h2>
                
                <div className="space-y-2">
                    <label className="text-lg font-semibold text-gray-700 dark:text-gray-200 block">1. Choose your canvas</label>
                    <div className="grid grid-cols-3 gap-3">
                        {DEVICES.map(device => (
                            <motion.button key={device.name} onClick={() => handleDeviceSelection(device)}
                                className={`flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-200 border-2 ${selectedDevice.name === device.name ? 'bg-primary text-primary-foreground border-primary' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border-transparent'}`}
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Icon name={device.icon as any} className="w-8 h-8 mb-1" />
                                <span className="text-sm font-medium">{device.name}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>

                {selectedDevice.models && selectedDevice.models.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.3 }} className="space-y-2 overflow-hidden">
                        <Label htmlFor="device-model" className="text-lg font-semibold text-gray-700 dark:text-gray-200 block">1a. Select a model</Label>
                        <Select
                            value={selectedModel?.name}
                            onValueChange={(value) => {
                                const model = selectedDevice.models?.find(m => m.name === value);
                                if (model) setSelectedModel(model);
                            }}
                        >
                            <SelectTrigger id="device-model" className="w-full">
                                <SelectValue placeholder="Select a model" />
                            </SelectTrigger>
                            <SelectContent>
                                {selectedDevice.models.map(model => (
                                    <SelectItem key={model.name} value={model.name}>
                                        {model.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </motion.div>
                )}

                <div className="space-y-2">
                    <label className="text-lg font-semibold text-gray-700 dark:text-gray-200 block">2. Describe your vision</label>
                    <div className="relative">
                        <Textarea
                            className="w-full p-4 pr-24 rounded-lg bg-gray-50 dark:bg-gray-800/80 text-gray-800 dark:text-white border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 resize-none"
                            placeholder={`A decal for my ${currentCanvas.name}... e.g., 'a serene koi pond'`}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={4}
                            disabled={isLoading || isEnhancing || isListening}
                        />
                        <div className="absolute top-3 right-3 flex items-center gap-1">
                             <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleToggleListening} disabled={isLoading || isEnhancing}
                                className={`p-2 rounded-full bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-300 hover:bg-cyan-200 dark:hover:bg-cyan-900 disabled:opacity-50 ${isListening ? 'animate-pulse ring-2 ring-cyan-400' : ''}`}
                                title="Speak Your Prompt">
                                <Icon name="Mic" className="w-5 h-5" />
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleTextToSpeech} disabled={isLoading || isEnhancing || !prompt.trim() || isSpeaking}
                                className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900 disabled:opacity-50"
                                title="Listen to Prompt">
                                <Icon name="Volume2" className={`w-5 h-5 ${isSpeaking ? 'animate-pulse' : ''}`} />
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleEnhancePrompt} disabled={isLoading || isEnhancing || !prompt.trim()}
                                className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/50 text-primary dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900 disabled:opacity-50"
                                title="Enhance with AI ✨">
                                <Icon name="Sparkles" className={`w-5 h-5 ${isEnhancing ? 'animate-pulse' : ''}`} />
                            </motion.button>
                        </div>
                    </div>
                </div>
                
                <div className="space-y-2">
                    <label className="text-lg font-semibold text-gray-700 dark:text-gray-200 block">3. Choose an artistic style</label>
                    <Carousel opts={{ align: "start", loop: true }} className="w-full">
                        <CarouselContent className="-ml-2">
                            {STYLES.map((style, index) => (
                                <CarouselItem key={index} className="pl-2 md:basis-1/2 lg:basis-1/2">
                                    <div className="p-1">
                                        <button 
                                            onClick={() => setSelectedStyle(style)} 
                                            className={`w-full rounded-lg transition-all duration-200 overflow-hidden group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${selectedStyle.name === style.name ? 'ring-2 ring-primary ring-offset-background ring-offset-2' : ''}`}
                                            disabled={isLoading}
                                        >
                                            <Card className="border-0">
                                                <CardContent className="p-0 aspect-video relative">
                                                    <Image src={style.image} alt={style.name} fill className="object-cover" {...{ 'data-ai-hint': style['data-ai-hint'] }} />
                                                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                                                </CardContent>
                                            </Card>
                                            <p className={`mt-2 text-sm font-semibold ${selectedStyle.name === style.name ? 'text-primary' : 'text-gray-600 dark:text-gray-300'}`}>{style.name}</p>
                                        </button>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious />
                        <CarouselNext />
                    </Carousel>
                </div>

                <div className="mt-auto pt-4 space-y-3">
                    <div className="flex items-center space-x-2 mb-3">
                        <Checkbox id="terms" onCheckedChange={(checked) => setPolicyAccepted(Boolean(checked))} />
                        <label
                            htmlFor="terms"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            I have read and agree to the{' '}
                            <Link href="/privacy-policy" className="underline text-primary" target="_blank">
                                Privacy Policy
                            </Link>
                        </label>
                    </div>

                    <motion.button onClick={() => handleGenerate(prompt)} disabled={isLoading || !prompt.trim() || !policyAccepted}
                        className="w-full py-3 px-6 rounded-xl font-semibold text-lg text-white transition-all duration-300 bg-gradient-to-r from-primary to-pink-600 hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
                        whileHover={{ y: -2 }} whileTap={{ y: 1 }}>
                        {isLoading ? 'Designing...' : 'Create My Decal'}
                    </motion.button>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={handleSaveCreation} disabled={isLoading || !generatedDecal || isSaving} className="w-full">
                            {isSaving ? <Icon name="Wand2" className="animate-pulse" /> : <Icon name="Heart" />}
                            {isSaving ? 'Saving...' : 'Save Design'}
                        </Button>
                        <Button onClick={handleFinalize} disabled={isLoading || !generatedDecal} className="w-full bg-green-600 hover:bg-green-700">Finalize Design</Button>
                    </div>
                    {generatedDecal && (
                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="outline" onClick={handleGetFeedback} disabled={isGettingFeedback} className="w-full border-primary/50 text-primary hover:bg-primary/10 hover:text-primary">
                                {isGettingFeedback ? <Icon name="Wand2" className="animate-pulse" /> : <Icon name="Sparkles" />}
                                Edit with AI ✨
                            </Button>
                             <Button variant="outline" onClick={handleTellStory} disabled={isTellingStory} className="w-full border-primary/50 text-primary hover:bg-primary/10 hover:text-primary">
                                {isTellingStory ? <Icon name="Wand2" className="animate-pulse" /> : <Icon name="BookOpen" />}
                                Tell a Story ✨
                            </Button>
                        </div>
                    )}
                </div>
            </motion.div>

            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.7, delay: 0.2 }} className="lg:col-span-2 flex items-center justify-center">
                <Card className="w-full h-full bg-gray-100 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl p-2 md:p-6 flex items-center justify-center overflow-hidden">
                    <CardContent className="w-full h-full p-0 relative">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full text-primary">
                                <Icon name="Wand2" className="w-16 h-16 animate-pulse" />
                                <p className="mt-4 font-semibold">AI is creating magic...</p>
                            </div>
                        ) : (
                            <div className="relative w-full h-full flex items-center justify-center">
                                <Image
                                    src={currentCanvas.previewImage}
                                    alt={`${currentCanvas.name} preview`}
                                    width={currentCanvas.previewWidth}
                                    height={currentCanvas.previewHeight}
                                    className="object-contain"
                                    data-ai-hint={currentCanvas['data-ai-hint']}
                                    key={currentCanvas.name}
                                />
                                {generatedDecal && (
                                    <motion.div
                                        className="absolute"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.5 }}
                                        style={currentCanvas.decal ? {
                                            transform: currentCanvas.decal.transform,
                                            transformOrigin: currentCanvas.decal.transformOrigin,
                                            width: currentCanvas.decal.width,
                                            height: currentCanvas.decal.height,
                                        } : {}}
                                    >
                                        <Image
                                            src={generatedDecal.url}
                                            alt="Generated Decal"
                                            fill
                                            className="object-cover"
                                        />
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
