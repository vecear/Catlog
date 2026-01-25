import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "./firebase";

// Allowlist of emails that can sign in
// In a production app, this might be in Firestore, but hardcoding is safer/easier for a personal app
// User Mapping
export const USER_MAPPING: Record<string, string> = {
    "vecear@gmail.com": "CCL",
    "feina0627@gmail.com": "RURU"
};

export const ALLOWED_EMAILS = [
    "vecear@gmail.com",
    "feina0627@gmail.com",
];

// Google Provider Setup
const provider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Basic check purely for frontend UX (Backend rules are the real security)
        // We will do the stricter check in the AuthContext or PrivateRoute
        return user;
    } catch (error) {
        console.error("Error signing in with Google", error);
        throw error;
    }
};

export const logout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out", error);
        throw error;
    }
};
