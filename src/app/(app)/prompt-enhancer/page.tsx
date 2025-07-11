
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Icon from '@/components/shared/icon';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { enhancePrompt } from '@/ai/flows/enhance-prompt';
import { useApp } from '@/contexts/AppContext';

export default function PromptEnhancerPage() {
    const [idea, setIdea] = useState('');
    const [enhancedPrompt, setEnhancedPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    const { startRemix } = useApp();

    const handleEnhance = async () => {
        if (!idea.trim()) {
            toast({ variant: 'destructive', title: 'Idea Required', description: 'Please enter an idea to enhance.' });
            return;
        }
        setIsLoading(true);
        setEnhancedPrompt('');
        try {
            const result = await enhancePrompt({
                prompt: idea,
                deviceType: 'Any', // Generic for enhancement purposes
                style: 'Any'
            });
            setEnhancedPrompt(result.enhancedPrompt);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Enhancement Failed', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartDesigning = () => {
        if (!enhancedPrompt) return;
        // We use the startRemix function to pass the prompt to the design studio
        startRemix({
            prompt: enhancedPrompt,
            style: 'Photorealistic', // Default style
            // These are placeholders for the remix functionality
            id: 'temp',
            url: '',
            title: '',
            deviceType: 'Laptop'
        });
    };

    return (
        <div className="p-4 md:p-8 animate-fade-in flex items-center justify-center h-full">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-2xl"
            >
                <Card>
                    <CardHeader className="text-center">
                        <motion.div
                            className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4"
                            animate={{ rotate: [0, 10, -5, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Icon name="Sparkles" className="w-8 h-8 text-white" />
                        </motion.div>
                        <CardTitle>AI Prompt Enhancer</CardTitle>
                        <CardDescription>Turn a simple idea into a rich, descriptive prompt for better creations.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Textarea
                                value={idea}
                                onChange={(e) => setIdea(e.target.value)}
                                placeholder="e.g., a cat in space, a forest in the rain, a robot holding a flower"
                                className="text-center text-lg min-h-[100px]"
                            />
                            <Button onClick={handleEnhance} disabled={isLoading} className="w-full">
                                {isLoading ? (
                                    <>
                                        <Icon name="Wand2" className="animate-pulse" /> Enhancing...
                                    </>
                                ) : (
                                    <>
                                        <Icon name="Sparkles" /> Enhance My Idea
                                    </>
                                )}
                            </Button>
                        </div>

                        {enhancedPrompt && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4 p-4 bg-muted/50 rounded-lg"
                            >
                                <h3 className="font-semibold text-center">Your Enhanced Prompt:</h3>
                                <p className="text-center font-mono p-4 bg-background rounded-md text-base">"{enhancedPrompt}"</p>
                                <Button onClick={handleStartDesigning} className="w-full" size="lg">
                                    <Icon name="Brush" /> Start Designing with this Prompt
                                </Button>
                            </motion.div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
