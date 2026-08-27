import { lazy, Suspense, useMemo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReactLenis from 'lenis/react';
import { GlobalNav } from './components/layout/GlobalNav';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import 'lenis/dist/lenis.css';

const IphonePage = lazy(() =>
  import('./pages/IphonePage').then(({ IphonePage: Page }) => ({ default: Page })),
);

const queryClient = new QueryClient();

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
          <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans antialiased selection:bg-blue-500 selection:text-white">
            <GlobalNav />
            <Suspense
              fallback={(
                <div
                  className="min-h-[calc(100svh-44px)] bg-black"
                  role="status"
                  aria-label="Đang tải trang"
                />
              )}
            >
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/iphone" element={<IphonePage />} />
              </Routes>
            </Suspense>
            <Footer />
          </div>
        </BrowserRouter>
      </ReactLenis>
    </QueryClientProvider>
  );
}
