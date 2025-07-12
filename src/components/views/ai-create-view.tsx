
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { useToast } from "@/hooks/use-toast";
import { generateUiSpec, GenerateUiSpecInput } from '@/ai/flows/generate-ui-spec';
import { generateImage } from '@/ai/flows/generate-image';
import { getCreativeFeedback } from '@/ai/flows/get-creative-feedback';
import { getRemixSuggestions } from '@/ai/flows/get-remix-suggestions';
import { generateAudio } from '@/ai/flows/generate-audio';
import { generateCreativePrompt } from '@/ai/flows/generate-creative-prompt';
import { DEVICES, STYLES } from '@/lib/constants';
import type { Device, Style, Creation, DeviceModel } from '@/lib/types';
import Icon from '@/components/shared/icon';
import Modal from '@/components/shared/modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { Input } from '../ui/input';
import { Switch } from '../ui/switch';

type AiCreateViewProps = {
    onBack: () => void;
};

type StructuredPrompt = {
    subject: string;
    setting: string;
    negativePrompt: string;
}

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
    const [story, setStory] = useState<{ text: string; audio?: string } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [policyAccepted, setPolicyAccepted] = useState(false);
    const [modal, setModal] = useState({ isOpen: false, title: '', children: <></>, size: 'md' as 'md' | 'lg' | 'xl' });
    const [previewMode, setPreviewMode] = useState<'2D' | '3D' | 'mockup'>('2D');
    const [mockupColor, setMockupColor] = useState('bg-gray-200');
    const [mockupPrompt, setMockupPrompt] = useState('');
    const [isGeneratingMockup, setIsGeneratingMockup] = useState(false);
    const [generatedMockup, setGeneratedMockup] = useState<string | null>(null);
    const [isGettingCreativePrompt, setIsGettingCreativePrompt] = useState(false);
    
    // AR State
    const [isPreviewingAr, setIsPreviewingAr] = useState<boolean>(false);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Accessibility States
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    const recognitionRef = useRef<any>(null);

    // Advanced Prompting State
    const [isAdvancedPrompt, setIsAdvancedPrompt] = useState(false);
    const [structuredPrompt, setStructuredPrompt] = useState<StructuredPrompt>({
        subject: '',
        setting: '',
        negativePrompt: ''
    });
    const [seed, setSeed] = useState<number | null>(null);
    const [isSeedLocked, setIsSeedLocked] = useState(false);

    const handleDeviceSelection = useCallback((device: Device) => {
        setSelectedDevice(device);
        if (device.models && device.models.length > 0) {
            setSelectedModel(device.models[0]);
        } else {
            setSelectedModel(null);
        }
    }, []);
    
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
    }, [remixData, clearRemixData, handleDeviceSelection]);

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
        if (!prompt.trim() || isSpeaking) return;
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
    
    const handleCreativePrompt = async () => {
        setIsGettingCreativePrompt(true);
        try {
            const result = await generateCreativePrompt();
            setPrompt(result.prompt);
            setStructuredPrompt({subject: result.prompt, setting: '', negativePrompt: ''});
        } catch (error: any) {
            toast({ variant: "destructive", title: "Could not get prompt", description: error.message });
        } finally {
            setIsGettingCreativePrompt(false);
        }
    };

    const handleGenerate = useCallback(async (newPrompt?: string) => {
        const finalPrompt = newPrompt || prompt;
        const hasSimplePrompt = finalPrompt.trim() !== '';
        const hasAdvancedPrompt = structuredPrompt.subject.trim() !== '';
        if (!hasSimplePrompt && !hasAdvancedPrompt) {
            toast({ variant: "destructive", title: "Input Required", description: "Please enter a prompt." });
            return;
        }

        setIsLoading(true);
        setGeneratedDecal(null);
        setGeneratedMockup(null);
        setStory(null);
        setRemixSuggestions([]);
        
        try {
            const deviceName = selectedModel ? `${selectedDevice.name} (${selectedModel.name})` : selectedDevice.name;

            let generationInput: GenerateUiSpecInput;

            if (isAdvancedPrompt) {
                generationInput = {
                    prompt: structuredPrompt.subject,
                    setting: structuredPrompt.setting,
                    negativePrompt: structuredPrompt.negativePrompt,
                    style: selectedStyle.name,
                    deviceType: deviceName,
                    seed: isSeedLocked ? seed || undefined : undefined,
                };
            } else {
                 const fullPromptWithStyle = `A decal design for a ${deviceName}. ${finalPrompt}, in the style of ${selectedStyle.name}, high resolution, clean edges, sticker, vector art`;
                 generationInput = { 
                     prompt: fullPromptWithStyle,
                     seed: isSeedLocked ? seed || undefined : undefined,
                 };
            }
            
            const result = await generateUiSpec(generationInput);
            
            if (result.seed) {
                setSeed(result.seed);
            }

            if (result.blocked) {
                toast({ variant: "destructive", title: "Prompt Blocked", description: result.blockedReason, duration: 5000 });
                setIsLoading(false);
                return;
            }
            
            const newDecal = { 
                url: result.imageUrl, 
                prompt: isAdvancedPrompt ? `${structuredPrompt.subject}, ${structuredPrompt.setting}` : finalPrompt,
                style: selectedStyle.name, 
                deviceType: deviceName,
                title: result.title 
            };
            setGeneratedDecal(newDecal);
            setStory({ text: result.story });

        } catch (error: any) {
            toast({ variant: "destructive", title: "Generation Error", description: error.message, duration: 5000 });
        } finally {
            setIsLoading(false);
        }
    }, [prompt, structuredPrompt, isAdvancedPrompt, selectedModel, selectedDevice, selectedStyle.name, toast, isSeedLocked, seed]);
    
     const handleGenerateMockup = useCallback(async () => {
        if (!generatedDecal?.url || !mockupPrompt.trim()) {
            toast({ variant: 'destructive', title: 'Input Required', description: 'Please describe a scene for the mockup.' });
            return;
        }
        setIsGeneratingMockup(true);
        setGeneratedMockup(null); // Clear previous mockup
        try {
            const result = await generateImage({
                prompt: mockupPrompt,
                baseImageUrl: generatedDecal.url,
            });

            if (result.blocked || !result.media) {
                toast({
                    variant: 'destructive',
                    title: 'Mockup Generation Failed',
                    description: result.reason || 'An unexpected error occurred.',
                });
                setIsGeneratingMockup(false);
            } else {
                // In a real async flow, we'd get a job ID. Here we simulate completion.
                setGeneratedMockup(result.media);
                setIsGeneratingMockup(false);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Mockup Generation Error', description: error.message });
            setIsGeneratingMockup(false);
        }
    }, [generatedDecal, mockupPrompt, toast]);


    const handleEnhancePrompt = useCallback(async () => {
        if (!prompt.trim()) return;
        setIsEnhancing(true);
        try {
            const deviceName = selectedModel ? `${selectedDevice.name} (${selectedModel.name})` : selectedDevice.name;
            const enhancedPromptText = `A decal design for a ${deviceName}. ${prompt}, in the style of ${selectedStyle.name}, high resolution, clean edges, sticker, vector art`;
            setPrompt(enhancedPromptText);
            toast({ title: "Prompt Enhanced!", description: "Your prompt has been improved by AI." });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Enhancement Failed", description: "Could not enhance prompt." });
        } finally {
            setIsEnhancing(false);
        }
    }, [prompt, selectedDevice, selectedModel, selectedStyle.name, toast]);

    const handleSaveCreation = useCallback(async () => {
        if (!generatedDecal) return;
        if (!user) {
            toast({ variant: "destructive", title: "Login Required", description: "Please sign in to save your creations." });
            router.push('/login');
            return;
        }
        setIsSaving(true);
        try {
            const savedCreation = await addCreation(generatedDecal);
            toast({ title: 'Success!', description: `'${savedCreation.title}' has been saved to My Designs.` });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Save Error", description: error.message });
        } finally {
            setIsSaving(false);
        }
    }, [generatedDecal, user, addCreation, toast, router]);

    const handleAddToCart = useCallback(() => {
      if (!generatedDecal) return;
      addToCart(generatedDecal);
      router.push('/checkout');
    }, [generatedDecal, addToCart, router]);

    const handleGetFeedback = useCallback(async () => {
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
    }, [generatedDecal, handleGenerate, toast]);
    
    const handleGetRemixSuggestions = useCallback(async () => {
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
    }, [prompt, toast]);

    const handleTellStory = async () => {
        if (!story || isSpeaking) return;
        
        // If we already have audio, play it.
        if (story.audio && audioRef.current) {
            setIsSpeaking(true);
            audioRef.current.src = story.audio;
            audioRef.current.play();
            audioRef.current.onended = () => setIsSpeaking(false);
            return;
        }

        // Otherwise, generate it.
        setIsSpeaking(true);
        try {
            const { media } = await generateAudio({ text: story.text });
            setStory(prev => prev ? { ...prev, audio: media } : null); // Cache the audio
            if (audioRef.current) {
                audioRef.current.src = media;
                audioRef.current.play();
                audioRef.current.onended = () => setIsSpeaking(false);
            }
        } catch (error: any) {
            toast({ variant: "destructive", title: "Audio Generation Error", description: error.message });
            setIsSpeaking(false);
        }
    };
    
    const handleStartOver = useCallback(() => {
        setPrompt('');
        setStructuredPrompt({subject: '', setting: '', negativePrompt: ''});
        setSelectedDevice(DEVICES[0]);
        setSelectedModel(DEVICES[0].models ? DEVICES[0].models[0] : null);
        setSelectedStyle(STYLES[0]);
        setGeneratedDecal(null);
        setGeneratedMockup(null);
        setStory(null);
        setIsLoading(false);
        setPolicyAccepted(false);
        setRemixSuggestions([]);
        setSeed(null);
        setIsSeedLocked(false);
        toast({ title: 'Canvas Cleared', description: 'Ready for your next great idea!' });
    }, [toast]);

    const handleMockupInspire = async () => {
        setIsGettingCreativePrompt(true);
        try {
            const result = await generateCreativePrompt();
            setMockupPrompt(result.prompt);
        } catch(e: any) {
            toast({ variant: "destructive", title: "Could not get idea", description: e.message });
        } finally {
            setIsGettingCreativePrompt(false);
        }
    }
    
    const handleStructuredPromptChange = (field: keyof StructuredPrompt, value: string) => {
        setStructuredPrompt(prev => ({...prev, [field]: value}));
    }

    return (
        <TooltipProvider>
            <div className="flex h-full w-full">
                <Modal isOpen={modal.isOpen} title={modal.title} onClose={() => setModal(prev => ({ ...prev, isOpen: false }))} size={modal.size}>
                    {modal.children}
                </Modal>
                <audio ref={audioRef} className="hidden" />

                {/* Left Panel: Library */}
                <div className="w-[350px] flex-shrink-0 flex flex-col p-4 border-r">
                    <div className="flex-grow flex flex-col gap-6 overflow-y-auto pr-2">
                        <header>
                            <h1 className="text-h2 font-headline">Library</h1>
                            <p className="text-muted-foreground text-body">Select your product and style.</p>
                        </header>
                        
                        <section className="space-y-4">
                            <h3 className="text-h3 font-headline">Product</h3>
                            <div className="space-y-2">
                                <Label htmlFor="device-type">Product Type</Label>
                                <Select
                                    value={selectedDevice.name}
                                    onValueChange={(value) => {
                                        const device = DEVICES.find(d => d.name === value);
                                        if (device) handleDeviceSelection(device);
                                    }}
                                    disabled={isLoading}
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
                                        disabled={isLoading}
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
                        </section>
                    </div>
                </div>

                {/* Center Canvas: Stage */}
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }} 
                    transition={{ duration: 0.7, delay: 0.2 }} 
                    className="flex-1 flex flex-col p-4"
                >
                    <div className={cn(
                        "flex-1 flex flex-col items-center justify-center rounded-2xl min-h-0 p-4 transition-colors relative",
                        isPreviewingAr ? 'bg-transparent' : 'bg-background' 
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
                                
                                {!isPreviewingAr && previewMode === 'mockup' && (
                                   <div className="w-full h-full relative flex items-center justify-center flex-col gap-4">
                                       {isGeneratingMockup ? (
                                           <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
                                               <Icon name="Wand2" className="w-16 h-16 text-primary animate-pulse" />
                                               <p className="font-semibold">Generating lifestyle mockup...</p>
                                               <p className="text-xs">This job is running in the background.</p>
                                           </div>
                                       ) : generatedMockup ? (
                                           <Image src={generatedMockup} alt="AI Generated Mockup" fill className="object-contain rounded-lg" />
                                       ) : (
                                          <div className="text-center text-muted-foreground flex flex-col items-center justify-center gap-4 p-4">
                                              <Icon name="Camera" className="w-24 h-24 text-primary/30" />
                                              <h3 className="text-lg font-semibold">Generate AI Lifestyle Mockup</h3>
                                              <p className="max-w-md">Describe a scene to place your product in. The AI will generate a realistic photo of your product in that environment.</p>
                                               <div className="w-full max-w-md flex flex-col gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <Input 
                                                            value={mockupPrompt} 
                                                            onChange={e => setMockupPrompt(e.target.value)}
                                                            placeholder="e.g., on a sunlit desk in a cozy cafe"
                                                            disabled={!generatedDecal || isGeneratingMockup}
                                                        />
                                                        <Button onClick={handleGenerateMockup} disabled={!generatedDecal || !mockupPrompt.trim() || isGeneratingMockup}>
                                                            Generate
                                                        </Button>
                                                    </div>
                                                    <div className="flex items-center justify-center gap-2 text-sm">
                                                        <Button variant="link" size="sm" onClick={() => setMockupPrompt(prev => prev ? `${prev}, minimalist` : 'minimalist')}>Minimalist</Button>
                                                        <Button variant="link" size="sm" onClick={() => setMockupPrompt(prev => prev ? `${prev}, in a cafe` : 'in a cafe')}>Cafe</Button>
                                                        <Button variant="link" size="sm" onClick={() => setMockupPrompt(prev => prev ? `${prev}, outdoors` : 'outdoors')}>Outdoor</Button>
                                                        <Button variant="link" size="sm" onClick={() => setMockupPrompt(prev => prev ? `${prev}, on a tech desk` : 'on a tech desk')}>Techy</Button>
                                                        <Button variant="link" size="sm" onClick={handleMockupInspire} disabled={isGettingCreativePrompt}>{isGettingCreativePrompt ? "..." : "Inspire Me"}</Button>
                                                    </div>
                                               </div>
                                          </div>
                                       )}
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
                                        <ToggleGroup type="single" value={previewMode} onValueChange={(value: any) => value && setPreviewMode(value)} className="bg-card/80 backdrop-blur-md rounded-lg p-1 border">
                                            <ToggleGroupItem value="2D" aria-label="2D Preview">
                                               <Icon name="ImageIcon" className="w-4 h-4 mr-2" /> 2D
                                            </ToggleGroupItem>
                                            <ToggleGroupItem value="3D" aria-label="3D Preview">
                                               <Icon name="Box" className="w-4 h-4 mr-2" /> 3D
                                            </ToggleGroupItem>
                                            <ToggleGroupItem value="mockup" aria-label="Mockup Preview" disabled={!generatedDecal}>
                                               <Icon name="Camera" className="w-4 h-4 mr-2" /> Mockups
                                            </ToggleGroupItem>
                                        </ToggleGroup>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            
                            <Button variant="outline" onClick={() => setIsPreviewingAr(!isPreviewingAr)} className="bg-card/80 backdrop-blur-md">
                                {isPreviewingAr ? <><Icon name="Undo2" className="w-4 h-4 mr-2" /> Back to Editor</> : <><Icon name="Camera" className="w-4 h-4 mr-2" /> View in AR</>}
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {/* Right Panel: Controls */}
                <div className="w-[400px] flex-shrink-0 flex flex-col p-4 border-l">
                    <div className="flex-grow flex flex-col gap-4">
                        <header className="flex items-center justify-between">
                            <h1 className="text-h2 font-headline">Controls</h1>
                            <Button variant="ghost" size="icon" onClick={onBack}><Icon name="X" /></Button>
                        </header>

                        <div className="flex-grow space-y-6 overflow-y-auto pr-2">
                            {/* Vision */}
                            <section className="space-y-4">
                                <h3 className="text-h3 font-headline">Vision</h3>
                                <AnimatePresence mode="wait">
                                    {isAdvancedPrompt ? (
                                        <motion.div 
                                            key="advanced-prompt"
                                            initial={{opacity: 0, y: -10}}
                                            animate={{opacity: 1, y: 0}}
                                            exit={{opacity: 0, y: -10}}
                                            className="space-y-3 p-3 bg-muted/50 rounded-lg"
                                        >
                                            <div className="space-y-1">
                                                <Label htmlFor="subject">Subject</Label>
                                                <Input id="subject" placeholder="e.g., A majestic stag with crystal antlers" value={structuredPrompt.subject} onChange={e => handleStructuredPromptChange('subject', e.target.value)} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="setting">Setting / Scene</Label>
                                                <Input id="setting" placeholder="e.g., in a dark, enchanted forest" value={structuredPrompt.setting} onChange={e => handleStructuredPromptChange('setting', e.target.value)} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label htmlFor="negativePrompt">Negative Prompt (exclude things)</Label>
                                                <Input id="negativePrompt" placeholder="e.g., blurry, text, watermark" value={structuredPrompt.negativePrompt} onChange={e => handleStructuredPromptChange('negativePrompt', e.target.value)} />
                                            </div>
                                            <div className="flex items-center space-x-2 pt-2">
                                                <Switch id="lock-seed-switch" checked={isSeedLocked} onCheckedChange={setIsSeedLocked} disabled={!seed}/>
                                                <Label htmlFor="lock-seed-switch">Lock Seed ({seed || 'N/A'})</Label>
                                            </div>
                                        </motion.div>
                                    ) : (
                                         <motion.div 
                                            key="simple-prompt"
                                            initial={{opacity: 0, y: -10}}
                                            animate={{opacity: 1, y: 0}}
                                            exit={{opacity: 0, y: -10}}
                                            className="space-y-2"
                                         >
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
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <div className="flex items-center justify-between">
                                     <Button variant="link" className="p-0 h-auto text-sm" onClick={handleCreativePrompt} disabled={isGettingCreativePrompt || isLoading}>
                                         {isGettingCreativePrompt ? 'Thinking...' : 'Not sure? Get a random idea!'}
                                     </Button>
                                     <div className="flex items-center space-x-2">
                                        <Label htmlFor="advanced-prompt-switch" className="text-sm">Advanced</Label>
                                        <Switch id="advanced-prompt-switch" checked={isAdvancedPrompt} onCheckedChange={setIsAdvancedPrompt} />
                                    </div>
                                </div>
                            </section>

                            {/* Style */}
                            <section className="space-y-4">
                                <h3 className="text-h3 font-headline">Style</h3>
                                <ToggleGroup 
                                    type="single" 
                                    value={selectedStyle.name} 
                                    onValueChange={(value) => {
                                        if (value) {
                                            const style = STYLES.find(s => s.name === value);
                                            if (style) setSelectedStyle(style);
                                        }
                                    }} 
                                    className="grid grid-cols-2 gap-2"
                                >
                                    {STYLES.map(style => (
                                        <ToggleGroupItem key={style.name} value={style.name} className="h-auto p-0 rounded-lg border focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 data-[state=on]:border-primary data-[state=on]:ring-2 data-[state=on]:ring-primary data-[state=on]:ring-offset-2">
                                            <div className="relative w-full aspect-video rounded-md overflow-hidden">
                                                <Image src={style.image} alt={style.name} fill className="object-cover" {...{ 'data-ai-hint': style['data-ai-hint'] }} />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                    <p className="text-white font-semibold text-sm">{style.name}</p>
                                                </div>
                                            </div>
                                        </ToggleGroupItem>
                                    ))}
                                </ToggleGroup>
                            </section>

                            {/* AI Coach */}
                            <section className="space-y-3 p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <h3 className="text-h3 font-headline flex items-center gap-2"><Icon name="Bot" className="text-primary" /> AI Coach</h3>
                                  <Button variant="outline" size="sm" onClick={handleGetRemixSuggestions} disabled={!prompt.trim() || isGettingRemix || isLoading}>
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
                            </section>
                        </div>
                        
                        <div className="mt-auto pt-6 space-y-3 border-t">
                             <div className="flex items-start space-x-2">
                                <Checkbox id="terms" checked={policyAccepted} onCheckedChange={(checked) => setPolicyAccepted(Boolean(checked))} disabled={isLoading} className="mt-1"/>
                                <label
                                    htmlFor="terms"
                                    className="text-sm text-muted-foreground leading-snug"
                                >
                                    I agree to the{' '}
                                    <Link href="/privacy-policy" className="underline text-primary hover:text-primary/80" target="_blank">
                                        Content Policy
                                    </Link> and understand that my design may be reviewed for safety.
                                </label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button onClick={() => handleGenerate()} disabled={isLoading || !(prompt.trim() || structuredPrompt.subject.trim()) || !policyAccepted}
                                    className="flex-grow text-lg h-12 text-white transition-all duration-300 bg-gradient-to-r from-primary to-accent hover:shadow-xl disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:shadow-none">
                                    <motion.span whileHover={{ y: -1 }} whileTap={{ y: 1 }} className="flex items-center gap-2">
                                        <Icon name={isLoading ? 'Wand2' : 'Sparkles'} className={isLoading ? "animate-pulse" : ""} />
                                        {isLoading ? 'Designing...' : 'Generate Vision'}
                                    </motion.span>
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
                                        <Button onClick={handleAddToCart} className="w-full bg-green-600 hover:bg-green-700">
                                            <Icon name="ShoppingCart" /> Add to Cart
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button variant="outline" onClick={handleGetFeedback} disabled={isGettingFeedback} className="w-full border-primary/50 text-primary hover:bg-primary/10 hover:text-primary">
                                            {isGettingFeedback ? <Icon name="Wand2" className="animate-pulse" /> : <Icon name="Sparkles" />}
                                            Edit with AI ✨
                                        </Button>
                                        <Button variant="outline" onClick={handleTellStory} disabled={!story || isSpeaking} className="w-full border-primary/50 text-primary hover:bg-primary/10 hover:text-primary">
                                            <Icon name={isSpeaking ? "Volume2" : "BookOpen"} className={isSpeaking ? "animate-pulse" : ""} />
                                            {isSpeaking ? "Playing..." : "Tell Me the Story"}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
