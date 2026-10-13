import React from 'react';

export function Footer({ navigate }: { navigate: (path: string) => void }) {
  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#0a0a0a] transition-colors mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-2.5">
            <span className="font-extrabold text-neutral-900 dark:text-white">Anasagi Store</span>
            <span>·</span>
            <span>Pasar Online Indonesia</span>
          </div>

          <div className="flex items-center gap-5 font-medium">
            <button onClick={() => navigate('/')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
              Beranda
            </button>
            <button onClick={() => navigate('/search')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
              Cari Produk
            </button>
            <button onClick={() => navigate('/sell')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
              Jual Produk
            </button>
          </div>

          <p>© {new Date().getFullYear()} Anasagi Store.</p>
        </div>
      </div>
    </footer>
  );
}
