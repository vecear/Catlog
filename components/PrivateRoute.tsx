import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface PrivateRouteProps {
    children: React.ReactNode;
    skipOnboardingCheck?: boolean;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, skipOnboardingCheck = false }) => {
    const { loading, isAuthenticated, needsOnboarding } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    // If not logged in, redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // If logged in but needs onboarding, redirect to onboarding (unless skipped)
    if (needsOnboarding && !skipOnboardingCheck) {
        return <Navigate to="/onboarding" replace />;
    }

    return <>{children}</>;
};
