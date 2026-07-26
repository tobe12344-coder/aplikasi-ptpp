'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query, type CollectionReference } from 'firebase/firestore';
import type { MaintenanceHistory } from '@/lib/types';
import PrintHistoryForm from './PrintHistoryForm';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

export default function MaintenanceHistoryClient() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [itemToPrint, setItemToPrint] = useState<MaintenanceHistory | null>(null);
  const firestore = useFirestore();

  const historyQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'maintenance_history'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore]);

  const { data, loading } = useCollection<MaintenanceHistory>(historyQuery as any);


  const handlePrint = (item: MaintenanceHistory) => {
    if (item.formUrl) {
      window.open(item.formUrl, '_blank');
      return;
    }
    setItemToPrint(item);
    setTimeout(() => {
      window.print();
      setTimeout(() => setItemToPrint(null), 1000);
    }, 100);
  };

  const filteredData = data?.filter(item => {
    const matchSearch = item.item.toLowerCase().includes(searchTerm.toLowerCase()) || item.sf.toLowerCase().includes(searchTerm.toLowerCase());
    const matchMonth = filterMonth ? item.inspectionDate?.startsWith(filterMonth) : true;
    return matchSearch && matchMonth;
  });


  if (itemToPrint) {
    return <PrintHistoryForm item={itemToPrint} />;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b gap-4">
          <div>
            <CardTitle className="text-2xl font-bold">Semua Riwayat</CardTitle>
            <CardDescription>Catatan inspeksi AFT-DEO Sorong dari waktu ke waktu</CardDescription>
          </div>

          <div className="flex w-full md:w-auto items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari item atau SF..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-auto"
              title="Filter Bulan"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[1000px]">
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[150px] font-semibold">Tanggal Inspeksi</TableHead>
                  <TableHead className="min-w-[200px] font-semibold">Item & Form</TableHead>
                  <TableHead className="w-[120px] font-semibold text-center">Status</TableHead>
                  <TableHead className="min-w-[200px] font-semibold">Keterangan / Hasil</TableHead>
                  <TableHead className="w-[150px] font-semibold text-right pr-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                   Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5} className="p-4"><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredData?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      Tidak ada data riwayat ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData?.map((row) => (
                    <TableRow key={row.id} className="hover:bg-slate-50/50">
                      <TableCell>
                        <div className="font-medium">
                          {row.inspectionDate ? format(parseISO(row.inspectionDate), 'dd MMM yyyy', { locale: id }) : '-'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {row.createdAt ? format(new Date(row.createdAt as string), 'HH:mm') : ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-gray-900">{row.item}</div>
                        <div className="text-xs text-muted-foreground">{row.sf} ({row.period})</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={row.status === 'Complete' ? 'default' : 'destructive'}
                          className={row.status === 'Complete' ? 'bg-green-600' : ''}
                        >
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                         {row.keterangan ? (
                            <div className="text-sm text-gray-700 line-clamp-2" title={row.keterangan}>
                              {row.keterangan}
                            </div>
                         ) : (
                           <div className="text-sm italic text-gray-400">Tidak ada catatan</div>
                         )}
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-2"
                            onClick={() => handlePrint(row)}
                            title="Cetak Hasil Inspeksi"
                          >
                            <Printer className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Cetak Hasil Inspeksi</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
