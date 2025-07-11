
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { useToast } from "@/hooks/use-toast";
import { enhancePrompt } from '@/ai/flows/enhance-prompt';
import { generateUiSpec } from '@/ai/flows/generate-ui-spec';
import { getCreativeFeedback } from '@/ai/flows/get-creative-feedback';
import { getRemixSuggestions } from '@/ai/flows/get-remix-suggestions';
import { generateAudio } from '@/ai/flows/generate-audio';
import { DEVICES, STYLES } from '@/lib/constants';
import type { Device, Style, Creation, DeviceModel } from '@/lib/types';
import Icon from '@/components/shared/icon';
import Modal from '@/components/shared/modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

type AiCreateViewProps = {
    onBack: () => void;
};

export default function AiCreateView({ onBack }: AiCreateViewProps) {
    const { user, addCreation, remixData, clearRemixData, addToCart } = useApp();
    const { toast } = useToast();
    const router = useRouter();

    const [prompt, setPrompt] = useState('');
    const [selectedDevice, setSelectedDevice] = useState<Device>(DEVICES[0]);
    const [selectedModel, setSelectedModel] = useState<DeviceModel | null>(DEVICES[0].models ? DEVICES[0].models[0] : null);
    const [selectedStyle, setSelectedStyle] = useState<Style>(STYLES[0]);
    const [generatedDecal, setGeneratedDecal] = useState<Omit<Creation, 'id' | 'createdAt'> | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [isGettingFeedback, setIsGettingFeedback] = useState(false);
    const [remixSuggestions, setRemixSuggestions] = useState<string[]>([]);
    const [isGettingRemix, setIsGettingRemix] = useState(false);
    const [story, setStory] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [policyAccepted, setPolicyAccepted] = useState(false);
    const [modal, setModal] = useState({ isOpen: false, title: '', children: <></>, size: 'md' as 'md' | 'lg' | 'xl' });
    const [previewMode, setPreviewMode] = useState<'2D' | '3D'>('2D');
    const [mockupColor, setMockupColor] = useState('bg-gray-200');
    
    // AR State
    const [isPreviewingAr, setIsPreviewingAr] = useState(false);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

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
            if (remixData.prompt) {
                setPrompt(remixData.prompt);
                // When a prompt is passed from enhancer, clear the existing image if it's not a full remix
                if (!remixData.url) {
                    setGeneratedDecal(null);
                }
            } 
            
            if (remixData.url) { 
                 setGeneratedDecal({
                    url: remixData.url,
                    prompt: remixData.prompt || '',
                    title: remixData.title || '',
                    style: remixData.style || STYLES[0].name,
                    deviceType: ('deviceType' in remixData && remixData.deviceType) ? remixData.deviceType : DEVICES[0].name,
                });
            }

            if (remixData.style) {
                const style = STYLES.find(s => s.name === remixData.style) || STYLES[0];
                setSelectedStyle(style);
            }
            
            if ('deviceType' in remixData && remixData.deviceType) {
                const device = DEVICES.find(d => remixData.deviceType!.includes(d.name)) || DEVICES[0];
                handleDeviceSelection(device);
            }
            
            clearRemixData();
        }
    }, [remixData, clearRemixData]);

    useEffect(() => {
        // @ts-ignore
        if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
            // @ts-ignore
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
    
     useEffect(() => {
        if (isPreviewingAr) {
            const getCameraPermission = async () => {
              try {
                const stream = await navigator.mediaDevices.getUserMedia({video: true});
                setHasCameraPermission(true);

                if (videoRef.current) {
                  videoRef.current.srcObject = stream;
                }
              } catch (error) {
                console.error('Error accessing camera:', error);
                setHasCameraPermission(false);
                toast({
                  variant: 'destructive',
                  title: 'Camera Access Denied',
                  description: 'Please enable camera permissions in your browser settings to use this app.',
                });
              }
            };
            getCameraPermission();
        } else {
             if (videoRef.current && videoRef.current.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
                videoRef.current.srcObject = null;
            }
        }
    }, [isPreviewingAr, toast]);

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
        } catch (error: any) {
            toast({ variant: "destructive", title: "Audio Error", description: error.message });
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
        setStory(null);
        setRemixSuggestions([]);
        try {
            const deviceName = selectedModel ? `${selectedDevice.name} (${selectedModel.name})` : selectedDevice.name;
            const fullPrompt = `A decal design for a ${deviceName}. ${basePrompt}, in the style of ${selectedStyle.name}, high resolution, clean edges, sticker, vector art`;
            
            const result = await generateUiSpec({ prompt: fullPrompt });
            
            const newDecal = { 
                url: result.imageUrl, 
                prompt: basePrompt, 
                style: selectedStyle.name, 
                deviceType: deviceName,
                title: result.title 
            };
            setGeneratedDecal(newDecal);
            setStory(result.story);
        } catch (error: any) {
            toast({ variant: "destructive", title: "Generation Error", description: error.message });
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
        } catch (error: any) {
            toast({ variant: "destructive", title: "Enhancement Failed", description: error.message });
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleSaveCreation = () => {
        if (!generatedDecal || !user) return;
        setIsSaving(true);
        try {
            const savedCreation = addCreation(generatedDecal);
            toast({ title: 'Success!', description: `'${savedCreation.title}' has been saved to My Designs.` });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Save Error", description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handlePurchase = () => {
      if (!generatedDecal) return;
      addToCart(generatedDecal);
      router.push('/checkout');
    };

    const handleGetFeedback = async () => {
        if (!generatedDecal) return;
        setIsGettingFeedback(true);
        try {
            const result = await getCreativeFeedback({ prompt: generatedDecal.prompt });
            setModal({
                isOpen: true,
                title: 'AI Prompt Editor',
                size: 'lg',
                children: (
                    <div className="space-y-4">
                        <p>Our AI coach has some ideas to refine your prompt. Click one to try it out!</p>
                        <ul className="space-y-3">
                            {result.suggestions.map((p, i) => (
                                <li key={i} onClick={() => {
                                  setPrompt(p);
                                  handleGenerate(p);
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
            toast({ variant: 'destructive', title: 'Feedback Error', description: error.message });
        } finally {
            setIsGettingFeedback(false);
        }
    }
    
    const handleGetRemixSuggestions = async () => {
        if (!prompt.trim()) return;
        setIsGettingRemix(true);
        setRemixSuggestions([]);
        try {
            const result = await getRemixSuggestions({ prompt });
            setRemixSuggestions(result.suggestions);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Could not get suggestions', description: error.message });
        } finally {
            setIsGettingRemix(false);
        }
    };

    const handleTellStory = async () => {
        if (!story) return;
        setModal({
            isOpen: true,
            title: 'A Creation\'s Story',
            size: 'lg',
            children: <p className="leading-relaxed">{story}</p>
        });
    }
    
    const handleStartOver = () => {
        setPrompt('');
        setSelectedDevice(DEVICES[0]);
        setSelectedModel(DEVICES[0].models ? DEVICES[0].models[0] : null);
        setSelectedStyle(STYLES[0]);
        setGeneratedDecal(null);
        setStory(null);
        setIsLoading(false);
        setPolicyAccepted(false);
        setRemixSuggestions([]);
        toast({ title: 'Canvas Cleared', description: 'Ready for your next great idea!' });
    };

    return (
        <TooltipProvider>
            <div className="flex h-full w-full">
                <Modal isOpen={modal.isOpen} title={modal.title} onClose={() => setModal(prev => ({ ...prev, isOpen: false }))} size={modal.size}>
                    {modal.children}
                </Modal>
                <audio ref={audioRef} className="hidden" />

                {/* Left Column: Palette / Controls */}
                <motion.div 
                    initial={{ x: -50, opacity: 0 }} 
                    animate={{ x: 0, opacity: 1 }} 
                    transition={{ duration: 0.5 }} 
                    className="w-[400px] flex-shrink-0"
                >
                     <Card className="shadow-lg flex flex-col h-full m-4 rounded-2xl">
                        <CardHeader className="flex-row items-center justify-between">
                            <CardTitle>Creator's Palette</CardTitle>
                            <Button variant="ghost" onClick={onBack}><Icon name="Undo2" className="mr-2" /> Back</Button>
                        </CardHeader>
                        <CardContent className="flex flex-col flex-grow">
                             <Tabs defaultValue="design" className="w-full flex flex-col flex-grow">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="design">Design</TabsTrigger>
                                    <TabsTrigger value="layers">Layers</TabsTrigger>
                                    <TabsTrigger value="mockups">Mockups</TabsTrigger>
                                </TabsList>
                                <TabsContent value="design" className="flex-grow flex flex-col">
                                    <div className="space-y-6 py-6 flex-grow">
                                        {/* Step 1: Canvas */}
                                        <div className="space-y-4">
                                            <h3 className="text-h3 font-headline">1. Select Product</h3>
                                            <div className="space-y-2">
                                                <Label htmlFor="device-type">Product Type</Label>
                                                <Select
                                                    value={selectedDevice.name}
                                                    onValueChange={(value) => {
                                                        const device = DEVICES.find(d => d.name === value);
                                                        if (device) handleDeviceSelection(device);
                                                    }}
                                                >
                                                    <SelectTrigger id="device-type" className="w-full">
                                                        <SelectValue placeholder="Select a device" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {DEVICES.map(device => (
                                                            <SelectItem key={device.name} value={device.name}>
                                                                <div className="flex items-center gap-2">
                                                                    <Icon name={device.icon as any} className="w-4 h-4" />
                                                                    {device.name}
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {selectedDevice.models && selectedDevice.models.length > 0 && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.3 }} className="space-y-2 overflow-hidden">
                                                    <Label htmlFor="device-model">Model</Label>
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
                                        </div>

                                        <Separator />

                                        {/* Step 2: Vision */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-h3 font-headline">2. Describe Your Vision</h3>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button className="text-muted-foreground hover:text-foreground">
                                                          <Icon name="Info" className="w-4 h-4" />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent align="end" className="max-w-xs">
                                                        <p className="font-bold mb-2">Prompting Tips:</p>
                                                        <ul className="list-disc list-inside text-xs space-y-1">
                                                          <li>Be descriptive! Mention the subject, colors, mood, and style.</li>
                                                          <li>Example: "A majestic stag with crystal antlers in a dark, enchanted forest, photorealistic."</li>
                                                          <li>Use the ✨ button to let our AI enhance your idea.</li>
                                                        </ul>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </div>
                                             <div className="space-y-2">
                                                <Label htmlFor="prompt-input">Prompt</Label>
                                                <div className="relative">
                                                    <Textarea
                                                        id="prompt-input"
                                                        className="w-full p-4 pr-4 pb-12 rounded-lg bg-muted text-base border-border focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 resize-none"
                                                        placeholder={`A decal for my ${currentCanvas.name}...`}
                                                        value={prompt}
                                                        onChange={(e) => setPrompt(e.target.value)}
                                                        rows={4}
                                                        disabled={isLoading || isEnhancing || isListening}
                                                    />
                                                    <div className="absolute bottom-2 right-2 flex items-center gap-1">
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button asChild variant="ghost" size="icon" disabled={isLoading || isEnhancing} className={`text-cyan-600 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 ${isListening ? 'animate-pulse ring-2 ring-cyan-400' : ''}`}>
                                                                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleToggleListening}>
                                                                        <Icon name="Mic" className="w-5 h-5" />
                                                                    </motion.div>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                              <p>Speak Your Prompt</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button asChild variant="ghost" size="icon" disabled={isLoading || isEnhancing || !prompt.trim() || isSpeaking} className="text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50">
                                                                     <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleTextToSpeech}>
                                                                        <Icon name="Volume2" className={`w-5 h-5 ${isSpeaking ? 'animate-pulse' : ''}`} />
                                                                    </motion.div>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                              <p>Listen to Prompt</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button asChild variant="ghost" size="icon" disabled={isLoading || isEnhancing || !prompt.trim()} className="text-primary dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50">
                                                                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleEnhancePrompt}>
                                                                        <Icon name="Sparkles" className={`w-5 h-5 ${isEnhancing ? 'animate-pulse' : ''}`} />
                                                                    </motion.div>
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                              <p>Enhance with AI ✨</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* AI Coach */}
                                        <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                                            <div className="flex items-center justify-between">
                                              <h4 className="font-semibold text-sm flex items-center gap-2"><Icon name="Bot" className="text-primary" /> AI Coach</h4>
                                              <Button variant="outline" size="sm" onClick={handleGetRemixSuggestions} disabled={!prompt.trim() || isGettingRemix}>
                                                  {isGettingRemix ? 'Getting ideas...' : 'Get Remix Ideas'}
                                              </Button>
                                            </div>
                                            {remixSuggestions.length > 0 && (
                                                <motion.div 
                                                    initial={{opacity: 0, y: -10}} animate={{opacity: 1, y: 0}}
                                                    className="text-sm text-muted-foreground space-y-2"
                                                >
                                                    <p className="text-xs">Try one of these creative directions:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {remixSuggestions.map((suggestion, i) => (
                                                            <motion.button 
                                                                key={i}
                                                                className="px-3 py-1 bg-background rounded-full text-xs hover:bg-primary/10 border"
                                                                onClick={() => {
                                                                    setPrompt(suggestion);
                                                                    handleGenerate(suggestion);
                                                                    setRemixSuggestions([]);
                                                                }}
                                                                whileHover={{scale: 1.05}} whileTap={{scale: 0.95}}
                                                            >
                                                                "{suggestion}"
                                                            </motion.button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>

                                        <Separator />

                                        {/* Step 3: Style */}
                                        <div className="space-y-4">
                                            <h3 className="text-h3 font-headline">3. Choose Style</h3>
                                            <div className="space-y-2">
                                                <Label>Selected Style: {selectedStyle.name}</Label>
                                                <Carousel opts={{ align: "start", loop: true }} className="w-full">
                                                    <CarouselContent className="-ml-2">
                                                        {STYLES.map((style, index) => (
                                                            <CarouselItem key={index} className="pl-2 basis-1/2 md:basis-1/3">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <div className="p-1">
                                                                            <motion.button 
                                                                                onClick={() => setSelectedStyle(style)}
                                                                                className={`w-full rounded-lg transition-all duration-200 overflow-hidden group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${selectedStyle.name === style.name ? 'ring-2 ring-primary ring-offset-background ring-offset-2' : ''}`}
                                                                                disabled={isLoading}
                                                                                whileHover={{ scale: 1.05 }}
                                                                                whileTap={{ scale: 0.98 }}
                                                                            >
                                                                                <div className="border-0 aspect-video relative">
                                                                                    <Image src={style.image} alt={style.name} fill className="object-cover rounded-md" {...{ 'data-ai-hint': style['data-ai-hint'] }} />
                                                                                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors rounded-md" />
                                                                                </div>
                                                                            </motion.button>
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                      <p>{style.name}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </CarouselItem>
                                                        ))}
                                                    </CarouselContent>
                                                    <CarouselPrevious className="hidden sm:flex" />
                                                    <CarouselNext className="hidden sm:flex"/>
                                                </Carousel>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-auto pt-4 space-y-3">
                                        <div className="flex items-center space-x-2 mb-3">
                                            <Checkbox id="terms" checked={policyAccepted} onCheckedChange={(checked) => setPolicyAccepted(Boolean(checked))} />
                                            <label
                                                htmlFor="terms"
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                I agree to the{' '}
                                                <Link href="/privacy-policy" className="underline text-primary" target="_blank">
                                                    Content Policy
                                                </Link>
                                            </label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button asChild disabled={isLoading || !prompt.trim() || !policyAccepted}
                                                className="flex-grow text-lg text-white transition-all duration-300 bg-gradient-to-r from-primary to-accent hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:shadow-none">
                                                <motion.button onClick={() => handleGenerate(prompt)} whileHover={{ y: -2 }} whileTap={{ y: 1 }}>
                                                    {isLoading ? 'Designing...' : 'Create My Design'}
                                                </motion.button>
                                            </Button>
                                             <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button asChild variant="ghost" size="icon" onClick={handleStartOver} disabled={isLoading}>
                                                        <motion.div whileHover={{ scale: 1.1, rotate: -30 }} whileTap={{ scale: 0.9 }}>
                                                          <Icon name="Undo2" />
                                                        </motion.div>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent><p>Start Over</p></TooltipContent>
                                            </Tooltip>
                                        </div>
                                        
                                        {generatedDecal && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="space-y-3 pt-4 border-t"
                                            >
                                                <div className="flex gap-3">
                                                    <Button variant="outline" onClick={handleSaveCreation} disabled={isLoading || isSaving} className="w-full">
                                                        {isSaving ? <Icon name="Wand2" className="animate-pulse" /> : <Icon name="Heart" />}
                                                        {isSaving ? 'Saving...' : 'Save Design'}
                                                    </Button>
                                                    <Button onClick={handlePurchase} className="w-full bg-green-600 hover:bg-green-700">
                                                        <Icon name="ShoppingCart" /> Purchase
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <Button variant="outline" onClick={handleGetFeedback} disabled={isGettingFeedback} className="w-full border-primary/50 text-primary hover:bg-primary/10 hover:text-primary">
                                                        {isGettingFeedback ? <Icon name="Wand2" className="animate-pulse" /> : <Icon name="Sparkles" />}
                                                        Edit with AI ✨
                                                    </Button>
                                                    <Button variant="outline" onClick={handleTellStory} disabled={!story} className="w-full border-primary/50 text-primary hover:bg-primary/10 hover:text-primary">
                                                        <Icon name="BookOpen" />
                                                        View Story
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </TabsContent>
                                <TabsContent value="layers">
                                    <div className="py-6 space-y-4">
                                        <p className="text-muted-foreground">Manage the components of your design.</p>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <Icon name="ImageIcon" />
                                                    <span className="font-medium">Decal Image</span>
                                                </div>
                                                <Badge variant={generatedDecal ? 'secondary' : 'outline'}>{generatedDecal ? 'Visible' : 'Empty'}</Badge>
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                                 <div className="flex items-center gap-3">
                                                    <Icon name={selectedDevice.icon as any} />
                                                    <span className="font-medium">Product Base</span>
                                                </div>
                                                <Badge variant="secondary">Visible</Badge>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="mockups">
                                    <div className="py-6 space-y-4">
                                        <h3 className="text-h3 font-headline">Change Background</h3>
                                        <p className="text-muted-foreground">Change the product color to see how your design looks.</p>
                                        <div className="flex flex-wrap gap-3">
                                            {[
                                              { name: 'Light', color: 'bg-gray-200' },
                                              { name: 'Dark', color: 'bg-gray-800' },
                                              { name: 'Blue', color: 'bg-blue-500' },
                                              { name: 'Red', color: 'bg-red-500' },
                                              { name: 'Green', color: 'bg-green-500' },
                                            ].map(c => (
                                                <Button key={c.name} variant="outline" className="flex items-center gap-2" onClick={() => setMockupColor(c.color)}>
                                                    <div className={cn("w-4 h-4 rounded-full border", c.color)} />
                                                    {c.name}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </motion.div>


                {/* Right Column: Canvas/Preview */}
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    transition={{ duration: 0.7, delay: 0.2 }} 
                    className="flex-1 flex flex-col p-4"
                >
                    <div className={cn(
                        "flex-1 flex flex-col items-center justify-center rounded-2xl min-h-0 p-4 transition-colors relative",
                        isPreviewingAr ? 'bg-transparent' : 'bg-card' 
                    )}>
                       <AnimatePresence mode="wait">
                            <motion.div
                                key={previewMode}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                                className="w-full h-full flex flex-col items-center justify-center"
                            >
                                {isPreviewingAr && (
                                    <div className="w-full h-full relative">
                                        <video ref={videoRef} className="w-full h-full object-cover rounded-md" autoPlay muted playsInline />
                                        {hasCameraPermission === false && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                                <Alert variant="destructive" className="max-w-sm">
                                                  <AlertTitle>Camera Access Required</AlertTitle>
                                                  <AlertDescription>
                                                    Please allow camera access in your browser settings to use the AR feature.
                                                  </AlertDescription>
                                                </Alert>
                                            </div>
                                        )}
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-white p-4 bg-black/30 rounded-lg">
                                            <p>Look at a flat surface to place your design.</p>
                                            <p className="text-xs">(AR object rendering coming soon)</p>
                                        </div>
                                    </div>
                                )}

                                {!isPreviewingAr && previewMode === '2D' && (
                                    <div className="relative w-full h-full">
                                        <motion.div 
                                            className={cn("w-full h-full rounded-2xl transition-colors", mockupColor)}
                                            animate={{ y: [0, -8, 0] }}
                                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                        >
                                            <Image
                                                src={currentCanvas.previewImage}
                                                alt={`${currentCanvas.name} preview`}
                                                fill
                                                className="object-contain"
                                                data-ai-hint={currentCanvas['data-ai-hint']}
                                                key={currentCanvas.previewImage}
                                                priority
                                            />
                                        </motion.div>
                                        <AnimatePresence>
                                            {generatedDecal && (
                                                <motion.div
                                                    className="absolute"
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{opacity: 0}}
                                                    transition={{ duration: 0.5, delay: 0.2 }}
                                                    style={{
                                                      top: currentCanvas.decal?.top ?? '0%',
                                                      left: currentCanvas.decal?.left ?? '0%',
                                                      width: currentCanvas.decal?.width ?? '100%',
                                                      height: currentCanvas.decal?.height ?? '100%',
                                                      transform: currentCanvas.decal?.transform,
                                                      transformOrigin: currentCanvas.decal?.transformOrigin,
                                                    }}
                                                >
                                                    <Image
                                                        src={generatedDecal.url}
                                                        alt="Generated Decal"
                                                        fill
                                                        className="object-contain"
                                                    />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}

                                {!isPreviewingAr && previewMode === '3D' && (
                                    <div className="text-center text-muted-foreground flex flex-col items-center justify-center gap-4">
                                        <motion.div
                                            animate={{
                                                y: [0, -10, 0],
                                                rotate: [0, 5, -5, 0],
                                            }}
                                            transition={{
                                                duration: 4,
                                                repeat: Infinity,
                                                ease: 'easeInOut',
                                            }}
                                        >
                                            <Icon name="Box" className="w-24 h-24 text-primary/30" />
                                        </motion.div>
                                        <h3 className="text-lg font-semibold">Interactive 3D Preview</h3>
                                        <p className="max-w-xs">This feature is coming soon! You'll be able to rotate, pan, and zoom to see your design from every angle.</p>
                                    </div>
                                )}
                                
                                {isLoading && !isPreviewingAr && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                                        <motion.div
                                            animate={{ rotate: [0, 360], scale: [1, 1.1, 1]}}
                                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                        >
                                            <Icon name="Wand2" className="w-16 h-16 text-primary" />
                                        </motion.div>
                                        <p className="mt-4 font-semibold text-lg">AI is creating magic...</p>
                                        <p className="text-sm text-muted-foreground">This can take up to 30 seconds.</p>
                                    </div>
                                )}

                            </motion.div>
                        </AnimatePresence>

                        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                             <AnimatePresence>
                                {!isPreviewingAr && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <ToggleGroup type="single" value={previewMode} onValueChange={(value: '2D' | '3D') => value && setPreviewMode(value)} className="bg-background/50 rounded-lg p-1">
                                            <ToggleGroupItem value="2D" aria-label="2D Preview">
                                               <Icon name="ImageIcon" className="w-4 h-4 mr-2" /> 2D
                                            </ToggleGroupItem>
                                            <ToggleGroupItem value="3D" aria-label="3D Preview">
                                               <Icon name="Box" className="w-4 h-4 mr-2" /> 3D
                                            </ToggleGroupItem>
                                        </ToggleGroup>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            
                            <Button variant="outline" onClick={() => setIsPreviewingAr(!isPreviewingAr)}>
                                {isPreviewingAr ? <><Icon name="Undo2" className="w-4 h-4 mr-2" /> Back to Editor</> : <><Icon name="Camera" className="w-4 h-4 mr-2" /> View in AR</>}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </TooltipProvider>
    );
}
