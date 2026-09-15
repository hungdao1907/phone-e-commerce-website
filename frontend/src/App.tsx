import { lazy, Suspense, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReactLenis from 'lenis/react';
import { GlobalNav } from './components/layout/GlobalNav';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/home/HomePage';
import 'lenis/dist/lenis.css';

// Admin & Auth imports
import { DashboardLayout } from './components/admin/layout/DashboardLayout';
import { CustomerProfile } from './pages/profile/CustomerProfile';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { IphonePage } from './pages/iphone/IphonePage';

const SmartphonePage = lazy(() =>
  import('./pages/smartphone/SmartphonePage').then(({ SmartphonePage: Page }) => ({ default: Page })),
);
const LoginPage = lazy(() =>
  import('./pages/auth/LoginPage').then(({ LoginPage: Page }) => ({ default: Page })),
);

const WatchPage = lazy(() =>
  import('./pages/watch/WatchPage').then(({ WatchPage: Page }) => ({ default: Page })),
);

const WatchSeries11Page = lazy(() =>
  import('./pages/watch/series-11/WatchSeries11Page').then(({ WatchSeries11Page: Page }) => ({ default: Page })),
);

const WatchSE3Page = lazy(() =>
  import('./pages/watch/se-3/WatchSE3Page').then(({ WatchSE3Page: Page }) => ({ default: Page })),
);

const WatchUltra3Page = lazy(() =>
  import('./pages/watch/ultra-3/WatchUltra3Page').then(({ WatchUltra3Page: Page }) => ({ default: Page })),
);

const TabletPage = lazy(() =>
  import('./pages/tablet/TabletPage').then(({ TabletPage: Page }) => ({ default: Page })),
);
const LaptopPage = lazy(() =>
  import('./pages/laptop/LaptopPage').then(({ LaptopPage: Page }) => ({ default: Page })),
);
const ProductPurchasePage = lazy(() =>
  import('./pages/product/ProductPurchasePage').then((mod) => ({ default: mod.default || mod.ProductPurchasePage })),
);

const CartPage = lazy(() =>
  import('./pages/cart/CartPage').then((mod) => ({ default: mod.default || mod.CartPage })),
);

const queryClient = new QueryClient();

function MainLayout() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans antialiased selection:bg-blue-500 selection:text-white">
      <GlobalNav />
      <Outlet />
      <Footer />
    </div>
  );
}

export default function App() {
  const isReducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );

  const lenisOptions = useMemo(
    () =>
      isReducedMotion
        ? { smoothWheel: false, lerp: 1 }
        : {
            lerp: 0.09,
            smoothWheel: true,
            wheelMultiplier: 0.9,
            touchMultiplier: 1,
          },
    [isReducedMotion],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ReactLenis root options={lenisOptions}>
        <BrowserRouter>
          <Suspense
            fallback={(
              <div
                className="min-h-[100svh] bg-black"
                role="status"
                aria-label="Đang tải trang"
              />
            )}
          >
            <Routes>
              {/* Main Layout with GlobalNav and Footer */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<HomePage />} />
                {/* Smartphone Routes */}
                <Route path="/phone/iphone" element={<SmartphonePage brand="iphone" />} />
                <Route path="/phone/exploreIphone17promax" element={<IphonePage />} />
                <Route path="/phone/samsung" element={<SmartphonePage brand="samsung" />} />
                <Route path="/phone/xiaomi" element={<SmartphonePage brand="xiaomi" />} />
                <Route path="/phone/oppo" element={<SmartphonePage brand="oppo" />} />

                {/* Watch Routes */}
                <Route path="/watch/exploreWatch" element={<WatchPage />} />
                <Route path="/watch/exploreSeries-11" element={<WatchSeries11Page />} />
                <Route path="/watch/exploreSe-3" element={<WatchSE3Page />} />
                <Route path="/watch/exploreUltra-3" element={<WatchUltra3Page />} />

                {/* Tablet Routes */}
                <Route path="/tablet/apple" element={<TabletPage brand="apple" />} />
                <Route path="/tablet/samsung" element={<TabletPage brand="samsung" />} />
                <Route path="/tablet/xiaomi" element={<TabletPage brand="xiaomi" />} />
                
                {/* Laptop Routes */}
                <Route path="/laptop/apple" element={<LaptopPage brand="apple" />} />
                <Route path="/laptop/dell" element={<LaptopPage brand="dell" />} />
                <Route path="/laptop/asus" element={<LaptopPage brand="asus" />} />
                <Route path="/laptop/hp" element={<LaptopPage brand="hp" />} />
                <Route path="/product/:slug" element={<ProductPurchasePage />} />
                <Route path="/cart" element={<CartPage />} />

                {/* Legacy / Category Aliases & Redirects */}
                <Route path="/iphone" element={<Navigate to="/phone/iphone" replace />} />
                <Route path="/exploreIphone17promax" element={<Navigate to="/phone/exploreIphone17promax" replace />} />
                <Route path="/samsung" element={<Navigate to="/phone/samsung" replace />} />
                <Route path="/xiaomi" element={<Navigate to="/phone/xiaomi" replace />} />
                <Route path="/oppo" element={<Navigate to="/phone/oppo" replace />} />
                <Route path="/phone" element={<Navigate to="/phone/iphone" replace />} />
                <Route path="/dien-thoai" element={<Navigate to="/phone/iphone" replace />} />
                <Route path="/ien-thoai" element={<Navigate to="/phone/iphone" replace />} />
                <Route path="/watch" element={<Navigate to="/watch/exploreWatch" replace />} />
                <Route path="/watch/series-11" element={<Navigate to="/watch/exploreSeries-11" replace />} />
                <Route path="/watch/se-3" element={<Navigate to="/watch/exploreSe-3" replace />} />
                <Route path="/watch/ultra-3" element={<Navigate to="/watch/exploreUltra-3" replace />} />
                <Route path="/dong-ho-thong-minh" element={<Navigate to="/watch/exploreWatch" replace />} />
                <Route path="/ong-ho-thong-minh" element={<Navigate to="/watch/exploreWatch" replace />} />
                <Route path="/tablet" element={<Navigate to="/tablet/apple" replace />} />
                <Route path="/may-tinh-bang" element={<Navigate to="/tablet/apple" replace />} />
                <Route path="/laptop" element={<Navigate to="/laptop/apple" replace />} />
                
                {/* Customer Profile Route (Protected inside MainLayout) */}
                <Route element={<ProtectedRoute allowedRoles={['customer']} />}>
                  <Route path="/profile" element={<CustomerProfile />} />
                </Route>
              </Route>

              {/* Standalone Login Route */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Dashboard Route Protected by Authentication (Standalone) */}
              <Route element={<ProtectedRoute allowedRoles={['superadmin', 'admin', 'manager', 'user']} />}>
                <Route path="/dashboard" element={<DashboardLayout />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ReactLenis>
    </QueryClientProvider>
  );
}
