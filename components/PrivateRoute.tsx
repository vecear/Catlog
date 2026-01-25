import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface PrivateRouteProps {
    children: React.ReactNode;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
    const { user, loading, isAuthorized } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    // If not logged in, redirect to login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // If logged in but not authorized (not in whitelist), show access denied (or stay on login page which handles it)
    // Actually, LoginPage handles the "Access Denied" view if user is logged in. 
    // So validation logic:
    // 1. Not logged in -> Login Page
    // 2. Logged in + Not Authorized -> Login Page (which will show "Access Denied")
    // 3. Logged in + Authorized -> Render Children

    if (!isAuthorized) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};
