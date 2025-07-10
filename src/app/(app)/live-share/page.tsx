
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/shared/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';

export default function LiveSharePage() {
    const { user } = useApp();
    const [prompt, setPrompt] = useState('A vibrant city street on a distant exoplanet, with alien flora and futuristic vehicles.');
    const [messages, setMessages] = useState([
        { user: 'Alex', text: 'Hey everyone! Ready to make some cool art?' },
        { user: 'Sam', text: 'Born ready! What if we add some bioluminescent creatures?' },
    ]);
    const [newMessage, setNewMessage] = useState('');

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
                        <h1 className="text-h1 font-bold font-headline flex items-center gap-3">
                            <Icon name="Users" /> Live Session
                        </h1>
                        <p className="text-muted-foreground mt-1">Create together in real-time.</p>
                    </div>
                    <div className="flex items-center -space-x-2">
                        {participants.map(p => (
                            <Avatar key={p.id}>
                                <AvatarImage src={p.avatar} alt={p.name} />
                                <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        ))}
                    </div>
                </header>

                <Card className="flex-grow">
                    <CardHeader>
                        <CardTitle>Shared Prompt</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            className="w-full p-4 rounded-lg bg-gray-50 dark:bg-gray-800/80 text-lg border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 resize-none h-48"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                         <div className="mt-4 text-center">
                            <p className="text-sm text-gray-500">This feature is currently in preview.</p>
                            <p className="text-sm text-gray-500">Real-time collaboration is coming soon!</p>
                        </div>
                    </CardContent>
                </Card>
                 <Button size="lg" disabled>
                    <Icon name="Wand2" /> Generate (Coming Soon)
                </Button>
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
                                    <span className="text-xs text-gray-500 dark:text-gray-400 px-1">{msg.user}</span>
                                    <div className={`px-4 py-2 rounded-xl max-w-xs ${msg.user === 'Me' ? 'bg-primary text-primary-foreground' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t">
                            <Input 
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
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
