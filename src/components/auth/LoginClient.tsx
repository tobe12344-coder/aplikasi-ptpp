'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { loginWithGoogle } from '@/firebase/auth/auth';
import { Loader2 } from 'lucide-react';
import type { FirebaseError } from 'firebase/app';

export default function LoginClient() {
  const { toast } = useToast();
  const auth = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loginWithGoogle(auth);
      toast({
        title: 'Berhasil!',
        description: 'Anda berhasil masuk.',
      });
      router.push('/');
    } catch (err: any) {
      let errMsg = 'Gagal masuk dengan Google. Pastikan email Anda valid dan koneksi stabil.';
      
      if (err.message === 'NOT_REGISTERED') {
        errMsg = 'Email Anda belum terdaftar. Silakan hubungi Administrator untuk mendaftarkan email Anda.';
      } else if (err.code === 'auth/popup-closed-by-user') {
        errMsg = 'Login dibatalkan oleh pengguna.';
      }
        
      setError(errMsg);
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: errMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Digital Monitoring Maintenance</CardTitle>
        <CardDescription>Silakan masuk menggunakan akun Google Anda</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error && <p className="text-sm text-destructive text-center">{error}</p>}
        <Button 
          type="button" 
          onClick={handleGoogleLogin}
          className="w-full flex items-center gap-2" 
          disabled={loading}
          variant="outline"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
          )}
          Masuk dengan Google
        </Button>
      </CardContent>
    </Card>
  );
}
