import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    linkWithPopup,
    linkWithCredential,
    EmailAuthProvider,
    fetchSignInMethodsForEmail,
    reauthenticateWithCredential,
    updateEmail,
    updatePassword,
    verifyBeforeUpdateEmail,
    User
} from "firebase/auth";
import { auth } from "./firebase";

// Google Provider Setup
const googleProvider = new GoogleAuthProvider();

// Google Sign In
export const signInWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Error signing in with Google", error);
        throw error;
    }
};

// Email/Password Registration
export const registerWithEmail = async (email: string, password: string) => {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        return result.user;
    } catch (error: any) {
        console.error("Error registering with email", error);
        // Provide more user-friendly error messages
        if (error.code === 'auth/email-already-in-use') {
            throw new Error('此電子郵件已被使用');
        } else if (error.code === 'auth/weak-password') {
            throw new Error('密碼強度不足，請使用至少 6 個字元');
        } else if (error.code === 'auth/invalid-email') {
            throw new Error('電子郵件格式無效');
        }
        throw error;
    }
};

// Email/Password Sign In
export const signInWithEmail = async (email: string, password: string) => {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
    } catch (error: any) {
        console.error("Error signing in with email", error);
        if (error.code === 'auth/user-not-found') {
            throw new Error('找不到此帳號');
        } else if (error.code === 'auth/wrong-password') {
            throw new Error('密碼錯誤');
        } else if (error.code === 'auth/invalid-email') {
            throw new Error('電子郵件格式無效');
        } else if (error.code === 'auth/invalid-credential') {
            throw new Error('帳號或密碼錯誤');
        }
        throw error;
    }
};

// Link Google account to existing email/password account
export const linkGoogleAccount = async (user: User) => {
    try {
        const result = await linkWithPopup(user, googleProvider);
        return result.user;
    } catch (error: any) {
        console.error("Error linking Google account", error);
        if (error.code === 'auth/credential-already-in-use') {
            throw new Error('此 Google 帳號已綁定其他帳戶');
        } else if (error.code === 'auth/provider-already-linked') {
            throw new Error('此帳號已綁定 Google');
        }
        throw error;
    }
};

// Link email/password to existing Google account
export const linkEmailPassword = async (user: User, email: string, password: string) => {
    try {
        const credential = EmailAuthProvider.credential(email, password);
        const result = await linkWithCredential(user, credential);
        return result.user;
    } catch (error: any) {
        console.error("Error linking email/password", error);
        if (error.code === 'auth/email-already-in-use') {
            throw new Error('此電子郵件已被使用');
        } else if (error.code === 'auth/weak-password') {
            throw new Error('密碼強度不足，請使用至少 6 個字元');
        } else if (error.code === 'auth/provider-already-linked') {
            throw new Error('此帳號已設定電子郵件登入');
        }
        throw error;
    }
};

// Check which sign-in methods are available for an email
export const getSignInMethodsForEmail = async (email: string) => {
    try {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        return methods;
    } catch (error) {
        console.error("Error fetching sign-in methods", error);
        return [];
    }
};

// Get linked providers for current user
export const getLinkedProviders = (user: User): ('google' | 'password')[] => {
    const providers: ('google' | 'password')[] = [];
    user.providerData.forEach(provider => {
        if (provider.providerId === 'google.com') {
            providers.push('google');
        } else if (provider.providerId === 'password') {
            providers.push('password');
        }
    });
    return providers;
};

// Re-authenticate user with email/password (required before sensitive operations)
export const reauthenticateWithPassword = async (user: User, currentPassword: string) => {
    try {
        const email = user.email;
        if (!email) {
            throw new Error('找不到電子郵件');
        }
        const credential = EmailAuthProvider.credential(email, currentPassword);
        await reauthenticateWithCredential(user, credential);
    } catch (error: any) {
        console.error("Error re-authenticating", error);
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            throw new Error('目前密碼錯誤');
        }
        throw error;
    }
};

// Update user's email (requires re-authentication)
export const updateUserEmail = async (user: User, newEmail: string, currentPassword: string) => {
    try {
        // Re-authenticate first
        await reauthenticateWithPassword(user, currentPassword);
        // Update email
        await updateEmail(user, newEmail);
    } catch (error: any) {
        console.error("Error updating email", error);
        if (error.code === 'auth/email-already-in-use') {
            throw new Error('此電子郵件已被使用');
        } else if (error.code === 'auth/invalid-email') {
            throw new Error('電子郵件格式無效');
        } else if (error.code === 'auth/requires-recent-login') {
            throw new Error('請重新登入後再試');
        }
        throw error;
    }
};

// Update user's password (requires re-authentication)
export const updateUserPassword = async (user: User, currentPassword: string, newPassword: string) => {
    try {
        // Re-authenticate first
        await reauthenticateWithPassword(user, currentPassword);
        // Update password
        await updatePassword(user, newPassword);
    } catch (error: any) {
        console.error("Error updating password", error);
        if (error.code === 'auth/weak-password') {
            throw new Error('新密碼強度不足，請使用至少 6 個字元');
        } else if (error.code === 'auth/requires-recent-login') {
            throw new Error('請重新登入後再試');
        }
        throw error;
    }
};

// Logout
export const logout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out", error);
        throw error;
    }
};
