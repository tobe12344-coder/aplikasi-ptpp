'use client';

import BackButton from '@/components/common/BackButton';
import Header from '@/components/common/Header';
import CeklishMaintenanceClient from '@/components/teknik-maintenance/CeklishMaintenanceClient';

export default function CeklishMaintenancePage() {
  return (
    <>
      <Header />
      <div className="p-4 md:p-8">
        <BackButton href="/" />
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Ceklish Maintenance</h1>
            <p className="text-muted-foreground">Form checklist pemeriksaan dan maintenance sarana dan prasarana rutin.</p>
          </div>
          <CeklishMaintenanceClient />
        </div>
      </div>
    </>
  );
}
