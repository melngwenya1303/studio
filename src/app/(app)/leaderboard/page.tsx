
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/shared/icon';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const leaderboardData = [
    { rank: 1, name: 'PixelProphet', creations: 124, remixes: 302, avatar: 'https://i.pravatar.cc/40?u=prophet' },
    { rank: 2, name: 'ArtfulAntics', creations: 98, remixes: 250, avatar: 'https://i.pravatar.cc/40?u=antics' },
    { rank: 3, name: 'VectorVixen', creations: 150, remixes: 180, avatar: 'https://i.pravatar.cc/40?u=vixen' },
    { rank: 4, name: 'DesignDroid', creations: 80, remixes: 200, avatar: 'https://i.pravatar.cc/40?u=droid' },
    { rank: 5, name: 'StaticSpark', creations: 110, remixes: 150, avatar: 'https://i.pravatar.cc/40?u=spark' },
];

export default function LeaderboardPage() {
    const getRankColor = (rank: number) => {
        if (rank === 1) return 'text-yellow-400';
        if (rank === 2) return 'text-gray-400';
        if (rank === 3) return 'text-yellow-600';
        return 'text-gray-500';
    };

    return (
        <div className="p-4 md:p-8 animate-fade-in">
            <header className="mb-8">
                <h1 className="text-h1 font-bold font-headline flex items-center gap-3">
                    <Icon name="Trophy" /> Creator Leaderboard
                </h1>
                <p className="text-muted-foreground mt-1">See who's leading the creative charge this week.</p>
            </header>
            
            <Card>
                <CardContent className="p-0">
                    <div className="space-y-4">
                        {leaderboardData.map((user, index) => (
                            <motion.div
                                key={user.name}
                                className="flex items-center p-4 border-b last:border-b-0 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <div className="flex items-center gap-4 w-1/3">
                                    <span className={`text-2xl font-bold w-8 text-center ${getRankColor(user.rank)}`}>{user.rank}</span>
                                    <Avatar>
                                        <AvatarImage src={user.avatar} />
                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-semibold">{user.name}</span>
                                </div>
                                <div className="w-1/3 flex items-center justify-center gap-6 text-sm">
                                    <div className="text-center">
                                        <p className="font-bold text-lg">{user.creations}</p>
                                        <p className="text-gray-500 dark:text-gray-400 text-xs">Creations</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-lg">{user.remixes}</p>
                                        <p className="text-gray-500 dark:text-gray-400 text-xs">Remixes</p>
                                    </div>
                                </div>
                                <div className="w-1/3 flex justify-end">
                                    <Link href="/profile" passHref>
                                        <Button variant="outline" size="sm">View Profile</Button>
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
