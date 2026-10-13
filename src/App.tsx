import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { AuthPages } from './pages/AuthPages';
import { OnboardingPage } from './pages/OnboardingPage';
import { SellPage } from './pages/SellPage';
import { MyProductsPage } from './pages/MyProductsPage';
import { EditProductPage } from './pages/EditProductPage';
import { InboxPage } from './pages/InboxPage';
import { ChatRoomPage } from './pages/ChatRoomPage';
import { ProfilePage } from './pages/ProfilePage';
import { Toaster } from 'sonner';

function AppContent() {
  const { user, needsOnboarding, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname + window.location.search);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname + window.location.search);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  const pathname = currentPath.split('?')[0];
  const searchParams = new URLSearchParams(currentPath.includes('?') ? currentPath.split('?')[1] : '');

  // Guard: if user needs onboarding and isn't currently on /onboarding
  if (!loading && user && needsOnboarding && pathname !== '/onboarding') {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors">
        <Toaster position="top-center" richColors />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20 sm:pb-8">
          <OnboardingPage navigate={navigate} />
        </main>
        <MobileBottomNav currentPath={pathname} navigate={navigate} />
      </div>
    );
  }

  // Route matching
  const renderRoute = () => {
    // Protected Routes Helper
    const protect = (component: React.ReactNode) => {
      if (loading) return <div className="py-20 text-center text-xs text-neutral-400">Memuat data...</div>;
      if (!user) {
        navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
        return null;
      }
      return component;
    };

    if (pathname === '/') {
      return <HomePage navigate={navigate} />;
    }

    if (pathname === '/search') {
      return <SearchPage navigate={navigate} searchParams={searchParams} />;
    }

    if (pathname.startsWith('/product/')) {
      const parts = pathname.split('/');
      const productId = parts[2];
      return <ProductDetailPage productId={productId} navigate={navigate} />;
    }

    if (pathname === '/login') {
      return (
        <AuthPages
          mode="login"
          navigate={navigate}
          redirectPath={searchParams.get('redirect') || '/'}
        />
      );
    }

    if (pathname === '/register') {
      return (
        <AuthPages
          mode="register"
          navigate={navigate}
          redirectPath={searchParams.get('redirect') || '/'}
        />
      );
    }

    if (pathname === '/forgot-password') {
      return <AuthPages mode="forgot-password" navigate={navigate} />;
    }

    if (pathname === '/onboarding') {
      return <OnboardingPage navigate={navigate} />;
    }

    if (pathname === '/sell') {
      return protect(<SellPage navigate={navigate} />);
    }

    if (pathname === '/my-products') {
      return protect(<MyProductsPage navigate={navigate} />);
    }

    if (pathname.startsWith('/my-products/') && pathname.endsWith('/edit')) {
      const parts = pathname.split('/');
      const productId = parts[2];
      return protect(<EditProductPage productId={productId} navigate={navigate} />);
    }

    if (pathname === '/inbox') {
      return protect(<InboxPage navigate={navigate} />);
    }

    if (pathname.startsWith('/chat/')) {
      const parts = pathname.split('/');
      const convId = parts[2];
      return protect(<ChatRoomPage conversationId={convId} navigate={navigate} />);
    }

    if (pathname === '/profile') {
      return protect(<ProfilePage navigate={navigate} />);
    }

    // 404 Fallback
    return (
      <div className="py-24 text-center space-y-4">
        <h1 className="text-4xl font-extrabold text-neutral-900 dark:text-white">404</h1>
        <p className="text-sm text-neutral-500">Halaman yang Anda cari tidak ditemukan.</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 text-xs font-bold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-xl"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  };

  const isChatRoute = pathname === '/inbox' || pathname.startsWith('/chat/');
  const isIndividualChat = pathname.startsWith('/chat/');

  if (isChatRoute) {
    return (
      <div className="h-screen h-[100dvh] bg-neutral-50 dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors overflow-hidden">
        <Toaster position="top-center" richColors />
        <Navbar currentPath={pathname} navigate={navigate} />

        <main className="flex-1 w-full overflow-hidden">
          {renderRoute()}
        </main>

        {!isIndividualChat && (
          <div className="md:hidden">
            <MobileBottomNav currentPath={pathname} navigate={navigate} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors">
      <Toaster position="top-center" richColors />
      <Navbar currentPath={pathname} navigate={navigate} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-20 sm:pb-8">
        {renderRoute()}
      </main>

      <Footer navigate={navigate} />
      <MobileBottomNav currentPath={pathname} navigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
