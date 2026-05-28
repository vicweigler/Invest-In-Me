import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import MarketPage from './pages/MarketPage';
import StockDetailPage from './pages/StockDetailPage';
import PortfolioPage from './pages/PortfolioPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import { useAuthStore } from './store/authStore';
// Importing authStore here ensures the onAuthStateChanged listener is registered
// as early as possible (before any child renders).
import './store/authStore';

function ProtectedRoutes() {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <Route element={<AppLayout />}>
      <Route index element={<DashboardPage />} />
      <Route path="market" element={<MarketPage />} />
      <Route path="stock/:symbol" element={<StockDetailPage />} />
      <Route path="portfolio" element={<PortfolioPage />} />
      <Route path="settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  );
}

export default function App() {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route element={user ? <AppLayout /> : <Navigate to="/login" replace />}>
          <Route index element={<PortfolioPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="market" element={<MarketPage />} />
          <Route path="stock/:symbol" element={<StockDetailPage />} />
          <Route path="portfolio" element={<Navigate to="/" replace />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
