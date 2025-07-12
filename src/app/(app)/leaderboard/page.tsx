
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '@/components/shared/icon';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getFirestore, collection, query, limit, getDocs, orderBy } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type LeaderboardUser = {
    id: string;
    name: string;
    creationsCount: number;
    remixesCount: number;
    likes: number;
    rank: number;
    previousRank?: number;
    avatar: string;
};

type LeaderboardType = 'weekly' | 'allTime' | 'rising';

const MOCK_TOTAL_CREATORS = 250; // For percentile calculation

const generateMockData = (type: LeaderboardType): LeaderboardUser[] => {
    const baseData = [
        { id: 'user1', name: 'PixelPioneer', creations: 128, remixes: 45, likes: 4300 },
        { id: 'user2', name: 'ArtfulAntics', creations: 112, remixes: 60, likes: 3800 },
        { id: 'user3', name: 'VectorVixen', creations: 98, remixes: 30, likes: 5100 },
        { id: 'user4', name: 'GigaBrush', creations: 85, remixes: 72, likes: 2500 },
        { id: 'user5', name: 'SereneScenes', creations: 70, remixes: 15, likes: 6200 },
        { id: 'user6', name: 'ChronoCraft', creations: 65, remixes: 55, likes: 3100 },
        { id: 'user7', name: 'DreamWeaver', creations: 50, remixes: 22, likes: 4800 },
        { id: 'user8', name: 'NeonNomad', creations: 42, remixes: 80, likes: 1900 },
    ];
    
    // Slightly randomize for different tabs
    return baseData.map((user, index) => ({
        ...user,
        id: `${user.id}_${type}`,
        creationsCount: user.creations + Math.floor(Math.random() * 10),
        remixesCount: user.remixes + Math.floor(Math.random() * 10),
        likes: user.likes + Math.floor(Math.random() * 500),
        rank: index + 1,
        previousRank: index + 1 + Math.floor(Math.random() * 3) - 1, // -1, 0, or 1 change
        avatar: `https://i.pravatar.cc/40?u=${user.id}`,
    })).sort((a, b) => b.likes - a.likes);
};


export default function LeaderboardPage() {
    const [leaderboardData, setLeaderboardData] = useState<Record<LeaderboardType, LeaderboardUser[]>>({
        weekly: [],
        allTime: [],
        rising: [],
    });
    const [activeTab, setActiveTab] = useState<LeaderboardType>('weekly');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setIsLoading(true);
            // In a real app, you'd fetch data for each tab from different sources (e.g., Redis).
            // Here, we're mocking it.
            setTimeout(() => {
                setLeaderboardData({
                    weekly: generateMockData('weekly'),
                    allTime: generateMockData('allTime'),
                    rising: generateMockData('rising'),
                });
                setIsLoading(false);
            }, 800);
        };

        fetchLeaderboard();
    }, []);
    
    const getRankChange = (user: LeaderboardUser) => {
        if (!user.previousRank || user.rank === user.previousRank) return { change: 0, color: 'text-muted-foreground' };
        if (user.rank < user.previousRank) return { change: user.previousRank - user.rank, color: 'text-green-500' };
        return { change: user.previousRank - user.rank, color: 'text-destructive' };
    };

    const LeaderboardSkeleton = () => (
        <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
                 <div key={i} className="flex items-center space-x-4 bg-card border p-4 rounded-lg">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-grow">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-3 w-1/3" />
                    </div>
                    <div className="flex gap-8">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-16" />
                    </div>
                </div>
            ))}
        </div>
    );
    
    const currentData = leaderboardData[activeTab];

    return (
        <div className="p-4 md:p-8 animate-fade-in">
            <header className="mb-8">
                <h1 className="text-h1 font-headline flex items-center gap-3">
                    <Icon name="Trophy" /> Creator Leaderboards
                </h1>
                <p className="text-muted-foreground mt-1 text-body">See who's leading the creative charge on SurfaceStory.</p>
            </header>
            
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as LeaderboardType)} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="weekly"><Icon name="Zap" /> Top This Week</TabsTrigger>
                    <TabsTrigger value="allTime"><Icon name="Star" /> All-Time Legends</TabsTrigger>
                    <TabsTrigger value="rising"><Icon name="TrendingUp" /> Rising Stars</TabsTrigger>
                </TabsList>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {isLoading ? <LeaderboardSkeleton /> : (
                             <div className="space-y-2">
                                {currentData.map((user, index) => {
                                    const rankChange = getRankChange(user);
                                    const percentile = ((user.rank / MOCK_TOTAL_CREATORS) * 100).toFixed(1);
                                    
                                    return (
                                    <motion.div
                                        key={user.id}
                                        className="flex items-center p-3 bg-card border rounded-lg hover:bg-muted/50 transition-colors"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: index * 0.05 }}
                                    >
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="flex items-center gap-2 w-16 text-center">
                                                <span className="text-xl font-bold w-8">{user.rank}</span>
                                                <AnimatePresence>
                                                    {rankChange.change !== 0 && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 5 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className={cn("flex items-center text-xs", rankChange.color)}
                                                        >
                                                            <Icon name={rankChange.change > 0 ? 'ArrowUp' : 'ArrowDown'} className="w-3 h-3"/> 
                                                            {Math.abs(rankChange.change)}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                            <Avatar className="h-12 w-12">
                                                <AvatarImage src={user.avatar} />
                                                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <span className="font-semibold text-base">{user.name}</span>
                                                <p className="text-xs text-muted-foreground">Top {percentile}% of Creators</p>
                                            </div>
                                        </div>
                                        <div className="hidden md:flex flex-1 items-center justify-end gap-12 text-sm">
                                            <div className="text-center">
                                                <p className="font-bold text-lg">{user.likes.toLocaleString()}</p>
                                                <p className="text-muted-foreground text-xs">Likes</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="font-bold text-lg">{user.creationsCount}</p>
                                                <p className="text-muted-foreground text-xs">Creations</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="font-bold text-lg">{user.remixesCount}</p>
                                                <p className="text-muted-foreground text-xs">Remixes</p>
                                            </div>
                                        </div>
                                        <div className="flex-1 flex justify-end">
                                            <Link href={`/profile/${user.id.split('_')[0]}`} passHref>
                                                <Button variant="ghost" size="sm">View Profile</Button>
                                            </Link>
                                        </div>
                                    </motion.div>
                                )})}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </Tabs>

             {currentData.length === 0 && !isLoading && (
                <Card className="text-center py-20">
                    <Icon name="Trophy" className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h4 className="text-xl font-semibold mb-2">The race is on!</h4>
                    <p className="text-muted-foreground text-body">No creators on this leaderboard yet. Be the first!</p>
                </Card>
            )}
        </div>
    );
}
