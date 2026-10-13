import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, KeyRound, Mail, ArrowLeft, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface AuthPageProps {
  mode: 'login' | 'register' | 'forgot-password';
  navigate: (path: string) => void;
  redirectPath?: string;
}

export function AuthPages({ mode, navigate, redirectPath }: AuthPageProps) {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, sendResetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');

  const [loading, setLoading] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const redirectTarget = redirectPath || '/';

  const validateEmail = (str: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Berhasil masuk dengan Google');
      navigate(redirectTarget);
    } catch (err: any) {
      console.error('Google auth error:', err);
      setErrorMsg('Gagal login dengan Google. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!validateEmail(email)) {
      setErrorMsg('Format alamat email tidak valid.');
      return;
    }

    if (mode === 'forgot-password') {
      setLoading(true);
      try {
        await sendResetPassword(email);
        setResetSent(true);
        toast.success('Email reset password telah dikirim');
      } catch (err: any) {
        console.error('Reset password error:', err);
        setErrorMsg('Email tidak ditemukan atau terjadi kesalahan.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (password.length < 8) {
      setErrorMsg('Password minimal 8 karakter.');
      return;
    }

    if (mode === 'register') {
      if (!name.trim() || name.trim().length < 2) {
        setErrorMsg('Nama lengkap minimal 2 karakter.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Konfirmasi password tidak cocok.');
        return;
      }

      setLoading(true);
      try {
        await signUpWithEmail(email, password, name.trim());
        setEmailVerificationSent(true);
        toast.success('Pendaftaran berhasil! Cek email Anda untuk verifikasi.');
      } catch (err: any) {
        console.error('Register error:', err);
        if (err.code === 'auth/email-already-in-use') {
          setErrorMsg('Alamat email sudah terdaftar.');
        } else {
          setErrorMsg('Gagal mendaftar. Periksa kembali data Anda.');
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'login') {
      setLoading(true);
      try {
        await signInWithEmail(email, password);
        toast.success('Berhasil masuk');
        navigate(redirectTarget);
      } catch (err: any) {
        console.error('Login error:', err);
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          setErrorMsg('Email atau password salah.');
        } else {
          setErrorMsg('Gagal masuk. Silakan coba lagi.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  if (emailVerificationSent) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl text-center space-y-4">
        <div className="w-12 h-12 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center mx-auto">
          <Mail className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Cek Email Kamu</h2>
        <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Tautan verifikasi email telah dikirimkan ke <strong>{email}</strong>. Silakan periksa inbox atau folder spam Anda untuk memverifikasi akun.
        </p>
        <button
          onClick={() => navigate(redirectTarget)}
          className="w-full py-2.5 text-xs font-bold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-xl"
        >
          Lanjut ke Beranda
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-8 pb-16 space-y-6">
      
      {/* Title block */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
          {mode === 'login' && 'Masuk ke Anasagi Store'}
          {mode === 'register' && 'Buat Akun Baru'}
          {mode === 'forgot-password' && 'Lupa Password'}
        </h1>
        <p className="text-xs text-neutral-500">
          {mode === 'login' && 'Masukkan kredensial Anda untuk melanjutkan'}
          {mode === 'register' && 'Daftar dalam 1 menit dan mulai berbelanja atau berjualan'}
          {mode === 'forgot-password' && 'Masukkan email Anda untuk menerima tautan reset password'}
        </p>
      </div>

      {/* Main Form Box */}
      <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6">
        
        {/* Google OAuth Button */}
        {mode !== 'forgot-password' && (
          <>
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2.5 transition-all shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Lanjutkan dengan Google</span>
            </button>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-neutral-200 dark:border-neutral-800 w-full" />
              <span className="bg-white dark:bg-neutral-900 px-3 text-[11px] text-neutral-400 absolute">
                atau gunakan email
              </span>
            </div>
          </>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        {resetSent ? (
          <div className="text-center space-y-3 py-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="text-xs text-neutral-700 dark:text-neutral-300">
              Instruksi reset password telah dikirim ke email <strong>{email}</strong>.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-xs font-semibold text-neutral-900 dark:text-white underline"
            >
              Kembali ke Halaman Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Anda"
                  className="w-full p-2.5 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Alamat Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@contoh.com"
                className="w-full p-2.5 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>

            {mode !== 'forgot-password' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => navigate('/forgot-password')}
                      className="text-[11px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                    >
                      Lupa password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="w-full p-2.5 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
                />
              </div>
            )}

            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  Konfirmasi Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password"
                  className="w-full p-2.5 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-900 dark:text-white focus:outline-none"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-xs font-bold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 pt-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <span>
                  {mode === 'login' && 'Masuk Akun'}
                  {mode === 'register' && 'Daftar Sekarang'}
                  {mode === 'forgot-password' && 'Kirim Email Reset'}
                </span>
              )}
            </button>
          </form>
        )}

        {/* Footer switch page */}
        <div className="text-center text-xs text-neutral-500 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          {mode === 'login' && (
            <p>
              Belum punya akun?{' '}
              <button
                onClick={() => navigate('/register')}
                className="font-bold text-neutral-900 dark:text-white hover:underline"
              >
                Daftar Gratis
              </button>
            </p>
          )}

          {mode === 'register' && (
            <p>
              Sudah punya akun?{' '}
              <button
                onClick={() => navigate('/login')}
                className="font-bold text-neutral-900 dark:text-white hover:underline"
              >
                Masuk di Sini
              </button>
            </p>
          )}

          {mode === 'forgot-password' && (
            <button
              onClick={() => navigate('/login')}
              className="font-bold text-neutral-900 dark:text-white hover:underline flex items-center gap-1 mx-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Login
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
