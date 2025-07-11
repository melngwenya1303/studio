
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/shared/icon';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// Mock data for a generic user profile (can be replaced with real data)
const profileUser = {
    name: 'PixelProphet',
    followers: 1234,
    following: 56,
    bio: 'Digital artist exploring the intersection of dreams and code. Turning imagination into tangible surfaces.',
};

export default function ProfilePage() {
    const { user, creations } = useApp();
    const router = useRouter();

    if (!user) {
        // Optional: Redirect to login or show a placeholder if no user is logged in
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Icon name="UserCircle" className="w-24 h-24 text-muted-foreground mb-6" />
                <h1 className="text-h1 font-headline">Please Log In</h1>
                <p className="text-muted-foreground mt-2 mb-6">You need to be logged in to view your profile.</p>
                <Button onClick={() => router.push('/design-studio')}>Back to Home</Button>
            </div>
        );
    }
    
    const loggedInUserAvatar = `https://i.pravatar.cc/150?u=${user.uid}`;

    return (
        <div className="p-4 md:p-8 animate-fade-in">
            <header className="mb-8">
                <Card className="p-6">
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="flex flex-col md:flex-row items-center gap-6"
                    >
                        <Avatar className="w-24 h-24 border-4 border-primary">
                            <AvatarImage src={loggedInUserAvatar} />
                            <AvatarFallback>{profileUser.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow text-center md:text-left">
                            <h1 className="text-h1 font-headline">{profileUser.name}</h1>
                            <p className="text-muted-foreground mt-1 text-body">{profileUser.bio}</p>
                            <div className="flex justify-center md:justify-start items-center gap-6 mt-4 text-sm">
                                <div><span className="font-bold">{creations.length}</span> Creations</div>
                                <div><span className="font-bold">{profileUser.followers}</span> Followers</div>
                                <div><span className="font-bold">{profileUser.following}</span> Following</div>
                            </div>
                        </div>
                        <div className="flex-shrink-0">
                            <Button><Icon name="UserPlus" /> Follow</Button>
                        </div>
                    </motion.div>
                </Card>
            </header>

            <div>
                <h2 className="text-h2 font-headline mb-4">My Creations</h2>
                {creations.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {creations.map((creation, i) => (
                            <motion.div 
                                key={creation.id} 
                                className="group relative rounded-xl overflow-hidden shadow-lg aspect-square"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: i * 0.05 }}
                            >
                                <Image src={creation.url} alt={creation.title || creation.prompt} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end">
                                    <p className="text-white text-sm font-semibold truncate" title={creation.title}>{creation.title || creation.prompt}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-card rounded-xl border border-dashed">
                        <Icon name="ImageIcon" className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <h4 className="text-xl font-semibold mb-2">Your canvas is empty!</h4>
                         <p className="text-muted-foreground mb-6 text-body">
                            Navigate to the 'Design Studio' to create your first masterpiece.
                        </p>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button onClick={() => router.push('/design-studio')} size="lg">Start Designing</Button>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
}
