
'use server';

import { getFirestore, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';

/**
 * Finds a user profile by their email address.
 * This is a secure server-side action.
 * @param email The email address to search for.
 * @returns The user's profile data or null if not found.
 */
export async function getUserProfileByEmail(email: string) {
    if (!email) {
        return null;
    }

    try {
        const db = getFirestore(firebaseApp);
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        return {
            id: userDoc.id,
            email: userData.email,
            isAdmin: userData.isAdmin || false,
        };
    } catch (error) {
        console.error("Error fetching user by email:", error);
        // We throw an error so the client can handle it, but for security,
        // we could also just return null.
        throw new Error("Could not check user existence.");
    }
}
