
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Creation, User, GalleryItem } from '@/lib/types';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';

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
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false); // Default to false for real auth
  const [creations, setCreations] = useState<Creation[]>([]);
  const [remixData, setRemixData] = useState<Partial<Creation & GalleryItem> | null>(null);
  const [cart, setCart] = useState<Creation[]>([]);

  useEffect(() => {
    const auth = getAuth(firebaseApp);
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({ uid: firebaseUser.uid, isAnonymous: firebaseUser.isAnonymous });
        // In a real app, you'd check for admin role from a custom claim or Firestore
        setIsAdmin(firebaseUser.email === 'admin@surfacestory.com'); 
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);


  const addCreation = useCallback((creationData: Omit<Creation, 'id' | 'createdAt'>) => {
    const newCreation: Creation = {
      ...creationData,
      id: crypto.randomUUID(),
      createdAt: new Date(),
    };
    setCreations(prev => [newCreation, ...prev]);
    return newCreation;
  }, []);
  
  const startRemix = useCallback((item: Partial<Creation & GalleryItem>) => {
    setRemixData(item);
    router.push('/design-studio');
  }, [router]);

  const clearRemixData = useCallback(() => {
    setRemixData(null);
  }, []);

  const addToCart = useCallback((item: Omit<Creation, 'id' | 'createdAt'>) => {
    const newCartItem: Creation = {
        ...item,
        id: crypto.randomUUID(),
        createdAt: new Date(),
    };
    // For now, the cart only holds one item for a simple checkout
    setCart([newCartItem]);
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const contextValue = useMemo(() => ({
    user,
    isAdmin,
    creations,
    addCreation,
    startRemix,
    remixData,
    clearRemixData,
    cart,
    addToCart,
    clearCart
  }), [user, isAdmin, creations, addCreation, startRemix, remixData, clearRemixData, cart, addToCart, clearCart]);

  return (
    <AppContext.Provider value={contextValue}>
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
