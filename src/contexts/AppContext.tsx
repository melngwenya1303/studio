
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Creation, User, GalleryItem } from '@/lib/types';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';
import { getFirestore, collection, addDoc, query, where, serverTimestamp, onSnapshot, doc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

interface AppContextType {
  user: User | null;
  isAdmin: boolean;
  creations: Creation[];
  addCreation: (creation: Omit<Creation, 'id' | 'createdAt'>) => Promise<Creation>;
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [creations, setCreations] = useState<Creation[]>([]);
  const [remixData, setRemixData] = useState<Partial<Creation & GalleryItem> | null>(null);
  const [cart, setCart] = useState<Creation[]>([]);
  const db = getFirestore(firebaseApp);
  const storage = getStorage(firebaseApp);

  useEffect(() => {
    const auth = getAuth(firebaseApp);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        let finalIsAdmin = false;
        if (userDoc.exists() && userDoc.data().isAdmin) {
          finalIsAdmin = true;
        } else if (firebaseUser.email === 'admin@surfacestory.com') {
           finalIsAdmin = true;
        }
        
        setUser({ uid: firebaseUser.uid, isAnonymous: firebaseUser.isAnonymous, email: firebaseUser.email });
        setIsAdmin(finalIsAdmin); 

      } else {
        setUser(null);
        setIsAdmin(false);
        setCreations([]); // Clear creations on logout
      }
    });

    return () => unsubscribe();
  }, [db]);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, "creations"), where("userId", "==", user.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userCreations: Creation[] = [];
        querySnapshot.forEach((doc) => {
          userCreations.push({ id: doc.id, ...doc.data() } as Creation);
        });
        // Sort by creation date, newest first
        userCreations.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setCreations(userCreations);
      });
      return () => unsubscribe();
    }
  }, [user, db]);


  const addCreation = useCallback(async (creationData: Omit<Creation, 'id' | 'createdAt'>) => {
    if (!user) throw new Error("You must be logged in to save a creation.");
    
    // 1. Upload image to Cloud Storage
    const imageId = crypto.randomUUID();
    const storageRef = ref(storage, `creations/${user.uid}/${imageId}.png`);
    // The `url` from the creation data is a data URI (e.g., "data:image/png;base64,...")
    const uploadResult = await uploadString(storageRef, creationData.url, 'data_url');
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    // 2. Create Firestore document with the storage URL
    const creationPayload = {
      ...creationData,
      url: downloadURL, // Overwrite with the public storage URL
      userId: user.uid,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "creations"), creationPayload);
    
    return {
      ...creationData,
      id: docRef.id,
      url: downloadURL,
      createdAt: new Date(), // Return a client-side date for immediate UI update
    };
  }, [user, db, storage]);
  
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
