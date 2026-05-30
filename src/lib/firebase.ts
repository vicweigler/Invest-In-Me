import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, memoryLocalCache } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Persistent cache = offline support. Fall back to memory if IndexedDB is
// unavailable (private browsing, Samsung Internet restrictions, etc.).
let db: ReturnType<typeof initializeFirestore>;
try {
  db = initializeFirestore(app, { localCache: persistentLocalCache() });
} catch {
  db = initializeFirestore(app, { localCache: memoryLocalCache() });
}
export { db };
