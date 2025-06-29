"use client";

import { useState } from 'react';
import { Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { aiAssistantPromptResponse } from '@/ai/flows/ai-assistant-prompt-response';

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

export default function AIAssistant() {
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'ai', text: "Hello! How can I assist you today?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (input.trim() === '' || isLoading) return;

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await aiAssistantPromptResponse({ prompt: input });
            const aiMessage: Message = { sender: 'ai', text: response.response };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error('AI Assistant Error:', error);
            const errorMessage: Message = { sender: 'ai', text: "Sorry, I encountered an error. Please try again." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background">
            <ScrollArea className="flex-grow p-4">
                <div className="space-y-4">
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={cn(
                                "flex items-start gap-3",
                                message.sender === 'user' ? 'justify-end' : 'justify-start'
                            )}
                        >
                            {message.sender === 'ai' && (
                                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                                    <Bot size={20} />
                                </div>
                            )}
                            <div
                                className={cn(
                                    "p-3 rounded-lg max-w-xs md:max-w-md",
                                    message.sender === 'user'
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted"
                                )}
                            >
                                <p className="text-sm font-body whitespace-pre-wrap">{message.text}</p>
                            </div>
                            {message.sender === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center flex-shrink-0">
                                    <User size={20} />
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                         <div data-testid="loading-indicator" className="flex items-start gap-3 justify-start">
                            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                                <Bot size={20} />
                            </div>
                            <div className="p-3 rounded-lg bg-muted">
                                <div className="flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-foreground/50 animate-pulse delay-0"></span>
                                    <span className="h-2 w-2 rounded-full bg-foreground/50 animate-pulse delay-150"></span>
                                    <span className="h-2 w-2 rounded-full bg-foreground/50 animate-pulse delay-300"></span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
            <div className="p-2 border-t">
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        disabled={isLoading}
                        className="font-body"
                    />
                    <Button onClick={handleSend} disabled={isLoading}>
                        Send
                    </Button>
                </div>
            </div>
        </div>
    );
}
