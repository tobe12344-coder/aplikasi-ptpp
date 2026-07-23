'use client';

import BackButton from '@/components/common/BackButton';
import Header from '@/components/common/Header';
import MaintenanceHistoryClient from '@/components/teknik-maintenance/MaintenanceHistoryClient';

export default function MaintenanceHistoryPage() {
  return (
    <>
      <Header />
      <div className="p-4 md:p-8">
        <BackButton href="/ceklish-maintenance" />
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Riwayat Inspeksi</h1>
            <p className="text-muted-foreground">Daftar semua hasil inspeksi dan maintenance yang telah dilakukan.</p>
          </div>
          <MaintenanceHistoryClient />
        </div>
      </div>
    </>
  );
}
