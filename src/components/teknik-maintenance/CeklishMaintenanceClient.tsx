'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Printer, FileEdit, Bell, Search, RefreshCw, Plus } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, type CollectionReference } from 'firebase/firestore';
import type { MaintenanceChecklist } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { parse, differenceInDays, isBefore, isToday, parseISO, format } from 'date-fns';
import { id } from 'date-fns/locale';
import CeklishActionModal from './CeklishActionModal';
import AddCeklishModal from './AddCeklishModal';
import PrintBlankForm from './PrintBlankForm';
import PrintAllChecklists from './PrintAllChecklists';
import Link from 'next/link';
import { History } from 'lucide-react';

// Initial Data for Seeding
const initialData: Omit<MaintenanceChecklist, 'id'>[] = [
  { no: '1', item: 'Refueller Checklist', sf: 'SF-119', period: 'Daily', lastInspection: '', nextInspection: '', status: 'Pending', keterangan: '' },
  { no: '2', item: 'Interlock System', sf: 'SF-219', period: 'Weekly', lastInspection: '2026-04-28', nextInspection: '2026-05-05', status: 'Check', keterangan: '' },
  { no: '3', item: 'Bonding,Wire, Lanyard, and Flame Trap', sf: 'SF-210', period: 'Weekly', lastInspection: '2026-04-28', nextInspection: '2026-05-05', status: 'Check', keterangan: '' },
  { no: '4', item: 'Floating Suction', sf: 'SF-260', period: 'Weekly', lastInspection: '2026-04-23', nextInspection: '2026-04-30', status: 'Check', keterangan: '' },
  { no: '5', item: 'Genset', sf: 'SF-246', period: 'Weekly', lastInspection: '2026-04-30', nextInspection: '2026-05-07', status: 'Complete', keterangan: '' },
  { no: '6', item: 'Deadman Control Test', sf: 'SF-217', period: 'Monthly', lastInspection: '2026-04-25', nextInspection: '2026-05-25', status: 'Complete', keterangan: '' },
  { no: '7', item: 'Daftar Kalibrasi dan Tera Peralatan', sf: 'SF-234', period: 'Monthly', lastInspection: '2026-04-30', nextInspection: '2026-05-30', status: 'Complete', keterangan: '' },
  { no: '8', item: 'Hose Check Monthly & Six monthly', sf: 'SF-222', period: 'Monthly', lastInspection: '2026-04-06', nextInspection: '2026-05-06', status: 'Complete', keterangan: '' },
  { no: '9', item: 'Hose End Strainer Check', sf: 'SF-205', period: 'Monthly', lastInspection: '2026-04-06', nextInspection: '2026-05-06', status: 'Complete', keterangan: '' },
  { no: '10', item: 'Overfill High Level "Dry Test"', sf: 'SF-257', period: 'Monthly', lastInspection: '2026-04-15', nextInspection: '2026-05-15', status: 'Complete', keterangan: '' },
  { no: '11', item: 'Membrane Colorimetric Test Record', sf: 'SF-212', period: 'Monthly', lastInspection: '2026-04-25', nextInspection: '2026-05-25', status: 'Complete', keterangan: '' },
  { no: '12', item: 'ESB Check', sf: 'SF-252', period: 'Monthly', lastInspection: '2026-04-22', nextInspection: '2026-05-22', status: 'Complete', keterangan: '' },
  { no: '13', item: 'Free Vent/PV Valve', sf: 'SF-258', period: 'Monthly', lastInspection: '2026-04-18', nextInspection: '2026-05-18', status: 'Complete', keterangan: '' },
  { no: '14', item: 'Strainer Check', sf: 'SF-218', period: 'Monthly', lastInspection: '2026-04-17', nextInspection: '2026-05-17', status: 'Complete', keterangan: '' },
  { no: '15', item: 'Service ABC', sf: 'SF-225', period: 'Opr. Hours', lastInspection: '2026-04-15', nextInspection: '2026-05-15', status: 'Complete', keterangan: '' },
  { no: '16', item: 'Overfill Wet Test', sf: 'SF-256', period: '3 Monthly', lastInspection: '2026-03-03', nextInspection: '2026-06-01', status: 'Complete', keterangan: '' },
  { no: '17', item: 'Pressure & Surge Controller Test', sf: 'SF-221', period: '3 Monthly', lastInspection: '2026-04-01', nextInspection: '2026-06-30', status: 'Complete', keterangan: '' },
];

