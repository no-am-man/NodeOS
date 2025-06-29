"use client";

import { useState } from 'react';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import { useOs } from '@/contexts/OsContext';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

export default function RandomBackgroundButton() {
    const { generateAndSetBackground } = useOs();
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleClick = async () => {
        setIsLoading(true);
        try {
            await generateAndSetBackground();
        } catch (error) {
            console.error("Failed to generate background", error);
            toast({
                variant: "destructive",
                title: "Background Generation Failed",
                description: "Could not generate a new background. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleClick}
                        disabled={isLoading}
                        aria-label="Generate new background"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <ImageIcon />
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Generate new background</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
