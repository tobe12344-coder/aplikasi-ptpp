'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, type CollectionReference } from 'firebase/firestore';
import { addCalibration, updateCalibration, deleteCalibration } from '@/firebase/firestore/sarpras';
import type { CalibrationRecord } from '@/lib/types';
import { differenceInDays, startOfDay, format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Loader2, AlertCircle, Bell, Search, Printer } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { writeBatch, doc } from 'firebase/firestore';

const initialData = [
  // A FLOW METER
  { kategori: 'FLOW METER', namaPeralatan: 'Refueller DEO-10 : Liquid Control DFV100', tahunPemakaian: '2010', kondisiFisik: 'Berfungsi', teraTerakhir: '2024-07-26', teraBerikutnya: '2025-07-26', keterangan: 'No. Seri : 1915008' },
  { kategori: 'FLOW METER', namaPeralatan: 'Refueller DEO-12 : Liquid Control DFV100', tahunPemakaian: '2014', kondisiFisik: 'Berfungsi', teraTerakhir: '2024-07-26', teraBerikutnya: '2025-07-26', keterangan: 'No. Seri : 1336011' },
  { kategori: 'FLOW METER', namaPeralatan: 'Refueller DEO-14 : Liquid Control DFV100', tahunPemakaian: '2014', kondisiFisik: 'Berfungsi', teraTerakhir: '2024-07-26', teraBerikutnya: '2025-07-26', keterangan: 'No. Seri : 2023010' },
  { kategori: 'FLOW METER', namaPeralatan: 'Refueller DEO-15 : ZATAM EQUALIS', tahunPemakaian: '2017', kondisiFisik: 'Berfungsi', teraTerakhir: '2024-07-26', teraBerikutnya: '2025-07-26', keterangan: 'No. Seri : 17073' },

  // B TANKI TIMBUN/REFUELLER
  { kategori: 'TANKI TIMBUN/REFUELLER', namaPeralatan: 'Tangki Vertikal T-201', tahunPemakaian: '2019', kondisiFisik: 'Berfungsi', teraTerakhir: '2024-07-26', teraBerikutnya: '2025-07-26', keterangan: 'NMR 81 / N4002B01172' },
  { kategori: 'TANKI TIMBUN/REFUELLER', namaPeralatan: 'Tangki Vertikal T-202', tahunPemakaian: '2019', kondisiFisik: 'Berfungsi', teraTerakhir: '2024-07-26', teraBerikutnya: '2025-07-26', keterangan: 'NMR 81 / NA000101172' },
  { kategori: 'TANKI TIMBUN/REFUELLER', namaPeralatan: 'Tangki Vertikal T-203', tahunPemakaian: '2019', kondisiFisik: 'Berfungsi', teraTerakhir: '2024-07-26', teraBerikutnya: '2025-07-26', keterangan: 'NMR 81 / N4002A01172' },

  // C PERALATAN LAIN
  { kategori: 'PERALATAN LAIN', namaPeralatan: 'Master Meter : SATAM ZC1780', tahunPemakaian: '2015', kondisiFisik: 'Berfungsi', teraTerakhir: '2024-07-11', teraBerikutnya: '2025-07-11', keterangan: 'No. Seri : 13337CD' },
  { kategori: 'PERALATAN LAIN', namaPeralatan: 'Torque Wrench 80N-m : J6006MC', tahunPemakaian: '2020', kondisiFisik: 'Berfungsi', teraTerakhir: '2023-10-21', teraBerikutnya: '2028-10-19', keterangan: 'DVC14815' },
  { kategori: 'PERALATAN LAIN', namaPeralatan: "Thermometer Range -20 s/d 102 'C (MASTER)", tahunPemakaian: '2022', kondisiFisik: 'Berfungsi', teraTerakhir: '2024-03-05', teraBerikutnya: '2025-03-05', keterangan: 'SN : 33050199' },
  { kategori: 'PERALATAN LAIN', namaPeralatan: "Thermometer Range -20 s/d 102 'C", tahunPemakaian: '2024', kondisiFisik: 'Berfungsi', teraTerakhir: '2024-03-05', teraBerikutnya: '2025-03-05', keterangan: 'SN : 33060246' },
  { kategori: 'PERALATAN LAIN', namaPeralatan: 'Hydrometer 750-800 0,5 Kg/m3 (Master)', tahunPemakaian: '2022', kondisiFisik: 'Berfungsi', teraTerakhir: '2024-04-25', teraBerikutnya: '2025-04-25', keterangan: 'SN : 280735' },
  { kategori: 'PERALATAN LAIN', namaPeralatan: 'Hydrometer 800-850 0,5 Kg/m3 (Master)', tahunPemakaian: '2022', kondisiFisik: 'Berfungsi', teraTerakhir: '2024-04-25', teraBerikutnya: '2025-04-25', keterangan: 'SN : 282975' },
  { kategori: 'PERALATAN LAIN', namaPeralatan: 'Hydrometer 750-850 Kg/m3 (Master)', tahunPemakaian: '2022', kondisiFisik: 'Berfungsi', teraTerakhir: '2023-10-21', teraBerikutnya: '2024-10-20', keterangan: 'SN : 227415' },
  { kategori: 'PERALATAN LAIN', namaPeralatan: 'Prerssure Gauge 0-200 psi (Master)', tahunPemakaian: '2022', kondisiFisik: 'Berfungsi', teraTerakhir: '2023-10-21', teraBerikutnya: '2024-10-20', keterangan: 'SN : 181520333' },
  { kategori: 'PERALATAN LAIN', namaPeralatan: 'Tongkat Ukur 2 meter / 1,0 mm', tahunPemakaian: '2022', kondisiFisik: 'Berfungsi', teraTerakhir: '2022-08-05', teraBerikutnya: '2023-08-05', keterangan: 'SN : 21346' },
  { kategori: 'PERALATAN LAIN', namaPeralatan: 'Depth Tape 15 meter / 1,0 mm', tahunPemakaian: '2022', kondisiFisik: 'Berfungsi', teraTerakhir: '2022-08-05', teraBerikutnya: '2023-08-05', keterangan: 'SN : 21347' },
  { kategori: 'PERALATAN LAIN', namaPeralatan: 'Multimeter/AVO Meter', tahunPemakaian: '2020', kondisiFisik: 'Berfungsi', teraTerakhir: '2022-03-16', teraBerikutnya: '2022-08-28', keterangan: 'SN : 17055007733' },
  { kategori: 'PERALATAN LAIN', namaPeralatan: 'Gas Detector MSA', tahunPemakaian: '2021', kondisiFisik: 'Berfungsi', teraTerakhir: '2024-02-17', teraBerikutnya: '2025-02-16', keterangan: 'SN : 00468239-D17' },
  { kategori: 'PERALATAN LAIN', namaPeralatan: 'Gas Detecor MICROCLIP', tahunPemakaian: '2023', kondisiFisik: 'Berfungsi', teraTerakhir: '2023-06-09', teraBerikutnya: '2024-06-08', keterangan: 'SN : KA422-1119913' },
  { kategori: 'PERALATAN LAIN', namaPeralatan: 'EMCE Meter 1153', tahunPemakaian: '2022', kondisiFisik: 'Berfungsi', teraTerakhir: '2024-02-16', teraBerikutnya: '2025-02-15', keterangan: 'SN : 401.214' },
  { kategori: 'PERALATAN LAIN', namaPeralatan: 'EMCE Meter 1153', tahunPemakaian: '2021', kondisiFisik: 'Berfungsi', teraTerakhir: '2021-03-22', teraBerikutnya: '2024-03-21', keterangan: 'Operasional' },
];

