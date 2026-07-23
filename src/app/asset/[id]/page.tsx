'use client';

import { useParams } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, type DocumentReference } from 'firebase/firestore';
import type { SarprasItem } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import Header from '@/components/common/Header';

export default function AssetDetailPublikPage() {
  const params = useParams();
  const assetId = params.id as string;
  const firestore = useFirestore();

  const docRef = useMemoFirebase(() => {
    if (!firestore || !assetId) return null;
    return doc(firestore, 'sarpras', assetId) as DocumentReference<SarprasItem>;
  }, [firestore, assetId]);

  const { data: asset, loading } = useDoc<SarprasItem>(docRef);

  return (
    <>
      <Header />
      <div className="p-4 md:p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-6 text-center">Informasi Aset</h1>
        {loading && (
          <Card className="p-6">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-4 w-1/3 mb-6" />
            <Skeleton className="h-32 w-full" />
          </Card>
        )}
        {!loading && !asset && (
          <Card className="p-6 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-2">Aset Tidak Ditemukan</h2>
            <p className="text-muted-foreground">ID QR Code tidak valid atau aset telah dihapus.</p>
          </Card>
        )}
        {!loading && asset && (
          <Card className="p-6 md:p-8 border-t-4 border-t-purple-600 shadow-lg">
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-black text-gray-800">{asset.name}</h2>
                <p className="text-sm text-muted-foreground uppercase tracking-widest">{asset.category}</p>
              </div>
              <Badge variant={asset.status === 'Baik' ? 'default' : (asset.status === 'Rusak' ? 'destructive' : 'outline')} className="text-sm px-4 py-1">
                {asset.status}
              </Badge>
            </div>
            
            <div className="space-y-4 text-sm md:text-base">
              {asset.plateNumber && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground font-medium">No. Polisi</span>
                  <span className="col-span-2 font-semibold">{asset.plateNumber}</span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground font-medium">Lokasi</span>
                <span className="col-span-2 font-semibold">{asset.location}</span>
              </div>
              {asset.capacity && (
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground font-medium">Kapasitas</span>
                  <span className="col-span-2 font-semibold">{asset.capacity}</span>
                </div>
              )}
              {asset.lastMaintenance && (
                <div className="grid grid-cols-3 gap-2 pt-4 border-t">
                  <span className="text-muted-foreground font-medium">Maintenance Terakhir</span>
                  <span className="col-span-2 font-semibold">
                    {format(parseISO(asset.lastMaintenance), 'dd MMMM yyyy', { locale: localeId })}
                  </span>
                </div>
              )}
            </div>
            
            {(asset.damageArea || asset.damageNotes) && (
              <div className="mt-6 bg-red-50 p-4 rounded-lg border border-red-100">
                <h3 className="text-sm font-bold text-red-800 mb-2 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-600"></span>
                  Laporan Kerusakan Visual
                </h3>
                {asset.damageArea && (
                  <p className="text-red-700 text-sm mb-1"><span className="font-semibold">Titik Kerusakan:</span> {asset.damageArea}</p>
                )}
                {asset.damageNotes && (
                  <p className="text-red-700 text-sm"><span className="font-semibold">Deskripsi:</span> {asset.damageNotes}</p>
                )}
              </div>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
