import { lazy, Suspense, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReactLenis from 'lenis/react';
import { GlobalNav } from './components/layout/GlobalNav';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/home/HomePage';
import 'lenis/dist/lenis.css';

const IphonePage = lazy(() =>
  import('./pages/IphonePage').then(({ IphonePage: Page }) => ({ default: Page })),
);

const LoginPage = lazy(() =>
  import('./pages/LoginPage').then(({ LoginPage: Page }) => ({ default: Page })),
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
                <Route path="/iphone" element={<IphonePage />} />
              </Route>

              {/* Standalone Login Route */}
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ReactLenis>
    </QueryClientProvider>
  );
}