const calibrationSchema = z.object({
  kategori: z.string().min(1, 'Kategori wajib diisi'),
  namaPeralatan: z.string().min(1, 'Nama peralatan wajib diisi'),
  noSeri: z.string().optional().default(''),
  tahunPemakaian: z.string().min(4, 'Tahun pemakaian tidak valid'),
  kondisiFisik: z.enum(['Berfungsi', 'Tidak Berfungsi']),
  teraTerakhir: z.string().min(1, 'Tanggal tera terakhir wajib diisi'),
  teraBerikutnya: z.string().min(1, 'Tanggal tera berikutnya wajib diisi'),
  keterangan: z.string().optional().default(''),
});

type CalibrationFormValues = z.infer<typeof calibrationSchema>;

export default function CalibrationClient() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [seeding, setSeeding] = useState(false);

  const calibrationQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'calibrations') as CollectionReference<CalibrationRecord>, orderBy('timestamp', 'desc'));
  }, [firestore]);

  const { data: records, loading } = useCollection<CalibrationRecord>(calibrationQuery);

  const form = useForm<CalibrationFormValues>({
    resolver: zodResolver(calibrationSchema),
    defaultValues: {
      kategori: 'FLOW METER',
      namaPeralatan: '',
      noSeri: '',
      tahunPemakaian: new Date().getFullYear().toString(),
      kondisiFisik: 'Berfungsi',
      teraTerakhir: format(new Date(), 'yyyy-MM-dd'),
      teraBerikutnya: format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), 'yyyy-MM-dd'),
      keterangan: '',
    },
  });

  const onSubmit = async (values: CalibrationFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingId) {
        updateCalibration(firestore, editingId, values);
        toast({ title: 'Berhasil', description: 'Data kalibrasi diperbarui.' });
      } else {
        addCalibration(firestore, values);
        toast({ title: 'Berhasil', description: 'Data kalibrasi ditambahkan.' });
      }
      setIsDialogOpen(false);
      form.reset();
      setEditingId(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal menyimpan data.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (record: CalibrationRecord) => {
    setEditingId(record.id);
    form.reset({
      kategori: record.kategori,
      namaPeralatan: record.namaPeralatan,
      noSeri: record.noSeri || '',
      tahunPemakaian: record.tahunPemakaian,
      kondisiFisik: record.kondisiFisik,
      teraTerakhir: record.teraTerakhir,
      teraBerikutnya: record.teraBerikutnya,
      keterangan: record.keterangan || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    try {
      deleteCalibration(firestore, id);
      toast({ title: 'Berhasil', description: 'Data dihapus.' });
      setDeleteConfirmId(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal menghapus data.' });
    }
  };

  const handleSeed = async () => {
    if (!firestore || records?.length) return;
    setSeeding(true);
    try {
      const batch = writeBatch(firestore);
      const colRef = collection(firestore, 'calibrations');
      initialData.forEach((item) => {
        const docRef = doc(colRef);
        batch.set(docRef, { ...item, timestamp: new Date() });
      });
      await batch.commit();
      toast({ title: 'Berhasil', description: '22 Data kalibrasi berhasil di-seed.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal melakukan seed data.' });
    } finally {
      setSeeding(false);
    }
  };

  const openAddDialog = () => {
    setEditingId(null);
    form.reset({
      kategori: 'FLOW METER',
      namaPeralatan: '',
      noSeri: '',
      tahunPemakaian: new Date().getFullYear().toString(),
      kondisiFisik: 'Berfungsi',
      teraTerakhir: format(new Date(), 'yyyy-MM-dd'),
      teraBerikutnya: format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), 'yyyy-MM-dd'),
      keterangan: '',
    });
    setIsDialogOpen(true);
  };

  const getReminder = (teraBerikutnya: string) => {
    if (!teraBerikutnya) return { text: '-', color: 'text-gray-900' };
    
    const nextDate = startOfDay(new Date(teraBerikutnya));
    const today = startOfDay(new Date());
    const diffDays = differenceInDays(nextDate, today);

    if (diffDays < 0) {
      return { 
        text: `Lewat ${Math.abs(diffDays)} hari`, 
        color: 'text-red-600 font-bold'
      };
    } else if (diffDays === 0) {
      return { 
        text: 'Hari ini', 
        color: 'text-orange-600 font-bold' 
      };
    } else {
      return { 
        text: `${diffDays} hari lagi`, 
        color: 'text-green-600' 
      };
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'dd-MMM-yy');
    } catch (e) {
      return dateStr;
    }
  };

  // Grouping & Filtering
  const filteredRecords = records?.filter(record => 
    record.namaPeralatan.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (record.keterangan && record.keterangan.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const groupedRecords = filteredRecords?.reduce((acc, record) => {
    if (!acc[record.kategori]) acc[record.kategori] = [];
    acc[record.kategori].push(record);
    return acc;
  }, {} as Record<string, CalibrationRecord[]>) || {};

  const categories = Object.keys(groupedRecords).sort();

  const needsAttentionCount = records?.filter(item => {
    if (!item.teraBerikutnya) return false;
    const nextDate = startOfDay(new Date(item.teraBerikutnya));
    const today = startOfDay(new Date());
    const diffDays = differenceInDays(nextDate, today);
    return diffDays <= 0;
  }).length || 0;

  return (
    <div className="space-y-6">
      {/* Alert Section */}
      {needsAttentionCount > 0 && (
        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
          <Bell className="h-5 w-5 !text-red-600" />
          <AlertTitle className="text-red-800 font-bold">Peringatan Kalibrasi!</AlertTitle>
          <AlertDescription>
            Terdapat <strong>{needsAttentionCount} item</strong> yang sudah lewat jadwal kalibrasi atau jatuh tempo hari ini.
          </AlertDescription>
        </Alert>
      )}

      <Card className="shadow-sm">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b gap-4 print:hidden">
          <div>
            <CardTitle className="text-2xl font-bold">Kalibrasi dan Tera Peralatan</CardTitle>
            <CardDescription>Manajemen data kalibrasi dan tera peralatan sarpras</CardDescription>
          </div>
          
          <div className="flex w-full md:w-auto items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari peralatan..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Button onClick={() => window.print()} variant="outline" className="shrink-0 print:hidden">
              <Printer className="mr-2 h-4 w-4" /> Cetak
            </Button>

            {records && records.length === 0 && (
              <Button onClick={handleSeed} disabled={seeding} variant="secondary" className="shrink-0 print:hidden">
                <Loader2 className={`h-4 w-4 mr-2 ${seeding ? 'animate-spin' : 'hidden'}`} />
                {seeding ? 'Memproses...' : 'Seed Data'}
              </Button>
            )}

            <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 print:hidden">
              <Plus className="mr-2 h-4 w-4" /> Tambah
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[1000px]">
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[50px] font-semibold text-center">No</TableHead>
                  <TableHead className="min-w-[200px] font-semibold">Nama Peralatan & Keterangan</TableHead>
                  <TableHead className="w-[150px] font-semibold text-center">Kondisi Fisik</TableHead>
                  <TableHead className="w-[150px] font-semibold text-center">Tera Terakhir</TableHead>
                  <TableHead className="w-[150px] font-semibold text-center">Tera Berikutnya</TableHead>
                  <TableHead className="w-[150px] font-semibold text-center text-red-600 print:text-black">Reminder</TableHead>
                  <TableHead className="w-[200px] font-semibold text-right pr-6 print:hidden">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                   Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={7} className="p-4"><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredRecords?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      Tidak ada data ditemukan.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((cat, catIdx) => (
                    <React.Fragment key={cat}>
                      <TableRow className="bg-slate-50/50">
                        <TableCell className="font-semibold text-center text-sm">{String.fromCharCode(65 + catIdx)}</TableCell>
                        <TableCell colSpan={6} className="font-semibold text-sm text-gray-700 print:hidden">
                          {cat}
                        </TableCell>
                        <TableCell colSpan={5} className="font-semibold text-sm text-gray-700 hidden print:table-cell">
                          {cat}
                        </TableCell>
                      </TableRow>
                      {groupedRecords[cat].map((record, i) => {
                        const reminder = getReminder(record.teraBerikutnya);
                        return (
                          <TableRow key={record.id} className="hover:bg-slate-50/50">
                            <TableCell className="text-center font-medium">{i + 1}</TableCell>
                            <TableCell>
                              <div className="font-semibold text-gray-900">{record.namaPeralatan}</div>
                              {record.noSeri && (
                                <div className="text-xs font-semibold text-slate-700 mt-0.5">No. Seri: {record.noSeri}</div>
                              )}
                              <div className="text-xs text-muted-foreground mt-0.5">Th. Pemakaian: {record.tahunPemakaian}</div>
                              {record.keterangan && (
                                <div className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">{record.keterangan}</div>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${record.kondisiFisik === 'Berfungsi' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {record.kondisiFisik}
                              </span>
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {formatDate(record.teraTerakhir)}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="font-medium">
                                {formatDate(record.teraBerikutnya)}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className={`text-xs ${reminder.color}`}>
                                {reminder.text}
                              </span>
                            </TableCell>
                            <TableCell className="text-right pr-4 print:hidden">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  size="sm" 
                                  className="h-8 px-2 bg-blue-600 hover:bg-blue-700 text-white"
                                  onClick={() => handleEdit(record)}
                                >
                                  <Edit2 className="h-4 w-4 sm:mr-2" />
                                  <span className="hidden sm:inline">Update</span>
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  className="h-8 px-2"
                                  onClick={() => setDeleteConfirmId(record.id)}
                                >
                                  <Trash2 className="h-4 w-4 sm:mr-2" />
                                  <span className="hidden sm:inline">Hapus</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" /> Konfirmasi Hapus
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 my-4">
            Apakah Anda yakin ingin menghapus data peralatan ini? Tindakan ini tidak dapat dibatalkan.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Batal</Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>Hapus Data</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Footer / Signature Area */}
      <div className="hidden print:block w-full text-black mt-8">
        <p className="text-sm italic border-b border-black pb-1 w-fit mb-8">SF 234 - Daftar Kalibrasi & Tera Peralatan Rev.0 - DPPU DEO-Sorong</p>
        <div className="flex justify-end mt-16 pr-12">
          <div className="text-center">
            <p className="font-bold mb-24">Spv. Maintenance</p>
            <p className="font-bold underline decoration-1 underline-offset-4">Kiamnasmeithson</p>
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Peralatan' : 'Tambah Peralatan Baru'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="kategori" render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel>Kategori Peralatan</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: FLOW METER, PERALATAN LAIN" {...field} disabled={!!editingId} />
                    </FormControl>
                    <p className="text-[10px] text-muted-foreground mt-1">Ketikkan kategori, misal: FLOW METER, TANKI TIMBUN/REFUELLER, PERALATAN LAIN</p>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="namaPeralatan" render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel>Nama Peralatan</FormLabel>
                    <FormControl><Input placeholder="Contoh: Refueller DEO-10" {...field} disabled={!!editingId} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="noSeri" render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel>No. Seri / Kode Unit</FormLabel>
                    <FormControl><Input placeholder="Contoh: 1915008" {...field} disabled={!!editingId} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="tahunPemakaian" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tahun Pemakaian</FormLabel>
                    <FormControl><Input type="number" placeholder="Contoh: 2010" {...field} disabled={!!editingId} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="kondisiFisik" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kondisi Fisik</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Pilih kondisi" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Berfungsi">Berfungsi</SelectItem>
                        <SelectItem value="Tidak Berfungsi">Tidak Berfungsi</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="teraTerakhir" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tera Terakhir</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="teraBerikutnya" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tera Berikutnya</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="keterangan" render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel>Keterangan (Opsional)</FormLabel>
                    <FormControl><Textarea placeholder="Tambahkan keterangan (opsional)" {...field} className="resize-none" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Batal</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</> : 'Simpan Data'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
