import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getUserProfile, createUserProfile } from '../services/storage';
import { getLinkedProviders } from '../services/auth';
import { UserProfile } from '../types';

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    isAuthenticated: boolean;
    needsOnboarding: boolean;
    refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userProfile: null,
    loading: true,
    isAuthenticated: false,
    needsOnboarding: false,
    refreshUserProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const loadUserProfile = async (firebaseUser: User) => {
        try {
            let profile = await getUserProfile(firebaseUser.uid);

            // If no profile exists, create one
            if (!profile) {
                const linkedProviders = getLinkedProviders(firebaseUser);
                profile = await createUserProfile(
                    firebaseUser.uid,
                    firebaseUser.email || '',
                    linkedProviders
                );
            }

            setUserProfile(profile);
        } catch (error) {
            console.error('Error loading user profile:', error);
            setUserProfile(null);
        }
    };

    const refreshUserProfile = async () => {
        if (user) {
            await loadUserProfile(user);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                await loadUserProfile(currentUser);
            } else {
                setUserProfile(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const isAuthenticated = !!user;
    const needsOnboarding = isAuthenticated && userProfile !== null && !userProfile.onboardingComplete;

    const value = {
        user,
        userProfile,
        loading,
        isAuthenticated,
        needsOnboarding,
        refreshUserProfile,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
