'use client';

import { useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const PUBLIC_ROUTES = ['/login', '/lapor'];

export default function ProtectedRoute({ 
  children,
  allowedRoles
}: { 
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || loading) return;

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

    if (!user) {
      if (!isPublicRoute) {
        router.push('/login');
      }
    } else {
      const userRole = (user as any).role || 'admin'; // fallback to admin
      if (isPublicRoute) {
        router.push('/');
      } else if (allowedRoles && !allowedRoles.includes(userRole)) {
        router.push('/');
      }
    }
  }, [user, loading, pathname, router, mounted, allowedRoles]);

  if (!mounted || loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50/50 dark:bg-gray-900/50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  if (!user && !isPublicRoute) return null;
  if (user && isPublicRoute) return null;
  
  const userRole = user ? (user as any).role || 'admin' : undefined;
  if (user && allowedRoles && !allowedRoles.includes(userRole)) return null;

  return <>{children}</>;
}
