import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GlobalNav } from './components/layout/GlobalNav';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { IphonePage } from './pages/IphonePage';
import { LoginPage } from './pages/LoginPage';

const queryClient = new QueryClient();

const MainLayout = () => {
  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans antialiased selection:bg-blue-500 selection:text-white">
      <GlobalNav />
      <Outlet />
      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Main Layout Routes with Navbar and Footer */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/iphone" element={<IphonePage />} />
          </Route>
          
          {/* Standalone Login Route without Navbar and Footer */}
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
