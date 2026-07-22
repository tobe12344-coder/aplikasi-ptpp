'use client';

import BackButton from '@/components/common/BackButton';
import Header from '@/components/common/Header';
import CalibrationClient from '@/components/teknik-maintenance/CalibrationClient';

export default function CalibrationPage() {
  return (
    <>
      <Header />
      <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
        <BackButton href="/teknik-maintenance" />
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Kalibrasi dan Tera Peralatan</h1>
            <p className="text-muted-foreground">Pemantauan jadwal kalibrasi dan kondisi fisik peralatan sarana dan prasarana.</p>
          </div>
          <CalibrationClient />
        </div>
      </div>
    </>
  );
}
