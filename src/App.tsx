import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Machines } from './pages/Machines';
import { Pipeline } from './pages/Pipeline';
import { ClientsList } from './pages/ClientsList';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <div className="min-h-screen bg-[#080C14] text-[#E2E8F0] bg-ambient-grid flex flex-col font-sans">
      {isAuthenticated && !isLoginPage && <Navbar />}
      <main className="flex-1 pb-20 md:pb-8">
        {children}
      </main>
      {isAuthenticated && !isLoginPage && <BottomNav />}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/machines"
              element={
                <ProtectedRoute>
                  <Machines />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pipeline"
              element={
                <ProtectedRoute>
                  <Pipeline />
                </ProtectedRoute>
              }
            />

            <Route
              path="/leads"
              element={
                <ProtectedRoute>
                  <ClientsList />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  );
}
