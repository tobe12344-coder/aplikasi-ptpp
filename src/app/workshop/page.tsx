
'use client';

import BackButton from '@/components/common/BackButton';
import Header from '@/components/common/Header';
import WorkshopInventoryClient from '@/components/teknik-maintenance/WorkshopInventoryClient';


export default function WorkshopAssetsPage() {
  return (
    <>
      <Header />
      <div className="p-4 md:p-8">
        <BackButton href="/" />
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Manajemen Inventaris Workshop</h1>
            <p className="text-muted-foreground">Pengelolaan stok material, filter, dan peralatan kerja AFTDEO Sorong.</p>
          </div>
          <WorkshopInventoryClient  />
        </div>
      </div>
    </>
  );
}
