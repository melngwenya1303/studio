'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Creation, User, GalleryItem } from '@/lib/types';

interface AppContextType {
  user: User | null;
  isAdmin: boolean;
  creations: Creation[];
  addCreation: (creation: Omit<Creation, 'id' | 'createdAt'>) => void;
  startRemix: (item: Creation | GalleryItem) => void;
  remixData: Creation | GalleryItem | null;
  clearRemixData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>({ uid: 'dev-user-01', isAnonymous: false });
  const [isAdmin, setIsAdmin] = useState(true);
  const [creations, setCreations] = useState<Creation[]>([]);
  const [remixData, setRemixData] = useState<Creation | GalleryItem | null>(null);

  const addCreation = (creationData: Omit<Creation, 'id' | 'createdAt'>) => {
    const newCreation: Creation = {
      ...creationData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    setCreations(prev => [newCreation, ...prev]);
  };
  
  const startRemix = useCallback((item: Creation | GalleryItem) => {
    setRemixData(item);
    router.push('/design-studio');
  }, [router]);

  const clearRemixData = useCallback(() => {
    setRemixData(null);
  }, []);

  return (
    <AppContext.Provider value={{ user, isAdmin, creations, addCreation, startRemix, remixData, clearRemixData }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
