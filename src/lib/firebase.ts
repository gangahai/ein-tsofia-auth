// Firebase configuration and initialization
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
};

// Validate that all required config values are present
const missingKeys = Object.entries(firebaseConfig)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

let app: any = null;
let auth: any = null;
let db: any = null;

if (missingKeys.length > 0) {
    console.warn('⚠️ Firebase configuration incomplete - running in OFFLINE/MOCK mode');
    console.warn('   Missing keys:', missingKeys.join(', '));
    console.warn('   To enable Firebase, add these to your .env.local file');
} else {
    try {
        // Initialize Firebase only if not already initialized
        app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

        // Initialize Firebase services
        auth = getAuth(app);
        db = getFirestore(app);

        console.log('✅ Firebase initialized successfully');
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        console.warn('   Running in OFFLINE/MOCK mode');
    }
}

// Export services (may be null if Firebase is not configured)
export { auth, db };

// Configure Google provider with specific parameters (only if auth is available)
export const googleProvider = auth ? new GoogleAuthProvider() : null;
if (googleProvider) {
    googleProvider.setCustomParameters({
        prompt: 'select_account', // Always show account selector
    });
}

export default app;
