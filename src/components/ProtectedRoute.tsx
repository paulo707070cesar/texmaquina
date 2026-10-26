import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#080C14] text-white">
        <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-[#00C2FF] animate-spin mb-4 shadow-[0_0_20px_rgba(0,194,255,0.4)]" />
        <span className="font-display font-semibold text-xs tracking-wider uppercase text-[#00C2FF]">
          Autenticando no TexMachina OS...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
