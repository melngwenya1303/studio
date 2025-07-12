
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/shared/icon';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';

type Message = {
    user: string;
    text: string;
    isProposal?: boolean;
};

export default function LiveSharePage() {
    const { user } = useApp();
    const [prompt, setPrompt] = useState('A vibrant city street on a distant exoplanet, with alien flora and futuristic vehicles.');
    const [messages, setMessages] = useState<Message[]>([
        { user: 'Alex', text: 'Hey everyone! Ready to make some cool art?' },
        { user: 'Sam', text: 'Born ready! What if we add some bioluminescent creatures?', isProposal: true },
    ]);
    const [newMessage, setNewMessage] = useState('');
    const [isOwner, setIsOwner] = useState(true); // Simulate being the session owner

    const participants = [
        { id: 'u1', name: 'Alex', avatar: 'https://i.pravatar.cc/40?u=alex' },
        { id: 'u2', name: 'Sam', avatar: 'https://i.pravatar.cc/40?u=sam' },
        { id: 'u3', name: 'Taylor', avatar: 'https://i.pravatar.cc/40?u=taylor' },
    ];

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;
        setMessages(prev => [...prev, { user: 'Me', text: newMessage.trim() }]);
        setNewMessage('');
    };

    const handleProposeChange = () => {
        if (!prompt.trim() || !user) return;
        setMessages(prev => [...prev, { user: 'Me', text: prompt, isProposal: true }]);
    };

    const handleAcceptAndGenerate = (proposalText: string) => {
        setPrompt(proposalText);
        // Here you would trigger the actual generation for all participants
        console.log("Accepted and generating with new prompt:", proposalText);
    }

    return (
        <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            <motion.div 
                initial={{ x: -50, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }} 
                transition={{ duration: 0.5 }} 
                className="lg:col-span-2 flex flex-col space-y-6"
            >
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-h1 font-headline flex items-center gap-3">
                            <Icon name="Users" /> Live Session
                        </h1>
                        <p className="text-muted-foreground mt-1 text-body">Create together in real-time.</p>
                    </div>
                     <div className="flex items-center -space-x-2">
                        {participants.map(p => (
                            <div key={p.id} className="relative">
                                <Avatar>
                                    <AvatarImage src={p.avatar} alt={p.name} />
                                    <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
                            </div>
                        ))}
                         <div className="relative">
                            <Avatar>
                                <AvatarImage src={`https://i.pravatar.cc/40?u=${user?.uid}`} alt="You" />
                                <AvatarFallback>Y</AvatarFallback>
                            </Avatar>
                            <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
                        </div>
                    </div>
                </header>

                <Card className="flex-grow">
                    <CardHeader>
                        <CardTitle>Shared Prompt</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            className="w-full p-4 rounded-lg bg-muted text-lg border-border focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 resize-none h-48"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                         <div className="mt-4 flex gap-2">
                            <Button onClick={handleProposeChange} className="flex-grow">
                                <Icon name="Sparkles" /> Propose Change
                            </Button>
                            {isOwner && (
                                <Button variant="secondary" disabled>
                                    <Icon name="Wand2" /> Generate for Group (Owner)
                                </Button>
                            )}
                        </div>
                         <div className="mt-4 text-center">
                            <p className="text-sm text-gray-500">Real-time cursors and canvas syncing are coming soon!</p>
                        </div>
                    </CardContent>
                </Card>
                 
            </motion.div>

            <motion.div 
                initial={{ x: 50, opacity: 0 }} 
                animate={{ x: 0, opacity: 1 }} 
                transition={{ duration: 0.5, delay: 0.1 }}
                className="lg:col-span-1 flex flex-col"
            >
                <Card className="h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>Team Chat</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col gap-4">
                        <div className="flex-grow space-y-4 overflow-y-auto pr-2">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex flex-col ${msg.user === 'Me' ? 'items-end' : 'items-start'}`}>
                                    <span className="text-xs text-muted-foreground px-1">{msg.user}</span>
                                    {msg.isProposal ? (
                                        <div className="p-3 rounded-lg border bg-card w-full">
                                            <p className="text-sm text-muted-foreground">suggested a change:</p>
                                            <p className="font-mono text-sm p-2 bg-muted rounded-md my-2">"{msg.text}"</p>
                                            {isOwner && msg.user !== 'Me' && (
                                                <Button size="sm" onClick={() => handleAcceptAndGenerate(msg.text)}>
                                                   Accept & Generate
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                         <div className={`px-4 py-2 rounded-xl max-w-xs ${msg.user === 'Me' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                            {msg.text}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t">
                            <input
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                            <Button type="submit" size="icon">
                                <Icon name="Send" />
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
