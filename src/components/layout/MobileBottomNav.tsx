import React from 'react';
import { Home, Search, PlusCircle, MessageSquare, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useConversations } from '../../hooks/useConversations';
import { motion } from 'motion/react';

interface MobileBottomNavProps {
  currentPath: string;
  navigate: (path: string) => void;
}

export function MobileBottomNav({ currentPath, navigate }: MobileBottomNavProps) {
  const { user } = useAuth();
  const { totalUnread } = useConversations(user?.uid);

  const navItems = [
    { label: 'Beranda', path: '/', icon: Home },
    { label: 'Cari', path: '/search', icon: Search },
    { label: 'Jual', path: '/sell', icon: PlusCircle, isHighlight: true },
    { label: 'Inbox', path: '/inbox', icon: MessageSquare, badge: totalUnread },
    { label: 'Profil', path: user ? '/profile' : '/login', icon: User },
  ];

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 px-2 py-1.5 shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === '/'
              ? currentPath === '/'
              : currentPath.startsWith(item.path);

          if (item.isHighlight) {
            return (
              <motion.button
                key={item.path}
                whileTap={{ scale: 0.88 }}
                onClick={() => navigate(user ? item.path : `/login?redirect=${encodeURIComponent(item.path)}`)}
                className="flex flex-col items-center justify-center p-1.5 text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-xl shadow-md -mt-4 transition-transform active:scale-95"
              >
                <div className="w-10 h-10 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold -mt-1 pb-0.5">Jual</span>
              </motion.button>
            );
          }

          return (
            <motion.button
              key={item.path}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                if (item.path === '/inbox' || item.path === '/profile') {
                  if (!user) {
                    navigate(`/login?redirect=${encodeURIComponent(item.path)}`);
                    return;
                  }
                }
                navigate(item.path);
              }}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? 'text-neutral-900 dark:text-white font-bold'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-1 bg-black text-white dark:bg-white dark:text-black text-[9px] font-black rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
