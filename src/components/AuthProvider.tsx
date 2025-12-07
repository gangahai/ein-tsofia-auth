'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';
import { UserProfile } from '@/types/types';

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch user profile from Firestore
    const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
        try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
                return userDoc.data() as UserProfile;
            }
            return null;
        } catch (error: any) {
            // Silently handle offline mode - this is expected behavior
            if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
                console.warn('⚠️ Firestore offline - skipping profile fetch');
            } else {
                console.error('Error fetching user profile:', error);
            }
            return null;
        }
    };

    // Create initial user profile on first login
    const createUserProfile = async (user: User): Promise<UserProfile | null> => {
        const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            userType: null,
            privacyPolicyAccepted: true, // Accepted during login
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        try {
            await setDoc(doc(db, 'users', user.uid), newProfile);
            return newProfile;
        } catch (error) {
            console.error('Error creating user profile:', error);
            // If offline, we might want to return the profile anyway so the UI can work
            // or return null if strict consistency is needed. 
            // Returning the profile allows the user to proceed even if saving fails temporarily.
            return newProfile;
        }
    };

    // Refresh user profile from Firestore
    const refreshUserProfile = async () => {
        if (user) {
            const profile = await fetchUserProfile(user.uid);
            setUserProfile(profile);
        }
    };

    // Listen to auth state changes
    useEffect(() => {
        // Set a timeout to prevent infinite loading
        const timeout = setTimeout(() => {
            console.warn('Auth state check timed out, setting loading to false');
            setLoading(false);
        }, 5000); // 5 seconds timeout

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            // Clear the initial safety timeout as we have a response from Auth
            clearTimeout(timeout);

            setUser(user);

            if (user) {
                // Create a promise that rejects after 3 seconds
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
                );

                try {
                    // Race between fetching profile and timeout
                    await Promise.race([
                        (async () => {
                            // Check if user profile exists
                            let profile = await fetchUserProfile(user.uid);

                            // Create profile if it doesn't exist
                            if (!profile) {
                                profile = await createUserProfile(user);
                            }

                            setUserProfile(profile);
                        })(),
                        timeoutPromise
                    ]);
                } catch (error) {
                    console.warn('Profile load timed out or failed, proceeding without profile:', error);
                    // We still have the user, so we can proceed
                }
            } else {
                setUserProfile(null);
            }

            setLoading(false);
        });

        return () => {
            clearTimeout(timeout);
            unsubscribe();
        };
    }, []);

    // Sign in with Google using popup
    const signInWithGoogle = async () => {
        if (!googleProvider) {
            throw new Error('Google authentication is not configured');
        }
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error('Error signing in with Google:', error);
            throw error;
        }
    };

    // Sign out
    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                userProfile,
                loading,
                signInWithGoogle,
                signOut,
                refreshUserProfile,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
