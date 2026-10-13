import React, { useState } from 'react';
import {
  Search,
  PlusCircle,
  MessageSquare,
  User as UserIcon,
  Moon,
  Sun,
  LogOut,
  Store,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useConversations } from '../../hooks/useConversations';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
  onSearchSubmit?: (q: string) => void;
}

export function Navbar({ currentPath, navigate, onSearchSubmit }: NavbarProps) {
  const { user, profile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { totalUnread } = useConversations(user?.uid);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (onSearchSubmit) {
        onSearchSubmit(searchQuery);
      }
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleProtectedAction = (targetPath: string) => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(targetPath)}`);
    } else {
      navigate(targetPath);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 sm:gap-8">
        
        {/* Zone 1: Clean Wordmark - Removed "A" logo badge */}
        <div className="flex items-center gap-6 shrink-0">
          <button
            onClick={() => navigate('/')}
            className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-2 text-left transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <span className="font-extrabold tracking-tight">Anasagi Store</span>
          </button>

          {/* Quick Nav desktop */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-neutral-600 dark:text-neutral-400">
            <button
              onClick={() => navigate('/')}
              className={`transition-all duration-200 hover:scale-105 active:scale-95 hover:text-neutral-900 dark:hover:text-white ${
                currentPath === '/' ? 'text-neutral-900 dark:text-white font-bold underline underline-offset-4' : ''
              }`}
            >
              Beranda
            </button>
            <button
              onClick={() => navigate('/search')}
              className={`transition-all duration-200 hover:scale-105 active:scale-95 hover:text-neutral-900 dark:hover:text-white ${
                currentPath.startsWith('/search') ? 'text-neutral-900 dark:text-white font-bold underline underline-offset-4' : ''
              }`}
            >
              Cari Produk
            </button>
          </nav>
        </div>

        {/* Zone 2: Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md hidden sm:block">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-neutral-900 dark:group-focus-within:text-white transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari produk di Anasagi Store..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900/20 dark:focus:ring-white/20 focus:border-neutral-900 dark:focus:border-white transition-all duration-200 shadow-xs focus:shadow-md"
            />
          </div>
        </form>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Sell Button */}
          <button
            onClick={() => handleProtectedAction('/sell')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white dark:text-neutral-900 bg-neutral-900 dark:bg-white rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">+ Jual Produk</span>
          </button>

          {/* Inbox Button */}
          <button
            onClick={() => handleProtectedAction('/inbox')}
            className="relative p-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
            title="Pesan / Inbox"
          >
            <MessageSquare className="w-5 h-5" />
            {totalUnread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-black dark:bg-white dark:text-black rounded-full flex items-center justify-center border border-white dark:border-black animate-bounce shadow-sm">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Profile Menu Dropdown */}
          <div className="relative">
            {user ? (
              <div>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-2 hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 border border-neutral-200 dark:border-neutral-800 shadow-xs"
                >
                  {profile?.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name}
                      className="w-7 h-7 rounded-full object-cover bg-neutral-200"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black flex items-center justify-center text-xs font-bold">
                      {profile?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-neutral-900 dark:text-white max-w-[100px] truncate hidden md:inline">
                    {profile?.name || 'Profil'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                </button>

                {profileDropdownOpen && (
                  <div
                    onClick={() => setProfileDropdownOpen(false)}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl py-2 z-50 text-sm transition-all duration-200 animate-in fade-in slide-in-from-top-2"
                  >
                    <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-900">
                      <p className="font-bold text-neutral-900 dark:text-white truncate">
                        {profile?.name || 'Pengguna'}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                    </div>

                    <button
                      onClick={() => navigate('/my-products')}
                      className="w-full text-left px-4 py-2.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2 transition-colors font-medium text-xs"
                    >
                      <Store className="w-4 h-4" />
                      Produk Saya
                    </button>

                    <button
                      onClick={() => navigate('/inbox')}
                      className="w-full text-left px-4 py-2.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2 transition-colors font-medium text-xs"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Pesan Masuk ({totalUnread})
                    </button>

                    <button
                      onClick={() => navigate('/profile')}
                      className="w-full text-left px-4 py-2.5 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2 transition-colors font-medium text-xs"
                    >
                      <UserIcon className="w-4 h-4" />
                      Pengaturan Profil
                    </button>

                    <div className="border-t border-neutral-100 dark:border-neutral-900 my-1"></div>

                    <button
                      onClick={async () => {
                        await logout();
                        navigate('/');
                      }}
                      className="w-full text-left px-4 py-2.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 transition-colors font-medium text-xs"
                    >
                      <LogOut className="w-4 h-4" />
                      Keluar (Logout)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/login')}
                  className="px-4 py-2 text-xs font-bold text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-900 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 border border-neutral-300 dark:border-neutral-800 shadow-xs"
                >
                  Masuk
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Mobile Search bar */}
      <div className="px-4 pb-3 sm:hidden border-t border-neutral-100 dark:border-neutral-900 pt-2">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari produk..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-500 focus:outline-none"
            />
          </div>
        </form>
      </div>
    </header>
  );
}
