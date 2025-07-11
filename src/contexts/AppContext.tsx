
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Creation, User, GalleryItem } from '@/lib/types';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';
import { getFirestore, collection, addDoc, query, where, serverTimestamp, onSnapshot, doc, getDoc, setDoc, orderBy, limit, startAfter, getDocs, DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

const CREATIONS_PAGE_SIZE = 8;

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
  fetchMoreCreations: () => void;
  hasMoreCreations: boolean;
  isLoadingCreations: boolean;
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

  // Pagination state
  const [lastVisibleCreation, setLastVisibleCreation] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMoreCreations, setHasMoreCreations] = useState(true);
  const [isLoadingCreations, setIsLoadingCreations] = useState(false);

  useEffect(() => {
    // Bypass login for development
    const adminUser = {
        uid: 'admin-bypass-uid',
        email: 'admin@surfacestoryai.com',
        name: 'Admin User',
    };
    setUser(adminUser);
    setIsAdmin(true);

    // The original auth logic is commented out to enforce the bypass
    /*
    const auth = getAuth(firebaseApp);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        let finalIsAdmin = false;
        if (userDocSnap.exists()) {
          finalIsAdmin = userDocSnap.data()?.isAdmin || false;
        } else {
          const isDefaultAdmin = firebaseUser.email === 'admin@surfacestoryai.com';
          const newUserPayload = {
            email: firebaseUser.email,
            isAdmin: isDefaultAdmin,
            name: firebaseUser.displayName || firebaseUser.email,
            createdAt: serverTimestamp(),
            creationsCount: 0,
            remixesCount: 0,
          };
          await setDoc(userDocRef, newUserPayload);
          finalIsAdmin = isDefaultAdmin;
        }
        
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email, name: firebaseUser.displayName });
        setIsAdmin(finalIsAdmin);
      } else {
        setUser(null);
        setIsAdmin(false);
        setCreations([]);
        setLastVisibleCreation(null);
        setHasMoreCreations(true);
      }
    });

    return () => unsubscribe();
    */
  }, [db]);

  const fetchInitialCreations = useCallback(async () => {
    // Use the bypassed admin user's UID for fetching data if no other user is set.
    const userId = user?.uid || 'admin-bypass-uid';
    if (!userId) return;


    setIsLoadingCreations(true);
    const creationsQuery = query(
        collection(db, "creations"), 
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(CREATIONS_PAGE_SIZE)
    );
    
    const documentSnapshots = await getDocs(creationsQuery);
    const userCreations: Creation[] = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as Creation));
    
    setCreations(userCreations);
    setLastVisibleCreation(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
    setHasMoreCreations(documentSnapshots.docs.length === CREATIONS_PAGE_SIZE);
    setIsLoadingCreations(false);
  }, [user, db]);

  useEffect(() => {
    // Reset and fetch initial creations when user changes
    setCreations([]);
    setLastVisibleCreation(null);
    setHasMoreCreations(true);
    if (user) {
        fetchInitialCreations();
    }
  }, [user, fetchInitialCreations]);

  const fetchMoreCreations = useCallback(async () => {
    const userId = user?.uid || 'admin-bypass-uid';
    if (!userId || !lastVisibleCreation || !hasMoreCreations) return;

    setIsLoadingCreations(true);
    const creationsQuery = query(
        collection(db, "creations"), 
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        startAfter(lastVisibleCreation),
        limit(CREATIONS_PAGE_SIZE)
    );

    const documentSnapshots = await getDocs(creationsQuery);
    const newCreations: Creation[] = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as Creation));
    
    setCreations(prev => [...prev, ...newCreations]);
    setLastVisibleCreation(documentSnapshots.docs[documentSnapshots.docs.length - 1]);
    setHasMoreCreations(documentSnapshots.docs.length === CREATIONS_PAGE_SIZE);
    setIsLoadingCreations(false);
  }, [user, db, lastVisibleCreation, hasMoreCreations]);


  const addCreation = useCallback(async (creationData: Omit<Creation, 'id' | 'createdAt'>) => {
    const userId = user?.uid || 'admin-bypass-uid';
    if (!userId) throw new Error("You must be logged in to save a creation.");
    
    const imageId = crypto.randomUUID();
    const storageRef = ref(storage, `creations/${userId}/${imageId}.png`);
    
    let uploadURL = creationData.url;
    if (creationData.url.startsWith('data:')) {
      const uploadResult = await uploadString(storageRef, creationData.url, 'data_url');
      uploadURL = await getDownloadURL(uploadResult.ref);
    }
    
    const creationPayload = {
      ...creationData,
      url: uploadURL, 
      userId: userId,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "creations"), creationPayload);
    
    fetchInitialCreations();

    return {
      ...creationData,
      id: docRef.id,
      url: uploadURL,
      createdAt: new Date(),
    };
  }, [user, db, storage, fetchInitialCreations]);
  
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
    clearCart,
    fetchMoreCreations,
    hasMoreCreations,
    isLoadingCreations
  }), [user, isAdmin, creations, addCreation, startRemix, remixData, clearRemixData, cart, addToCart, clearCart, fetchMoreCreations, hasMoreCreations, isLoadingCreations]);

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
