import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { compressAndResizeImage } from '../lib/utils';
import { Sun, Moon, LogOut, Check, Loader2, Store, Monitor } from 'lucide-react';
import { toast } from 'sonner';

interface ProfilePageProps {
  navigate: (path: string) => void;
}

export function ProfilePage({ navigate }: ProfilePageProps) {
  const { user, profile, updateUserProfile, logout } = useAuth();
  const { theme, toggleTheme, resetToSystem } = useTheme();

  const [name, setName] = useState(profile?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || '');
  const [saving, setSaving] = useState(false);

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressAndResizeImage(file, 400, 400, 0.85);
      setAvatarUrl(compressed);
    } catch (err) {
      toast.error('Gagal mengunggah foto.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      toast.error('Nama minimal 2 karakter.');
      return;
    }

    setSaving(true);
    try {
      await updateUserProfile({
        name: name.trim(),
        avatarUrl,
      });
      toast.success('Profil berhasil disimpan');
    } catch (err) {
      toast.error('Gagal menyimpan perubahan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto pb-16 space-y-6">
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-4">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
          Pengaturan Profil
        </h1>
        <p className="text-xs text-neutral-500">Ubah identitas, foto profil, dan preferensi tema tampilan Anda.</p>
      </div>

      <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-6 shadow-sm">
        
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Avatar Upload */}
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-neutral-900 dark:border-white shadow-sm bg-neutral-100 shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-neutral-900 text-white flex items-center justify-center font-bold text-lg">
                  {name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="inline-block px-3.5 py-1.5 text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl cursor-pointer transition-colors shadow-xs">
                Ubah Foto
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-neutral-500">Maksimal 2 MB (JPG/PNG/WebP)</p>
            </div>
          </div>

          {/* Name input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Nama Lengkap / Nama Toko
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              className="w-full p-2.5 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
            />
          </div>

          {/* Email (Readonly) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Alamat Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full p-2.5 text-xs bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-500 cursor-not-allowed"
            />
          </div>

          {/* Theme switcher */}
          <div className="p-4 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-neutral-900 dark:text-white">Mode Tampilan</p>
                <p className="text-[11px] text-neutral-500">
                  Mode aktif: <strong className="text-neutral-900 dark:text-white uppercase">{theme}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:scale-105 active:scale-95 transition-all shadow-xs flex items-center gap-1.5"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-800" />}
                  <span>{theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                resetToSystem();
                toast.success('Tema disesuaikan dengan preferensi sistem perangkat');
              }}
              className="w-full text-left py-1.5 px-3 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Gunakan Preferensi Otomatis Perangkat (System Default)</span>
            </button>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/my-products')}
              className="px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              <Store className="w-4 h-4" />
              Produk Saya
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-xs font-bold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-xl hover:opacity-90 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span>Simpan Profil</span>
            </button>
          </div>

        </form>

        <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4">
          <button
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="w-full py-2.5 px-4 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-102 active:scale-98"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Dari Akun (Logout)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
