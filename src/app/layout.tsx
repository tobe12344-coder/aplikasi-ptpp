
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'AFTDEO Manager',
  description: 'Sistem Internal - Pertamina AFTDEO Sorong',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.className} antialiased`}>
        <FirebaseClientProvider>
          <ProtectedRoute>
            {children}
            <Toaster />
          </ProtectedRoute>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
