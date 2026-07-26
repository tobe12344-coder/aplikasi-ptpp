'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useCollection, useMemoFirebase, useStorage } from '@/firebase';
import { collection, query, orderBy, type CollectionReference } from 'firebase/firestore';
import { addCalibration, updateCalibration, deleteCalibration } from '@/firebase/firestore/sarpras';
import type { CalibrationRecord } from '@/lib/types';
import { differenceInDays, startOfDay, format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit2, Trash2, Loader2, AlertCircle, Bell, Search, Printer, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { writeBatch, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
  usulanProgram: z.string().optional().default('KALIBRASI EKSTERNAL'),
  keterangan: z.string().optional().default(''),
});

type CalibrationFormValues = z.infer<typeof calibrationSchema>;

export default function CalibrationClient() {
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certYear, setCertYear] = useState<string>(new Date().getFullYear().toString());
  const [downloadingRecord, setDownloadingRecord] = useState<CalibrationRecord | null>(null);

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
      usulanProgram: 'KALIBRASI EKSTERNAL',
      keterangan: '',
    },
  });

  const onSubmit = async (values: CalibrationFormValues) => {
    setIsSubmitting(true);
    try {
      let certificates = editingId ? (records?.find(r => r.id === editingId)?.certificates || []) : [];
      let newCertificates = [...certificates];

      if (editingId && certFile && storage) {
        const timestamp = new Date().getTime();
        const fileRef = ref(storage, `calibrations/${editingId}/${timestamp}_${certFile.name}`);
        await uploadBytes(fileRef, certFile);
        const fileUrl = await getDownloadURL(fileRef);
        
        newCertificates.push({ 
          year: certYear || new Date().getFullYear().toString(), 
          fileUrl, 
          fileName: certFile.name,
          uploadedAt: new Date().toISOString()
        });
      }

      const payload = { ...values, certificates: newCertificates };

      if (editingId) {
        updateCalibration(firestore, editingId, payload);
        toast({ title: 'Berhasil', description: 'Data kalibrasi diperbarui.' });
      } else {
        addCalibration(firestore, payload);
        toast({ title: 'Berhasil', description: 'Data kalibrasi ditambahkan.' });
      }
      setIsDialogOpen(false);
      form.reset();
      setEditingId(null);
      setCertFile(null);
      setCertYear(new Date().getFullYear().toString());
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal menyimpan data.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (record: CalibrationRecord) => {
    setEditingId(record.id);
    setCertFile(null);
    setCertYear(new Date().getFullYear().toString());
    form.reset({
      kategori: record.kategori,
      namaPeralatan: record.namaPeralatan,
      noSeri: record.noSeri || '',
      tahunPemakaian: record.tahunPemakaian,
      kondisiFisik: record.kondisiFisik,
      teraTerakhir: record.teraTerakhir,
      teraBerikutnya: record.teraBerikutnya,
      usulanProgram: record.usulanProgram || 'KALIBRASI EKSTERNAL',
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
    if (!firestore) return;
    setSeeding(true);
    try {
      const batch = writeBatch(firestore);
      const colRef = collection(firestore, 'calibrations');

      // Delete existing records to allow re-seeding with clean data
      if (records && records.length > 0) {
        records.forEach(record => {
          batch.delete(doc(colRef, record.id));
        });
      }

      initialData.forEach((item) => {
        const docRef = doc(colRef);
        batch.set(docRef, { ...item, timestamp: new Date() });
      });
      await batch.commit();
      toast({ title: 'Berhasil', description: `${initialData.length} Data kalibrasi berhasil diperbarui.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal melakukan pembaruan data.' });
    } finally {
      setSeeding(false);
    }
  };

  const openAddDialog = () => {
    setEditingId(null);
    setCertFile(null);
    setCertYear(new Date().getFullYear().toString());
    form.reset({
      kategori: 'FLOW METER',
      namaPeralatan: '',
      noSeri: '',
      tahunPemakaian: new Date().getFullYear().toString(),
      kondisiFisik: 'Berfungsi',
      teraTerakhir: format(new Date(), 'yyyy-MM-dd'),
      teraBerikutnya: format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), 'yyyy-MM-dd'),
      usulanProgram: 'KALIBRASI EKSTERNAL',
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

  const generatePDF = async () => {
    if (!records || records.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Tidak ada data untuk dicetak.' });
      return;
    }

    // Dynamic import to avoid Next.js SSR issues with browser objects
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    let logoBase64: string | null = null;
    try {
      const response = await fetch('/logo-pertamina.png');
      const blob = await response.blob();
      logoBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error("Failed to load logo", e);
    }

    const doc = new jsPDF('landscape', 'mm', 'a4');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`DAFTAR KALIBRASI DAN TERA PERALATAN ${new Date().getFullYear()}`, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });

    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', doc.internal.pageSize.getWidth() - 50, 5, 40, 10);
    }

    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const currentMonth = monthNames[new Date().getMonth()];
    doc.setFontSize(10);
    doc.text(`AFT : DEO - ${currentMonth}`, 14, 25);

    const tableData: any[] = [];
    categories.forEach((cat, catIdx) => {
      tableData.push([
        { content: String.fromCharCode(65 + catIdx), styles: { fontStyle: 'bold', fillColor: [230, 240, 250], textColor: [15, 23, 42] } },
        { content: cat, styles: { fontStyle: 'bold', fillColor: [230, 240, 250], textColor: [15, 23, 42] } },
        { content: '', styles: { fillColor: [230, 240, 250] } },
        { content: '', styles: { fillColor: [230, 240, 250] } },
        { content: '', styles: { fillColor: [230, 240, 250] } },
        { content: '', styles: { fillColor: [230, 240, 250] } },
        { content: '', styles: { fillColor: [230, 240, 250] } },
        { content: '', styles: { fillColor: [230, 240, 250] } }
      ]);

      groupedRecords[cat].forEach((record, idx) => {
        const teraT = record.teraTerakhir ? format(new Date(record.teraTerakhir), 'dd-MMM-yy') : '';
        const teraB = record.teraBerikutnya ? format(new Date(record.teraBerikutnya), 'dd-MMM-yy') : '';
        const ket = ''; // Dikosongkan sesuai permintaan
        const namaPeralatan = record.noSeri ? `${record.namaPeralatan}\nNo. Seri: ${record.noSeri}` : record.namaPeralatan;

        tableData.push([
          (idx + 1).toString(),
          { content: namaPeralatan, isItem: true, nama: record.namaPeralatan, seri: record.noSeri },
          record.tahunPemakaian || '',
          record.kondisiFisik || '',
          teraT,
          teraB,
          record.usulanProgram || 'KALIBRASI EKSTERNAL',
          ket
        ]);
      });
    });

    autoTable(doc, {
      startY: 32,
      head: [['NO', 'NAMA PERALATAN', 'TH. PEMAKAIAN', 'KONDISI FISIK\n(BERFUNGSI/TIDAK BERFUNGSI)', 'Tera Terakhir', 'Tanggal Kalibrasi/Tera', 'USULAN DAN PROGRAM', 'KETERANGAN']],
      body: tableData,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 3,
        lineColor: [200, 204, 208],
        lineWidth: 0.1,
        textColor: [0, 0, 0]
      },
      headStyles: {
        fillColor: [15, 45, 110],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        valign: 'middle',
        lineColor: [15, 45, 110]
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 75 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 35, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 25, halign: 'center' },
        6: { cellWidth: 40, halign: 'center' },
        7: { cellWidth: 35 }
      },
      willDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 1 && data.cell.raw && (data.cell.raw as any).isItem) {
          data.cell.text = [];
        }
      },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 1 && data.cell.raw && (data.cell.raw as any).isItem) {
          const raw = data.cell.raw as any;
          const textX = Number(data.cell.x || 0) + 3;
          const textY = Number(data.cell.y || 0) + 5.5;

          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          doc.text(String(raw.nama || '-'), textX, textY);

          if (raw.seri) {
            doc.setFont('helvetica', 'normal');
            doc.text(`No. Seri: ${raw.seri}`, textX, textY + 3.5);
          }
        }
      }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 30;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text("SF 234 - Daftar Kalibrasi & Tera Peralatan Rev.0 - DPPU DEO-Sorong", doc.internal.pageSize.getWidth() - 14, finalY + 15, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text("Spv. Maintenance", doc.internal.pageSize.getWidth() - 35, finalY + 30, { align: 'center' });
    doc.setLineWidth(0.5);
    doc.line(doc.internal.pageSize.getWidth() - 60, finalY + 50, doc.internal.pageSize.getWidth() - 10, finalY + 50);
    doc.text("Kiamnasmeithson", doc.internal.pageSize.getWidth() - 35, finalY + 54, { align: 'center' });

    doc.save(`Kalibrasi_Tera_${currentMonth}_${new Date().getFullYear()}.pdf`);
  };

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

            <Button onClick={generatePDF} variant="outline" className="shrink-0 print:hidden">
              <Printer className="mr-2 h-4 w-4" /> Download PDF
            </Button>

            <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0 print:hidden">
              <Plus className="mr-2 h-4 w-4" /> Tambah
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-[1200px]">
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[50px] font-semibold text-center">No</TableHead>
                  <TableHead className="min-w-[300px] font-semibold">Nama Peralatan</TableHead>
                  <TableHead className="w-[150px] font-semibold text-center">Kondisi Fisik</TableHead>
                  <TableHead className="w-[150px] font-semibold text-center">Tera Terakhir</TableHead>
                  <TableHead className="w-[150px] font-semibold text-center">Tanggal Kalibrasi/Tera</TableHead>
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
                                {record.certificates && record.certificates.length > 0 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 w-8 p-0 border-green-600 text-green-600 hover:bg-green-50"
                                    title="Download Sertifikat"
                                    onClick={() => setDownloadingRecord(record)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                )}
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
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!editingId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori peralatan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="FLOW METER">FLOW METER</SelectItem>
                        <SelectItem value="TANKI TIMBUN/REFUELLER">TANKI TIMBUN/REFUELLER</SelectItem>
                        <SelectItem value="PERALATAN LAIN">PERALATAN LAIN</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <FormControl><Input placeholder="Contoh: 2024" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="kondisiFisik" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kondisi Fisik</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kondisi" />
                        </SelectTrigger>
                      </FormControl>
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
                    <FormLabel>Tanggal Kalibrasi/Tera</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="usulanProgram" render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel>Usulan dan Program</FormLabel>
                    <FormControl><Input placeholder="Contoh: KALIBRASI EKSTERNAL" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {editingId && (
                  <div className="col-span-1 md:col-span-2 border rounded-md p-4 bg-slate-50 space-y-4">
                    <h4 className="font-semibold text-sm">Upload Sertifikat Kalibrasi</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <FormLabel>File Sertifikat</FormLabel>
                        <Input 
                          type="file" 
                          onChange={(e) => setCertFile(e.target.files?.[0] || null)} 
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Sertifikat akan diunggah saat Anda menyimpan perubahan. Semua riwayat sertifikat akan tersimpan dan dapat didownload.
                    </p>
                  </div>
                )}
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
      <Dialog open={!!downloadingRecord} onOpenChange={(open) => !open && setDownloadingRecord(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Download Sertifikat Kalibrasi</DialogTitle>
            <DialogDescription>
              Pilih tahun sertifikat kalibrasi yang ingin diunduh untuk <span className="font-semibold text-black">{downloadingRecord?.namaPeralatan}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 my-2 max-h-[60vh] overflow-y-auto pr-2">
            {downloadingRecord?.certificates?.sort((a, b) => {
              if (a.uploadedAt && b.uploadedAt) {
                return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
              }
              return Number(b.year) - Number(a.year);
            }).map((cert, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 border rounded-md hover:bg-slate-50 transition-colors">
                <div className="overflow-hidden pr-2">
                  <div className="font-semibold text-sm">
                    {cert.uploadedAt ? `Sertifikat (${format(new Date(cert.uploadedAt), 'dd MMM yyyy, HH:mm')})` : `Sertifikat Tahun ${cert.year}`}
                  </div>
                  <div className="text-xs text-gray-500 truncate" title={cert.fileName}>{cert.fileName}</div>
                </div>
                <Button size="sm" onClick={() => window.open(cert.fileUrl, '_blank')} className="bg-green-600 hover:bg-green-700 shrink-0">
                  <Download className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Download</span>
                </Button>
              </div>
            ))}
            {!downloadingRecord?.certificates?.length && (
              <div className="text-center text-gray-500 py-4">Belum ada sertifikat yang diunggah.</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDownloadingRecord(null)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
