
'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import Icon from '../shared/icon';
import { generateListingContent } from '@/ai/flows/generate-listing-content';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

type AiOptimizerButtonProps = {
    prompt: string;
    contentType: 'title' | 'description';
    onContentReceived: (content: string) => void;
};

export default function AiOptimizerButton({ prompt, contentType, onContentReceived }: AiOptimizerButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleClick = async () => {
        setIsLoading(true);
        try {
            const result = await generateListingContent({ prompt, contentType });
            onContentReceived(result.content);
            toast({ title: `AI ${contentType} generated!` });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Generation Failed', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleClick} disabled={isLoading}>
                    <Icon name={isLoading ? 'Wand2' : 'Sparkles'} className={isLoading ? 'animate-pulse' : ''} />
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>Optimize with AI ✨</p>
            </TooltipContent>
        </Tooltip>
    );
}
