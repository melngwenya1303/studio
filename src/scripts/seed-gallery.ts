
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { GALLERY_SEED_DATA } from '../lib/gallery-data';

// IMPORTANT: Replace with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBPp07PuQ7-Y4ZHecsWJNPjQaZ7wmHUsTQ",
  authDomain: "context-intelligence.firebaseapp.com",
  projectId: "context-intelligence",
  storageBucket: "context-intelligence.appspot.com",
  messagingSenderId: "702465558183",
  appId: "1:702465558183:web:76df1ac90c9e7d82ea3d82",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedGallery() {
    const galleryCollectionRef = collection(db, 'gallery');
    const batch = writeBatch(db);

    console.log('Starting to seed gallery data...');

    GALLERY_SEED_DATA.forEach(item => {
        // Use the numeric ID from the seed data as the document ID string
        const docRef = doc(galleryCollectionRef, item.id.toString());
        batch.set(docRef, item);
    });

    try {
        await batch.commit();
        console.log(`Successfully seeded ${GALLERY_SEED_DATA.length} gallery items.`);
    } catch (error) {
        console.error('Error seeding gallery data:', error);
    }
}

// To run this script:
// 1. Make sure you have ts-node installed (`npm install -g ts-node`)
// 2. Run the command `ts-node src/scripts/seed-gallery.ts` from your project root.
seedGallery().then(() => {
    console.log('Seeding complete. Exiting.');
    process.exit(0);
});
