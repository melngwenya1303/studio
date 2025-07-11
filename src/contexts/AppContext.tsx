
'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Creation, User, GalleryItem } from '@/lib/types';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';
import { getFirestore, collection, addDoc, query, where, serverTimestamp, doc, getDoc, setDoc, orderBy, limit, startAfter, getDocs, DocumentData, QueryDocumentSnapshot, updateDoc, increment } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

const CREATIONS_PAGE_SIZE = 8;
const GALLERY_PAGE_SIZE = 8;

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
  galleryItems: GalleryItem[];
  fetchMoreGalleryItems: () => void;
  hasMoreGalleryItems: boolean;
  isLoadingGalleryItems: boolean;
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

  const [lastVisibleCreation, setLastVisibleCreation] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMoreCreations, setHasMoreCreations] = useState(true);
  const [isLoadingCreations, setIsLoadingCreations] = useState(false);

  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [lastVisibleGalleryItem, setLastVisibleGalleryItem] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMoreGalleryItems, setHasMoreGalleryItems] = useState(true);
  const [isLoadingGalleryItems, setIsLoadingGalleryItems] = useState(false);

  const fetchInitialCreations = useCallback(async (userId: string) => {
    if (!userId) return;

    setIsLoadingCreations(true);
    const creationsQuery = query(
        collection(db, "creations"), 
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(CREATIONS_PAGE_SIZE)
    );
    
    try {
        const documentSnapshots = await getDocs(creationsQuery);
        const userCreations: Creation[] = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as Creation));
        
        setCreations(userCreations);
        const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];
        setLastVisibleCreation(lastVisible || null);
        setHasMoreCreations(documentSnapshots.docs.length === CREATIONS_PAGE_SIZE);
    } catch (error) {
        console.error("Error fetching initial creations:", error);
    } finally {
        setIsLoadingCreations(false);
    }
  }, [db]);

  const fetchInitialGalleryItems = useCallback(async () => {
    setIsLoadingGalleryItems(true);
    const galleryQuery = query(
        collection(db, "gallery"),
        orderBy("likes", "desc"),
        limit(GALLERY_PAGE_SIZE)
    );
    
    try {
        const documentSnapshots = await getDocs(galleryQuery);
        const items = documentSnapshots.docs.map(doc => ({ ...doc.data() } as GalleryItem));
        
        setGalleryItems(items);
        const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];
        setLastVisibleGalleryItem(lastVisible || null);
        setHasMoreGalleryItems(documentSnapshots.docs.length === GALLERY_PAGE_SIZE);
    } catch (error) {
        console.error("Error fetching initial gallery items:", error);
    } finally {
        setIsLoadingGalleryItems(false);
    }
  }, [db]);

  useEffect(() => {
    const auth = getAuth(firebaseApp);
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        let userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          const isDefaultAdmin = firebaseUser.email === 'admin@surfacestoryai.com';
          await setDoc(userDocRef, { 
              email: firebaseUser.email, 
              isAdmin: isDefaultAdmin,
              name: firebaseUser.displayName || firebaseUser.email,
              createdAt: serverTimestamp(),
              creationsCount: 0,
              remixesCount: 0,
              followers: 0,
              following: 0,
              bio: 'A new SurfaceStory creator.',
          });
          userDocSnap = await getDoc(userDocRef);
        }
        
        const userData = userDocSnap.data();
        const finalIsAdmin = userData?.isAdmin || false;
        
        const currentUser = { 
            uid: firebaseUser.uid, 
            email: firebaseUser.email, 
            name: userData?.name || firebaseUser.displayName 
        };
        
        setUser(currentUser);
        setIsAdmin(finalIsAdmin);
        fetchInitialCreations(firebaseUser.uid);
        
        if (galleryItems.length === 0) {
          fetchInitialGalleryItems();
        }

      } else {
        setUser(null);
        setIsAdmin(false);
        setCreations([]);
        setLastVisibleCreation(null);
        setHasMoreCreations(true);
        if (galleryItems.length === 0) {
            fetchInitialGalleryItems();
        }
      }
    });
    
    return unsubscribe;
  }, [db, fetchInitialCreations, fetchInitialGalleryItems, galleryItems.length]);

  const fetchMoreCreations = useCallback(async () => {
    const userId = user?.uid;
    if (!userId || !lastVisibleCreation || !hasMoreCreations || isLoadingCreations) return;

    setIsLoadingCreations(true);
    const creationsQuery = query(
        collection(db, "creations"), 
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        startAfter(lastVisibleCreation),
        limit(CREATIONS_PAGE_SIZE)
    );

    try {
        const documentSnapshots = await getDocs(creationsQuery);
        const newCreations: Creation[] = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as Creation));
        
        setCreations(prev => [...prev, ...newCreations]);
        const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];
        setLastVisibleCreation(lastVisible || null);
        setHasMoreCreations(documentSnapshots.docs.length === CREATIONS_PAGE_SIZE);
    } catch (error) {
        console.error("Error fetching more creations:", error);
    } finally {
        setIsLoadingCreations(false);
    }
  }, [user, db, lastVisibleCreation, hasMoreCreations, isLoadingCreations]);

  const addCreation = useCallback(async (creationData: Omit<Creation, 'id' | 'createdAt'>) => {
    const userId = user?.uid;
    if (!userId) throw new Error("You must be logged in to save a creation.");
    
    const imageId = crypto.randomUUID();
    const storageRef = ref(storage, `creations/${userId}/${imageId}.png`);
    
    let uploadURL = creationData.url;
    if (creationData.url.startsWith('data:')) {
      try {
        const uploadResult = await uploadString(storageRef, creationData.url, 'data_url');
        uploadURL = await getDownloadURL(uploadResult.ref);
      } catch (error) {
        console.error("Error uploading image to storage:", error);
        throw new Error("Could not save image to cloud storage.");
      }
    }
    
    const creationPayload = {
      ...creationData,
      url: uploadURL, 
      userId: userId,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, "creations"), creationPayload);
    
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
        creationsCount: increment(1)
    });

    const newCreation = {
        id: docRef.id,
        ...creationPayload,
        createdAt: new Date(),
    } as Creation;

    setCreations(prev => [newCreation, ...prev]);

    return newCreation;
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
    setCart([newCartItem]);
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const fetchMoreGalleryItems = useCallback(async () => {
      if (!lastVisibleGalleryItem || !hasMoreGalleryItems) return;
      setIsLoadingGalleryItems(true);
      const galleryQuery = query(
          collection(db, "gallery"),
          orderBy("likes", "desc"),
          startAfter(lastVisibleGalleryItem),
          limit(GALLERY_PAGE_SIZE)
      );

      try {
        const documentSnapshots = await getDocs(galleryQuery);
        const newItems: GalleryItem[] = documentSnapshots.docs.map(doc => ({ ...doc.data() } as GalleryItem));

        setGalleryItems(prev => [...prev, ...newItems]);
        const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];
        setLastVisibleGalleryItem(lastVisible || null);
        setHasMoreGalleryItems(documentSnapshots.docs.length === GALLERY_PAGE_SIZE);
      } catch(error) {
          console.error("Error fetching more gallery items:", error);
      } finally {
        setIsLoadingGalleryItems(false);
      }
  }, [db, lastVisibleGalleryItem, hasMoreGalleryItems]);


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
    isLoadingCreations,
    galleryItems,
    fetchMoreGalleryItems,
    hasMoreGalleryItems,
    isLoadingGalleryItems,
  }), [user, isAdmin, creations, addCreation, startRemix, remixData, clearRemixData, cart, addToCart, clearCart, fetchMoreCreations, hasMoreCreations, isLoadingCreations, galleryItems, fetchMoreGalleryItems, hasMoreGalleryItems, isLoadingGalleryItems]);

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
