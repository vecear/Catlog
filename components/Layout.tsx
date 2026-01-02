import React from 'react';
import { Cat, Settings } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isSettingsPage = location.pathname === '/settings';

  return (
    <div className="min-h-screen bg-orange-50 md:bg-gradient-to-br md:from-orange-100 md:via-amber-50 md:to-orange-100">
      <div className="min-h-screen text-stone-800 flex flex-col max-w-md md:max-w-6xl mx-auto md:shadow-none shadow-2xl md:bg-transparent bg-orange-50 relative overflow-x-hidden">

        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 overflow-y-auto scrollbar-hide">
          {children}
        </main>
      </div>
    </div>
  );
};