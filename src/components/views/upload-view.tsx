
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { useToast } from "@/hooks/use-toast";
import { DEVICES } from '@/lib/constants';
import type { Device, DeviceModel, Creation } from '@/lib/types';
import Icon from '@/components/shared/icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


type UploadViewProps = {
    onBack: () => void;
};

export default function UploadView({ onBack }: UploadViewProps) {
    const { user, addCreation, addToCart } = useApp();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedDevice, setSelectedDevice] = useState<Device>(DEVICES[0]);
    const [selectedModel, setSelectedModel] = useState<DeviceModel | null>(DEVICES[0].models ? DEVICES[0].models[0] : null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [previewMode, setPreviewMode] = useState<'2D' | '3D'>('2D');
    const [mockupColor, setMockupColor] = useState('bg-gray-200');

    // AR State
    const [isPreviewingAr, setIsPreviewingAr] = useState(false);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleDeviceSelection = (device: Device) => {
        setSelectedDevice(device);
        setSelectedModel(device.models?.[0] || null);
    };

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

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please upload an image file (PNG, JPG, etc.).' });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveCreation = () => {
        if (!uploadedImage || !user) return;
        setIsSaving(true);
        try {
            const deviceName = selectedModel ? `${selectedDevice.name} (${selectedModel.name})` : selectedDevice.name;
            const newCreation: Omit<Creation, 'id' | 'createdAt'> = {
                url: uploadedImage,
                prompt: 'User Uploaded Artwork',
                title: 'My Uploaded Design',
                style: 'Custom',
                deviceType: deviceName,
            };
            const savedCreation = addCreation(newCreation);
            toast({ title: 'Success!', description: `'${savedCreation.title}' has been saved to My Designs.` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Save Error', description: error.message });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handlePurchase = () => {
        if (!uploadedImage) return;
        const deviceName = selectedModel ? `${selectedDevice.name} (${selectedModel.name})` : selectedDevice.name;
        const cartItem = {
            url: uploadedImage,
            prompt: 'User Uploaded Artwork',
            title: 'My Uploaded Design',
            style: 'Custom',
            deviceType: deviceName,
        };
        addToCart(cartItem);
    };

    const currentCanvas = selectedModel || selectedDevice;

    return (
        <TooltipProvider>
            <div className="flex h-full w-full">
                {/* Left Column: Controls */}
                <motion.div 
                    initial={{ x: -50, opacity: 0 }} 
                    animate={{ x: 0, opacity: 1 }} 
                    transition={{ duration: 0.5 }} 
                    className="w-[400px] flex-shrink-0"
                >
                     <Card className="shadow-lg flex flex-col h-full m-4 rounded-2xl">
                        <CardHeader className="flex-row items-center justify-between">
                            <CardTitle className="text-h3 font-medium font-headline">Upload Artwork</CardTitle>
                            <Button variant="ghost" onClick={onBack}><Icon name="Undo2" className="mr-2" /> Back</Button>
                        </CardHeader>
                        <CardContent className="flex flex-col flex-grow">
                             <Tabs defaultValue="design" className="w-full flex flex-col flex-grow">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="design">Design</TabsTrigger>
                                    <TabsTrigger value="mockups">Mockups</TabsTrigger>
                                </TabsList>
                                <TabsContent value="design" className="flex-grow flex flex-col">
                                    <div className="space-y-6 py-6 flex-grow">
                                        <div className="space-y-4">
                                            <h3 className="text-xl font-semibold font-headline">1. Upload Your Image</h3>
                                            <div className="space-y-2">
                                                <Label htmlFor="upload-button">Artwork File</Label>
                                                <Button id="upload-button" variant="outline" className="w-full h-32 border-dashed" onClick={() => fileInputRef.current?.click()}>
                                                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                                        <Icon name="ImageIcon" className="w-8 h-8" />
                                                        <span>Click to upload</span>
                                                        <span className="text-xs">PNG, JPG, GIF</span>
                                                    </div>
                                                </Button>
                                            </div>
                                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                                        </div>
                                        
                                        <Separator />

                                        <div className="space-y-4">
                                            <h3 className="text-xl font-semibold font-headline">2. Select Product</h3>
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
                                    </div>
                                    
                                    <div className="mt-auto pt-4 space-y-3 border-t">
                                        <div className="flex gap-3">
                                            <Button variant="outline" onClick={handleSaveCreation} disabled={isSaving || !uploadedImage} className="w-full">
                                                {isSaving ? <Icon name="Wand2" className="animate-pulse" /> : <Icon name="Heart" />}
                                                {isSaving ? 'Saving...' : 'Save Design'}
                                            </Button>
                                            <Button onClick={handlePurchase} disabled={!uploadedImage} className="w-full bg-green-600 hover:bg-green-700">
                                                <Icon name="ShoppingCart" /> Purchase
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="mockups">
                                     <div className="py-6 space-y-4">
                                        <h3 className="text-xl font-semibold font-headline">Change Background</h3>
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
                                {isPreviewingAr ? (
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
                                ) : previewMode === '2D' ? (
                                    <div
                                        className="relative w-full h-full"
                                    >
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
                                        {uploadedImage && (
                                            <motion.div
                                                className="absolute"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{opacity: 0}}
                                                transition={{ duration: 0.5 }}
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
                                                    src={uploadedImage}
                                                    alt="Uploaded Decal"
                                                    fill
                                                    className="object-contain"
                                                />
                                            </motion.div>
                                        )}
                                        </AnimatePresence>
                                    </div>
                                ) : (
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
                                        <p className="max-w-xs">This feature is coming soon!</p>
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
