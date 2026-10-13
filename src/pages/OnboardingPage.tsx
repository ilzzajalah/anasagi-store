import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { compressAndResizeImage } from '../lib/utils';
import { toast } from 'sonner';

interface OnboardingPageProps {
  navigate: (path: string) => void;
}

export function OnboardingPage({ navigate }: OnboardingPageProps) {
  const { user, profile, updateUserProfile, refreshProfile } = useAuth();

  const [name, setName] = useState(profile?.name || user?.displayName || '');
  const [avatarUrl, setAvatarUrl] = useState(
    profile?.avatarUrl || user?.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.email || 'User')}&backgroundColor=000000&textColor=ffffff`
  );

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If user already has name, redirect to home
  useEffect(() => {
    if (profile?.name && profile.name.trim().length >= 2) {
      navigate('/');
    }
  }, [profile, navigate]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressAndResizeImage(file, 400, 400, 0.85);
      setAvatarUrl(compressed);
    } catch (err) {
      console.error('Error handling avatar:', err);
      toast.error('Gagal mengunggah foto profil.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 50) {
      setErrorMsg('Nama harus antara 2 hingga 50 karakter.');
      return;
    }

    setSubmitting(true);
    try {
      await updateUserProfile({
        name: trimmed,
        avatarUrl,
      });
      await refreshProfile();
      toast.success('Profil berhasil diperbarui!');
      navigate('/');
    } catch (err: any) {
      console.error('Failed onboarding profile update:', err);
      setErrorMsg('Gagal menyimpan profil. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 pb-16 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
          Selamat Datang di Anasagi Store!
        </h1>
        <p className="text-xs text-neutral-500 max-w-xs mx-auto">
          Lengkapi profil Anda agar pembeli dan penjual lain mengenal Anda.
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
        
        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-neutral-900 dark:border-white shadow-md bg-neutral-100">
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            </div>

            <label className="px-3.5 py-1.5 text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl cursor-pointer transition-colors">
              Ganti Foto Profil
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Name Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              Nama Lengkap / Nama Toko <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              placeholder="Contoh: Budi Santoso"
              className="w-full p-3 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
            />
            <p className="text-[11px] text-neutral-500 text-right">{name.length}/50</p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 text-xs font-bold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan Profil...</span>
              </>
            ) : (
              <span>Selesaikan & Masuk Beranda</span>
            )}
          </button>

        </form>

      </div>
    </div>
  );
}
