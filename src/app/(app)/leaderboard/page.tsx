
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/shared/icon';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';

type LeaderboardUser = {
    id: string;
    name: string;
    creationsCount: number;
    remixesCount: number;
    avatar: string;
};

export default function LeaderboardPage() {
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setIsLoading(true);
            const db = getFirestore(firebaseApp);
            const usersRef = collection(db, 'users');
            const q = query(usersRef, orderBy('creationsCount', 'desc'), limit(10));
            
            try {
                const querySnapshot = await getDocs(q);
                const users: LeaderboardUser[] = querySnapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        name: data.name || data.email,
                        creationsCount: data.creationsCount || Math.floor(Math.random() * 100), // Add mock data for testing
                        remixesCount: data.remixesCount || Math.floor(Math.random() * 50), // Add mock data for testing
                        avatar: `https://i.pravatar.cc/40?u=${doc.id}`,
                    };
                });
                // Sort client-side since our counts are mocked for now
                users.sort((a, b) => (b.creationsCount + b.remixesCount) - (a.creationsCount + a.remixesCount));
                setLeaderboardData(users);
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    const getRankColor = (rank: number) => {
        if (rank === 1) return 'text-yellow-400';
        if (rank === 2) return 'text-gray-400';
        if (rank === 3) return 'text-yellow-600';
        return 'text-muted-foreground';
    };

    const LeaderboardSkeleton = () => (
        <Card>
            <CardContent className="p-0">
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                         <div key={i} className="flex items-center p-4 border-b last:border-b-0 dark:border-border/50">
                            <div className="flex items-center gap-4 w-1/3">
                                <Skeleton className="h-8 w-8" />
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <Skeleton className="h-6 w-24" />
                            </div>
                            <div className="w-1/3 flex items-center justify-center gap-6">
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="h-8 w-16" />
                            </div>
                            <div className="w-1/3 flex justify-end">
                                <Skeleton className="h-8 w-20" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="p-4 md:p-8 animate-fade-in">
            <header className="mb-8">
                <h1 className="text-h1 font-headline flex items-center gap-3">
                    <Icon name="Trophy" /> Creator Leaderboard
                </h1>
                <p className="text-muted-foreground mt-1 text-body">See who's leading the creative charge this week.</p>
            </header>
            
            {isLoading ? <LeaderboardSkeleton /> : (
                <Card>
                    <CardContent className="p-0">
                        <div className="space-y-4">
                            {leaderboardData.map((user, index) => (
                                <motion.div
                                    key={user.id}
                                    className="flex items-center p-4 border-b last:border-b-0 dark:border-border/50 hover:bg-muted/50 transition-colors"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                >
                                    <div className="flex items-center gap-4 w-1/3">
                                        <span className={`text-2xl font-bold w-8 text-center ${getRankColor(index + 1)}`}>{index + 1}</span>
                                        <Avatar>
                                            <AvatarImage src={user.avatar} />
                                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-semibold">{user.name}</span>
                                    </div>
                                    <div className="w-1/3 flex items-center justify-center gap-6 text-sm">
                                        <div className="text-center">
                                            <p className="font-bold text-lg">{user.creationsCount}</p>
                                            <p className="text-muted-foreground text-xs">Creations</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="font-bold text-lg">{user.remixesCount}</p>
                                            <p className="text-muted-foreground text-xs">Remixes</p>
                                        </div>
                                    </div>
                                    <div className="w-1/3 flex justify-end">
                                        <Link href={`/profile/${user.id}`} passHref>
                                            <Button variant="outline" size="sm">View Profile</Button>
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
             {leaderboardData.length === 0 && !isLoading && (
                <Card className="text-center py-20">
                    <Icon name="Trophy" className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h4 className="text-xl font-semibold mb-2">The race is on!</h4>
                    <p className="text-muted-foreground text-body">No creators on the leaderboard yet. Be the first!</p>
                </Card>
            )}
        </div>
    );
}
