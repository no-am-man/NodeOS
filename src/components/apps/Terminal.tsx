"use client";

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOs, type OsState } from '@/contexts/OsContext';
import { findApp } from '@/lib/apps';

interface Line {
    type: 'input' | 'output';
    text: string;
}

const welcomeMessage = [
    { type: 'output' as const, text: 'WebFrameOS Terminal [Version 1.0.0]' },
    { type: 'output' as const, text: '(c) 2024 Firebase. All rights reserved.' },
    { type: 'output' as const, text: '' },
    { type: 'output' as const, text: 'Type "help" for a list of available commands.' },
];

export default function Terminal() {
    const [history, setHistory] = useState<Line[]>(welcomeMessage);
    const [input, setInput] = useState('');
    const { state } = useOs();
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
           const viewport = scrollAreaRef.current.firstElementChild as HTMLDivElement;
           if(viewport) {
             viewport.scrollTop = viewport.scrollHeight;
           }
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [history]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const processCommand = (command: string, osState: OsState): Line => {
        const [cmd, ...args] = command.toLowerCase().trim().split(' ');
        switch (cmd) {
            case 'help':
                return { type: 'output', text: 'Available commands:\n  help    - Show this help message\n  date    - Display the current date and time\n  clear   - Clear the terminal screen\n  echo    - Display a line of text\n  ps      - List running processes' };
            case 'date':
                return { type: 'output', text: new Date().toLocaleString() };
            case 'echo':
                return { type: 'output', text: args.join(' ') };
            case 'ps': {
                const header = 'PID\t\tAPP\t\tTITLE';
                const processes = osState.windows.map(win => {
                    const app = findApp(win.appId);
                    return `${win.id}\t${app?.id}\t\t${win.title}`;
                }).join('\n');
                return { type: 'output', text: `${header}\n${processes}`};
            }
            case 'clear':
                return { type: 'output', text: '' }; // Special case handled in handleKeyDown
            default:
                return { type: 'output', text: `Command not found: ${command}` };
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && input.trim()) {
            const command = input.trim();
            const newHistory: Line[] = [...history, { type: 'input', text: command }];
            
            if (command.toLowerCase() === 'clear') {
                setHistory(welcomeMessage);
            } else {
                const outputLine = processCommand(command, state);
                setHistory([...newHistory, outputLine]);
            }
            setInput('');
        }
    };

    const handleClick = () => {
        inputRef.current?.focus();
    }

    return (
        <div className="flex flex-col h-full bg-background text-foreground font-code p-2 cursor-text" onClick={handleClick}>
            <ScrollArea className="flex-grow" ref={scrollAreaRef}>
                <div className="p-2">
                    {history.map((line, index) => (
                        line.text && (
                            <div key={index} className="flex gap-2 items-start">
                                {line.type === 'input' && <span className="text-primary font-bold">$</span>}
                                <p className="whitespace-pre-wrap text-sm leading-tight break-words">
                                    {line.text}
                                </p>
                            </div>
                        )
                    ))}
                </div>
            </ScrollArea>
            <div className="flex items-center gap-2 mt-auto pt-2 shrink-0">
                <span className="text-primary font-bold">$</span>
                <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto font-code text-sm"
                    autoComplete="off"
                    data-testid="terminal-input"
                    placeholder="Type a command and press Enter"
                />
            </div>
        </div>
    );
}