export default function CeklishMaintenanceClient() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MaintenanceChecklist | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemToPrint, setItemToPrint] = useState<MaintenanceChecklist | null>(null);
  const [isPrintingAll, setIsPrintingAll] = useState(false);

  const query = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'maintenance_checklists') as CollectionReference<MaintenanceChecklist>;
  }, [firestore]);

  const { data, loading } = useCollection<MaintenanceChecklist>(query);

  const handleSeed = async () => {
    if (!firestore || data?.length) return;
    setSeeding(true);
    try {
      const batch = writeBatch(firestore);
      const colRef = collection(firestore, 'maintenance_checklists');
      initialData.forEach((item) => {
        const docRef = doc(colRef);
        batch.set(docRef, item);
      });
      await batch.commit();
    } catch (error) {
      console.error("Error seeding data: ", error);
    } finally {
      setSeeding(false);
    }
  };

  // Notification Logic
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (data && 'Notification' in window && Notification.permission === 'granted') {
      const today = new Date();
      const overdueItems = data.filter(item => {
        if (!item.nextInspection) return false;
        const nextDate = parseISO(item.nextInspection);
        return item.status === 'Check' || isBefore(nextDate, today) || isToday(nextDate);
      });

      if (overdueItems.length > 0) {
        // Debounce or store last notified time in localStorage to avoid spamming
        const lastNotified = localStorage.getItem('lastMaintenanceNotification');
        const now = new Date().getTime();
        // Notify at most once every hour (3600000 ms)
        if (!lastNotified || now - parseInt(lastNotified) > 3600000) {
           new Notification('Peringatan Maintenance', {
             body: `Ada ${overdueItems.length} item sarana yang perlu di ceklish atau sudah lewat jadwal.`,
             icon: '/favicon.ico'
           });
           localStorage.setItem('lastMaintenanceNotification', now.toString());
        }
      }
    }
  }, [data]);

  const calculateReminder = (nextDateStr: string) => {
    if (!nextDateStr) return { text: '-', color: 'text-gray-500' };
    try {
      const nextDate = parseISO(nextDateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time for accurate day difference

      const diff = differenceInDays(nextDate, today);

      if (diff < 0) {
        return { text: `Lewat ${Math.abs(diff)} hari`, color: 'text-red-600 font-bold' };
      } else if (diff === 0) {
        return { text: 'Hari ini', color: 'text-orange-600 font-bold' };
      } else {
        return { text: `${diff} hari lagi`, color: 'text-green-600' };
      }
    } catch (e) {
      return { text: '-', color: 'text-gray-500' };
    }
  };

  const filteredData = data?.filter(item => 
    item.item.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sf.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => parseInt(a.no) - parseInt(b.no));

  const needsAttentionCount = data?.filter(item => {
    if (!item.nextInspection || item.status === 'Check') return true;
    const nextDate = parseISO(item.nextInspection);
    return isBefore(nextDate, new Date()) || isToday(nextDate);
  }).length || 0;


  const handlePrintAll = () => {
    setIsPrintingAll(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setIsPrintingAll(false), 1000);
    }, 100);
  };

  const handlePrint = (item: MaintenanceChecklist) => {
    setItemToPrint(item);
    setTimeout(() => {
      window.print();
      setTimeout(() => setItemToPrint(null), 1000);
    }, 100);
  };


  if (isPrintingAll && data) {
    return <PrintAllChecklists data={data} />;
  }

  if (itemToPrint) {

    return <PrintBlankForm item={itemToPrint} />;
  }

  return (
    <div className="space-y-6">
      {/* Alert Section */}
      {needsAttentionCount > 0 && (
        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
          <Bell className="h-5 w-5 !text-red-600" />
          <AlertTitle className="text-red-800 font-bold">Peringatan Maintenance!</AlertTitle>
          <AlertDescription>
            Terdapat <strong>{needsAttentionCount} item</strong> yang sudah masuk jadwal pemeriksaan atau lewat tenggat waktu. Segera lakukan ceklish.
          </AlertDescription>
        </Alert>
      )}

      <Card className="shadow-sm">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b gap-4">
          <div>
            <CardTitle className="text-2xl font-bold">Checklist Maintenance</CardTitle>
            <CardDescription>Manajemen formulir dan jadwal inspeksi AFT-DEO Sorong</CardDescription>
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
            

            {data && data.length > 0 && (
              <>
                <Button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Tambah Item</span>
                </Button>
                <Button onClick={handlePrintAll} variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                  <Printer className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Cetak Rekap</span>
                </Button>
              </>
            )}

            <Link href="/sarpras/ceklish-maintenance/history">
              <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                <History className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Riwayat</span>
              </Button>
            </Link>

            {data && data.length === 0 && (
              <Button onClick={handleSeed} disabled={seeding} variant="secondary">
                <RefreshCw className={`h-4 w-4 mr-2 ${seeding ? 'animate-spin' : ''}`} />
                {seeding ? 'Memproses...' : 'Seed Data'}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[1000px]">
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[50px] font-semibold text-center">No</TableHead>
                  <TableHead className="min-w-[200px] font-semibold">Item & Form</TableHead>
                  <TableHead className="w-[150px] font-semibold">Jadwal (Periode)</TableHead>
                  <TableHead className="w-[150px] font-semibold">Last Inspection</TableHead>
                  <TableHead className="w-[150px] font-semibold">Next Inspection</TableHead>
                  <TableHead className="w-[120px] font-semibold text-center">Status</TableHead>
                  <TableHead className="min-w-[150px] font-semibold">Keterangan</TableHead>
                  <TableHead className="w-[200px] font-semibold text-right pr-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                   Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={8} className="p-4"><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredData?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      Tidak ada data ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData?.map((row) => {
                    const reminderObj = calculateReminder(row.nextInspection);
                    
                    // Hitung status otomatis jika next inspection lewat atau hari ini
                    let displayStatus = row.status;
                    if (row.nextInspection) {
                      const nextDate = parseISO(row.nextInspection);
                      if (isBefore(nextDate, new Date()) || isToday(nextDate)) {
                        displayStatus = 'Check';
                      } else {
                        displayStatus = 'Complete';
                      }
                    }

                    return (
                      <TableRow key={row.id} className="hover:bg-slate-50/50">
                        <TableCell className="text-center font-medium">{row.no}</TableCell>
                        <TableCell>
                          <div className="font-semibold text-gray-900">{row.item}</div>
                          <div className="text-xs text-muted-foreground">{row.sf}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-slate-100">{row.period}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {row.lastInspection ? format(parseISO(row.lastInspection), 'dd MMM yyyy', { locale: id }) : '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {row.nextInspection ? format(parseISO(row.nextInspection), 'dd MMM yyyy', { locale: id }) : '-'}
                          </div>
                          <div className={`text-xs ${reminderObj.color}`}>
                            {reminderObj.text}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge 
                            variant={displayStatus === 'Complete' ? 'default' : 'destructive'}
                            className={displayStatus === 'Complete' ? 'bg-green-600' : ''}
                          >
                            {displayStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                           {row.keterangan ? (
                              <div className="text-sm text-gray-700 line-clamp-2" title={row.keterangan}>
                                {row.keterangan}
                              </div>
                           ) : (
                             <div className="text-sm italic text-gray-400">Belum ada keterangan</div>
                           )}
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <div className="flex justify-end gap-2">
                            {row.formUrl && (
                              <a href={row.formUrl} target="_blank" rel="noopener noreferrer">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8 px-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                                  title="Lihat Hasil Inspeksi"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>
                                </Button>
                              </a>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 px-2"
                              onClick={() => handlePrint(row)}
                            >
                              <Printer className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Cetak</span>
                            </Button>
                            <Button 
                              size="sm" 
                              className="h-8 px-2 bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => {
                                setSelectedItem(row);
                                setIsModalOpen(true);
                              }}
                            >
                              <FileEdit className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">Update</span>
                            </Button>
                          </div>
                        </TableCell>
</TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Action Modal */}
      {selectedItem && (
        <CeklishActionModal 
          isOpen={isModalOpen}
          setIsOpen={setIsModalOpen}
          item={selectedItem}
        />
      )}

      {/* Add Modal */}
      <AddCeklishModal 
        isOpen={isAddModalOpen} 
        setIsOpen={setIsAddModalOpen} 
      />
    </div>
  );
}
