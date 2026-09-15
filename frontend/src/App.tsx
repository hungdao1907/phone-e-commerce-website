import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GlobalNav } from './components/layout/GlobalNav';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/home/HomePage';
import { IphonePage } from './pages/iphone/IphonePage';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardLayout } from './components/admin/layout/DashboardLayout';
import { CustomerProfile } from './pages/profile/CustomerProfile';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { SmartphonePage } from './pages/smartphone/SmartphonePage';
import ProductPurchasePage from './pages/product/ProductPurchasePage';
import CartPage from './pages/cart/CartPage';

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
            <Route path="/exploreIphone17promax" element={<IphonePage />} />
            <Route path="/samsung" element={<SmartphonePage brand="samsung" />} />
            <Route path="/product/:slug" element={<ProductPurchasePage />} />
            <Route path="/cart" element={<CartPage />} />
          </Route>
          
          {/* Standalone Login Route without Navbar and Footer */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Dashboard Route Protected by Authentication */}
          <Route element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'manager', 'user']} />}>
            <Route path="/dashboard" element={<DashboardLayout />} />
          </Route>

          {/* Customer Profile Route (Protected) */}
          <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
            <Route element={<MainLayout />}>
              <Route path="/profile" element={<CustomerProfile />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
