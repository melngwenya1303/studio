'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/shared/icon';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Creation } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

type ProfileUser = {
    id: string;
    name: string;
    email: string;
    bio: string;
    followers: number;
    following: number;
    creationsCount: number;
};

// Mock Bio
const MOCK_BIO = 'Digital artist exploring the intersection of dreams and code. Turning imagination into tangible surfaces.';


export default function ProfilePage({ params }: { params: { userId: string } }) {
    const { user: loggedInUser } = useApp();
    const router = useRouter();
    const db = useMemo(() => getFirestore(firebaseApp), []);

    const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
    const [userCreations, setUserCreations] = useState<Creation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProfileData = async () => {
            if (!params.userId) return;
            setIsLoading(true);

            try {
                // Fetch user data
                const userDocRef = doc(db, 'users', params.userId);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    const data = userDocSnap.data();
                    setProfileUser({
                        id: userDocSnap.id,
                        name: data.name || data.email,
                        email: data.email,
                        bio: data.bio || MOCK_BIO,
                        followers: data.followers || 0,
                        following: data.following || 0,
                        creationsCount: data.creationsCount || 0,
                    });
                } else {
                   // Handle user not found
                   setProfileUser(null);
                }

                // Fetch user creations
                const creationsQuery = query(
                    collection(db, "creations"), 
                    where("userId", "==", params.userId),
                    orderBy("createdAt", "desc"),
                    limit(12)
                );
                const creationsSnapshot = await getDocs(creationsQuery);
                const creationsData = creationsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Creation));
                setUserCreations(creationsData);

            } catch (error) {
                console.error("Error fetching profile data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfileData();
    }, [params.userId, db]);

    const ProfileSkeleton = () => (
         <div className="p-4 md:p-8 space-y-8">
            <Card className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <Skeleton className="w-24 h-24 rounded-full" />
                    <div className="flex-grow space-y-3">
                        <Skeleton className="h-8 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                        <div className="flex gap-6">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                    </div>
                </div>
            </Card>
            <div className="space-y-4">
                <Skeleton className="h-8 w-1/4" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="aspect-square" />)}
                </div>
            </div>
        </div>
    );

    if (isLoading) {
        return <ProfileSkeleton />;
    }

    if (!profileUser) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Icon name="UserCircle" className="w-24 h-24 text-muted-foreground mb-6" />
                <h1 className="text-h1 font-headline">User Not Found</h1>
                <p className="text-muted-foreground mt-2">The profile you are looking for does not exist.</p>
            </div>
        );
    }
    
    const userAvatar = `https://i.pravatar.cc/150?u=${profileUser.id}`;
    const isOwnProfile = loggedInUser?.uid === profileUser.id;

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
                            <AvatarImage src={userAvatar} />
                            <AvatarFallback>{profileUser.name ? profileUser.name.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-grow text-center md:text-left">
                            <h1 className="text-h1 font-headline">{profileUser.name}</h1>
                            <p className="text-muted-foreground mt-1 text-body">{profileUser.bio}</p>
                            <div className="flex justify-center md:justify-start items-center gap-6 mt-4 text-sm">
                                <div><span className="font-bold">{userCreations.length}</span> Creations</div>
                                <div><span className="font-bold">{profileUser.followers}</span> Followers</div>
                                <div><span className="font-bold">{profileUser.following}</span> Following</div>
                            </div>
                        </div>
                        <div className="flex-shrink-0">
                            {isOwnProfile ? (
                                <Button variant="outline" onClick={() => router.push('/settings')}><Icon name="Settings" /> Edit Profile</Button>
                            ) : (
                                <Button><Icon name="UserPlus" /> Follow</Button>
                            )}
                        </div>
                    </motion.div>
                </Card>
            </header>

            <div>
                <h2 className="text-h2 font-headline mb-4">{isOwnProfile ? 'My' : `${profileUser.name}'s`} Creations</h2>
                {userCreations.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {userCreations.map((creation, i) => (
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
                        <h4 className="text-xl font-semibold mb-2">No creations yet!</h4>
                         <p className="text-muted-foreground mb-6 text-body">
                           {isOwnProfile ? "Time to make your first masterpiece in the Design Studio!" : "This creator hasn't published any designs yet."}
                        </p>
                        {isOwnProfile && (
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              <Button onClick={() => router.push('/design-studio')} size="lg">Start Designing</Button>
                            </motion.div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
