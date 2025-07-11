
'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
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


type UploadViewProps = {
    onBack: () => void;
};

export default function UploadView({ onBack }: UploadViewProps) {
    const { user, addCreation } = useApp();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedDevice, setSelectedDevice] = useState<Device>(DEVICES[0]);
    const [selectedModel, setSelectedModel] = useState<DeviceModel | null>(DEVICES[0].models ? DEVICES[0].models[0] : null);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [previewMode, setPreviewMode] = useState<'2D' | '3D'>('2D');
    const [mockupColor, setMockupColor] = useState('bg-gray-200');

    const handleDeviceSelection = (device: Device) => {
        setSelectedDevice(device);
        setSelectedModel(device.models?.[0] || null);
    };

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

    const handleSaveCreation = async () => {
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
            addCreation(newCreation);
            toast({ title: 'Success!', description: 'Your design has been saved to My Designs.' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Save Error', description: error.message });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleFinalize = () => {
        toast({ title: 'Design Finalized!', description: "We're preparing your uploaded design for production." });
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
                                            <Button variant="outline" className="w-full h-32 border-dashed" onClick={() => fileInputRef.current?.click()}>
                                                <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                                    <Icon name="ImageIcon" className="w-8 h-8" />
                                                    <span>Click to upload</span>
                                                    <span className="text-xs">PNG, JPG, GIF</span>
                                                </div>
                                            </Button>
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
                                    
                                    <div className="mt-auto pt-4 space-y-3">
                                        <div className="flex gap-3">
                                            <Button variant="outline" onClick={handleSaveCreation} disabled={isSaving || !uploadedImage} className="w-full">
                                                {isSaving ? <Icon name="Wand2" className="animate-pulse" /> : <Icon name="Heart" />}
                                                {isSaving ? 'Saving...' : 'Save Design'}
                                            </Button>
                                            <Button onClick={handleFinalize} disabled={!uploadedImage} className="w-full bg-green-600 hover:bg-green-700">Finalize Design</Button>
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="mockups">
                                     <div className="py-6 space-y-4">
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
                        mockupColor
                    )}>
                        <div className="flex-grow w-full h-full flex items-center justify-center relative">
                            {previewMode === '2D' && (
                                <motion.div
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                    className="relative w-full h-full"
                                >
                                    <Image
                                        src={currentCanvas.previewImage}
                                        alt={`${currentCanvas.name} preview`}
                                        fill
                                        className="object-contain"
                                        data-ai-hint={currentCanvas['data-ai-hint']}
                                        key={currentCanvas.name}
                                        priority
                                    />
                                    {uploadedImage && (
                                        <motion.div
                                            className="absolute"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
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
                                </motion.div>
                            )}
                            {previewMode === '3D' && (
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
                        </div>
                        <div className="absolute bottom-4 right-4 w-full flex justify-between items-center px-4">
                            <ToggleGroup type="single" value={previewMode} onValueChange={(value: '2D' | '3D') => value && setPreviewMode(value)} className="bg-background/50 rounded-lg p-1">
                                <ToggleGroupItem value="2D" aria-label="2D Preview">
                                <Icon name="ImageIcon" className="w-4 h-4 mr-2" /> 2D
                                </ToggleGroupItem>
                                <ToggleGroupItem value="3D" aria-label="3D Preview">
                                <Icon name="Box" className="w-4 h-4 mr-2" /> 3D
                                </ToggleGroupItem>
                            </ToggleGroup>
                            <Button variant="outline" disabled>
                                <Icon name="Camera" className="w-4 h-4 mr-2" />
                                View in AR (Coming Soon)
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </TooltipProvider>
    );
}
