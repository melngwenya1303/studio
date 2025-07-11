
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Creation, User, GalleryItem } from '@/lib/types';

interface AppContextType {
  user: User | null;
  isAdmin: boolean;
  creations: Creation[];
  addCreation: (creation: Omit<Creation, 'id' | 'createdAt'>) => Creation;
  startRemix: (item: Partial<Creation & GalleryItem>) => void;
  remixData: Partial<Creation & GalleryItem> | null;
  clearRemixData: () => void;
  cart: Creation[];
  addToCart: (item: Omit<Creation, 'id' | 'createdAt'>) => void;
  clearCart: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>({ uid: 'dev-user-01', isAnonymous: false });
  const [isAdmin, setIsAdmin] = useState(true);
  const [creations, setCreations] = useState<Creation[]>([]);
  const [remixData, setRemixData] = useState<Partial<Creation & GalleryItem> | null>(null);
  const [cart, setCart] = useState<Creation[]>([]);

  const addCreation = (creationData: Omit<Creation, 'id' | 'createdAt'>) => {
    const newCreation: Creation = {
      ...creationData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    setCreations(prev => [newCreation, ...prev]);
    return newCreation;
  };
  
  const startRemix = useCallback((item: Partial<Creation & GalleryItem>) => {
    setRemixData(item);
    router.push('/design-studio');
  }, [router]);

  const clearRemixData = useCallback(() => {
    setRemixData(null);
  }, []);

  const addToCart = (item: Omit<Creation, 'id' | 'createdAt'>) => {
    const newCartItem: Creation = {
        ...item,
        id: crypto.randomUUID(),
        createdAt: new Date(),
    };
    // For now, the cart only holds one item for a simple checkout
    setCart([newCartItem]);
    router.push('/checkout');
  };

  const clearCart = () => {
    setCart([]);
  }

  return (
    <AppContext.Provider value={{ user, isAdmin, creations, addCreation, startRemix, remixData, clearRemixData, cart, addToCart, clearCart }}>
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
