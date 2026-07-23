
'use client';

import { useParams } from 'next/navigation';
import BackButton from '@/components/common/BackButton';
import Header from '@/components/common/Header';
import RefuellerUnitClient from '@/components/teknik-maintenance/RefuellerUnitClient';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, type CollectionReference } from 'firebase/firestore';
import type { SarprasItem } from '@/lib/types';

export default function RefuellerDetailPage() {
  const params = useParams();
  const unitId = params.id as string;
  const unitName = unitId.replace('-', ' '); // DEO-10 -> DEO 10
  
  const firestore = useFirestore();
  const { user } = useUser();

  // Query for this specific unit
  const unitQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'sarpras') as CollectionReference<SarprasItem>,
      where('name', '==', unitName),
      where('category', '==', 'Refueller')
    );
  }, [firestore, unitName]);

  const { data: units, loading } = useCollection<SarprasItem>(unitQuery);
  const canManage = user?.role === 'admin' || user?.role === 'teknik';

  // Capacity Mapping
  const getCapacity = (name: string) => {
    if (name === 'DEO 13') return '12 KL';
    return '16 KL';
  };

  return (
    <>
      <Header />
      <div className="p-4 md:p-8">
        <BackButton href="/refueller" />
        <div className="max-w-4xl mx-auto">
          <RefuellerUnitClient 
            unitName={unitName}
            unitData={units?.[0]}
            loading={loading}
            canManage={canManage}
            capacity={getCapacity(unitName)}
          />
        </div>
      </div>
    </>
  );
}
