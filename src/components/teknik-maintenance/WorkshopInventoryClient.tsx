'use client';

import { useState, useMemo, useRef } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser, useStorage } from '@/firebase';
import { collection, query, orderBy, type CollectionReference } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { WorkshopMaterial, WorkshopTransaction, Employee } from '@/lib/types';
import { addWorkshopMaterial, updateWorkshopMaterial, deleteWorkshopMaterial, addWorkshopTransaction } from '@/firebase/firestore/workshop';
import { sendWhatsAppNotification } from '@/app/actions/fonnte';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Plus, Search, ArrowDownCircle, ArrowUpCircle, Package, History, Info, Trash2, Edit, ImageIcon, Camera, Loader2, RefreshCcw, FileText, Printer, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { format } from 'date-fns';
import { id as indonesiaLocale } from 'date-fns/locale';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { FullscreenWebcam } from '@/components/common/FullscreenWebcam';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

interface WorkshopInventoryClientProps {
  }

const resizeAndCompressImage = (base64Str: string, maxWidth = 1200, maxHeight = 1200): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      } else {
        resolve(base64Str);
      }
    };
  });
};

export default function WorkshopInventoryClient({ }: WorkshopInventoryClientProps) {
  // Dynamic employees
  const firestore = useFirestore();
  const employeesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'employees') as CollectionReference<Employee>) : null, [firestore]);
  const { data: employeesData } = useCollection<Employee>(employeesQuery);
  const employees = employeesData || [];

  const { toast } = useToast();

  const storage = useStorage();
  const { user } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReportMonth, setSelectedReportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isAddMaterialOpen, setAddMaterialOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<WorkshopMaterial | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Queries
  const materialQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'workshop-materials') as CollectionReference<WorkshopMaterial>, orderBy('name', 'asc')) : null, 
    [firestore]
  );
  const transactionQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'workshop-transactions') as CollectionReference<WorkshopTransaction>, orderBy('timestamp', 'desc')) : null, 
    [firestore]
  );

  const { data: materials, loading: loadingMaterials } = useCollection<WorkshopMaterial>(materialQuery);
  const { data: transactions, loading: loadingTransactions } = useCollection<WorkshopTransaction>(transactionQuery);

  // Master Data Logic
  const filteredMaterials = useMemo(() => {
    if (!materials) return [];
    return materials.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [materials, searchTerm]);

  // Global Monthly Filter Logic (Controls Masuk, Keluar, and Report tabs)
  const monthlyTransactions = useMemo(() => {
    if (!transactions) return [];
    return transactions.filter(t => t.date.startsWith(selectedReportMonth));
  }, [transactions, selectedReportMonth]);

  const [reportTypeFilter, setReportTypeFilter] = useState<'Semua' | 'Masuk' | 'Keluar'>('Semua');

  const displayedReportTransactions = useMemo(() => {
    if (reportTypeFilter === 'Semua') return monthlyTransactions;
    return monthlyTransactions.filter(t => t.type === reportTypeFilter);
  }, [monthlyTransactions, reportTypeFilter]);

  const [materialForm, setMaterialForm] = useState<{
    name: string;
    code: string;
    type: string;
    location: string;
    unit: string;
    photo?: string;
  }>({
    name: '',
    code: '',
    type: '',
    location: '',
    unit: '',
    photo: '' 
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const [transForm, setTransForm] = useState({
    materialId: '', quantity: 1, type: 'Masuk' as 'Masuk' | 'Keluar', date: new Date().toISOString().split('T')[0], officer: '', notes: ''
  });

  const handleCapturePhoto = () => {
    setIsCameraActive(true);
  };


  const handleSaveMaterial = async () => {
    if (!materialForm.name || !materialForm.code) {
      toast({ variant: 'destructive', title: 'Error', description: 'Nama dan Kode wajib diisi.' });
      return;
    }

    setIsUploading(true);
    let finalPhotoUrl = materialForm.photo;

    try {
      if (photoPreview && photoPreview.startsWith('data:')) {
        const response = await fetch(photoPreview);
        const blob = await response.blob();
        const path = `workshop/materials/${Date.now()}_${materialForm.code.replace(/\s+/g, '_')}.jpg`;
        const fRef = storageRef(storage, path);
        await uploadBytes(fRef, blob);
        finalPhotoUrl = await getDownloadURL(fRef);
      }

      const payload = { ...materialForm, photo: finalPhotoUrl };

      if (editingMaterial) {
        updateWorkshopMaterial(firestore, editingMaterial.id, payload);
        toast({ title: 'Berhasil', description: 'Data material telah diperbarui.' });
      } else {
        addWorkshopMaterial(firestore, payload);
        toast({ title: 'Berhasil', description: 'Material baru telah didaftarkan.' });
      }
      
      setAddMaterialOpen(false);
      setEditingMaterial(null);
      setMaterialForm({ name: '', code: '', type: 'FILTER', location: 'Gudang Workshop', unit: 'Pcs', photo: '' });
      setPhotoPreview(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal mengunggah foto atau menyimpan data.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveTransaction = async (type: 'Masuk' | 'Keluar') => {
    const material = materials?.find(m => m.id === transForm.materialId);
    if (!material || !transForm.officer) {
      toast({ variant: 'destructive', title: 'Error', description: 'Pastikan nama material dan petugas sudah dipilih.' });
      return;
    }

    addWorkshopTransaction(firestore, {
      ...transForm,
      type,
      materialName: material.name
    });

    if (type === 'Masuk') {
      const waMessage = `*[INFO BARANG MASUK WORKSHOP]*\n\n📦 *Barang:* ${material.name}\n🔢 *Jumlah:* ${transForm.quantity} ${material.unit || 'Pcs'}\n👤 *Petugas:* ${transForm.officer}\n📝 *Keterangan:* ${transForm.notes || '-'}\n📅 *Waktu:* ${format(new Date(transForm.date), 'dd MMMM yyyy', { locale: indonesiaLocale })}`;
      
      // Fire and forget WA notification
      sendWhatsAppNotification(waMessage, material.photo || undefined).catch(err => {
        console.error("Gagal mengirim WA notifikasi:", err);
      });
    }

    toast({ title: 'Berhasil', description: `Data barang ${type.toLowerCase()} telah dicatat.` });
    setTransForm({ materialId: '', quantity: 1, type: 'Masuk', date: new Date().toISOString().split('T')[0], officer: '', notes: '' });
  };

  const stockSummary = useMemo(() => {
    if (!materials) return [];
    return materials.map(m => {
      const relatedTrans = transactions?.filter(t => t.materialId === m.id) || [];
      const totalIn = relatedTrans.filter(t => t.type === 'Masuk').reduce((acc, curr) => acc + curr.quantity, 0);
      const totalOut = relatedTrans.filter(t => t.type === 'Keluar').reduce((acc, curr) => acc + curr.quantity, 0);
      return {
        ...m,
        totalIn,
        totalOut,
        stock: totalIn - totalOut
      };
    });
  }, [materials, transactions]);

  const exportMonthlyPDF = () => {
    if (displayedReportTransactions.length === 0) {
      toast({ variant: 'destructive', title: 'Tidak ada data', description: 'Belum ada transaksi untuk kriteria yang dipilih.' });
      return;
    }

    const doc = new jsPDF() as jsPDFWithAutoTable;
    const monthName = new Date(selectedReportMonth + '-02').toLocaleString('id-ID', { month: 'long', year: 'numeric' });

    doc.setFontSize(14);
    doc.text('PT. PERTAMINA PATRA NIAGA', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
    doc.text('AFT DEO SORONG - WORKSHOP', doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`LAPORAN MUTASI BARANG WORKSHOP`, doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Periode: ${monthName}`, doc.internal.pageSize.getWidth() / 2, 37, { align: 'center' });

    const tableData = displayedReportTransactions.map((t, idx) => [
      idx + 1,
      format(new Date(t.date), 'dd/MM/yyyy'),
      t.materialName,
      t.type.toUpperCase(),
      t.quantity,
      t.officer,
      t.notes || '-'
    ]);

    doc.autoTable({
      head: [['No', 'Tanggal', 'Nama Barang', 'Status', 'Qty', 'Petugas', 'Keterangan']],
      body: tableData,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [0, 83, 162], textColor: 255 },
      styles: { fontSize: 8 }
    });

    const finalY = (doc as any).autoTable.previous.finalY;
    doc.text(`Sorong, ${format(new Date(), 'dd MMMM yyyy', { locale: indonesiaLocale })}`, doc.internal.pageSize.getWidth() - 20, finalY + 15, { align: 'right' });
    doc.text('Mengetahui,', doc.internal.pageSize.getWidth() - 20, finalY + 22, { align: 'right' });
    doc.text('Supervisor Maintenance', doc.internal.pageSize.getWidth() - 20, finalY + 29, { align: 'right' });
    doc.text('KIAMNASMEITHSON', doc.internal.pageSize.getWidth() - 20, finalY + 50, { align: 'right' });

    doc.save(`Laporan_Workshop_${selectedReportMonth}.pdf`);
  };

  const canManage = user?.role === 'admin' || user?.role === 'teknik';
  const monthLabel = new Date(selectedReportMonth + '-02').toLocaleString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {isCameraActive && (
        <FullscreenWebcam 
          initialFacingMode="environment" 
          onCapture={async (base64) => { 
            const processed = await resizeAndCompressImage(base64);
            setPhotoPreview(processed);
            setIsCameraActive(false); 
          }} 
          onCancel={() => setIsCameraActive(false)} 
        />
      )}
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-gray-700">Filter Riwayat & Laporan:</h2>
        </div>
        <div className="flex items-center gap-3">
          <Input 
            type="month" 
            className="w-48" 
            value={selectedReportMonth} 
            onChange={(e) => setSelectedReportMonth(e.target.value)} 
          />
          <p className="text-xs text-muted-foreground hidden md:block">
            Periode: <strong>{monthLabel}</strong>
          </p>
        </div>
      </div>

      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-12">
          <TabsTrigger value="materials" className="gap-2"><Info className="h-4 w-4" /> Material</TabsTrigger>
          <TabsTrigger value="incoming" className="gap-2"><ArrowDownCircle className="h-4 w-4 text-green-600" /> Masuk</TabsTrigger>
          <TabsTrigger value="outgoing" className="gap-2"><ArrowUpCircle className="h-4 w-4 text-red-600" /> Keluar</TabsTrigger>
          <TabsTrigger value="stock" className="gap-2"><Package className="h-4 w-4 text-blue-600" /> Stok</TabsTrigger>
          <TabsTrigger value="report" className="gap-2"><FileText className="h-4 w-4 text-orange-600" /> Laporan</TabsTrigger>
        </TabsList>

        {/* TAB 1: MASTER MATERIAL */}
        <TabsContent value="materials">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Master Data Material</CardTitle>
                <CardDescription>Daftar identitas barang/filter di workshop.</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Cari Nama/Kode/Jenis..." 
                    className="pl-9 w-64"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                {canManage && (
                  <Button onClick={() => setAddMaterialOpen(true)} size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Tambah
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">No</TableHead>
                      <TableHead>Nama Barang</TableHead>
                      <TableHead>Kode</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead>Lokasi</TableHead>
                      <TableHead>Satuan</TableHead>
                      <TableHead>Foto</TableHead>
                      {canManage && <TableHead className="text-right">Aksi</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingMaterials ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}><TableCell colSpan={8}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                      ))
                    ) : filteredMaterials.length > 0 ? filteredMaterials.map((m, idx) => (
                      <TableRow key={m.id}>
                        <TableCell className="text-center">{idx + 1}</TableCell>
                        <TableCell className="font-bold">{m.name}</TableCell>
                        <TableCell className="font-mono text-xs">{m.code}</TableCell>
                        <TableCell><span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold">{m.type}</span></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{m.location}</TableCell>
                        <TableCell>{m.unit}</TableCell>
                        <TableCell>
                          {m.photo ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <div className="w-8 h-8 rounded border overflow-hidden cursor-pointer hover:scale-110 transition-transform">
                                  <img src={m.photo} className="w-full h-full object-cover" alt="Thumb" />
                                </div>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader><DialogTitle>{m.name}</DialogTitle></DialogHeader>
                                <img src={m.photo} className="w-full h-auto rounded-lg" alt={m.name} />
                              </DialogContent>
                            </Dialog>
                          ) : <ImageIcon className="h-5 w-5 text-gray-300" />}
                        </TableCell>
                        {canManage && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                setEditingMaterial(m);
                                setMaterialForm(m);
                                setPhotoPreview(m.photo || null);
                                setAddMaterialOpen(true);
                              }}><Edit className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteWorkshopMaterial(firestore, m.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={8} className="text-center py-10">Tidak ada data.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2 & 3: TRANSAKSI (MASUK & KELUAR) */}
        {['incoming', 'outgoing'].map((mode) => {
          const typeLabel = mode === 'incoming' ? 'Masuk' : 'Keluar';
          const filteredHistory = monthlyTransactions.filter(t => t.type === typeLabel);

          return (
            <TabsContent key={mode} value={mode}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      {mode === 'incoming' ? <ArrowDownCircle className="text-green-600" /> : <ArrowUpCircle className="text-red-600" />}
                      Input Barang {typeLabel}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-gray-500">Pilih Barang</label>
                      <Select value={transForm.materialId} onValueChange={(v) => setTransForm({...transForm, materialId: v})}>
                        <SelectTrigger><SelectValue placeholder="Pilih material..." /></SelectTrigger>
                        <SelectContent>
                          {materials?.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-500">Jumlah</label>
                        <Input type="number" min={1} value={transForm.quantity} onChange={e => setTransForm({...transForm, quantity: parseInt(e.target.value) || 0})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-500">Tanggal</label>
                        <Input type="date" value={transForm.date} onChange={e => setTransForm({...transForm, date: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-gray-500">Petugas</label>
                      <Select value={transForm.officer} onValueChange={(v) => setTransForm({...transForm, officer: v})}>
                        <SelectTrigger><SelectValue placeholder="Pilih petugas..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Kiamnas Meithson">Kiamnas Meithson</SelectItem>
                          <SelectItem value="Lelyana">Lelyana</SelectItem>
                          <SelectItem value="Akbar">Akbar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-gray-500">Keterangan</label>
                      <Input value={transForm.notes} onChange={e => setTransForm({...transForm, notes: e.target.value})} placeholder="..." />
                    </div>
                    <Button 
                      className="w-full font-bold" 
                      variant={mode === 'incoming' ? 'default' : 'destructive'}
                      onClick={() => handleSaveTransaction(typeLabel)}
                    >
                      Simpan Data
                    </Button>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Riwayat {typeLabel}</CardTitle>
                      <p className="text-[10px] text-primary font-bold">{monthLabel}</p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tgl</TableHead>
                          <TableHead>Barang</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Petugas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingTransactions ? (
                          Array.from({ length: 3 }).map((_, i) => <TableRow key={i}><TableCell colSpan={4}><Skeleton className="h-8 w-full" /></TableCell></TableRow>)
                        ) : filteredHistory.length === 0 ? (
                          <TableRow><TableCell colSpan={4} className="text-center py-10 italic text-muted-foreground text-xs">Belum ada transaksi {typeLabel.toLowerCase()} pada bulan {monthLabel}.</TableCell></TableRow>
                        ) : filteredHistory.map(t => (
                          <TableRow key={t.id}>
                            <TableCell className="text-[10px] font-medium">{format(new Date(t.date), 'dd/MM')}</TableCell>
                            <TableCell className="font-bold text-xs">{t.materialName}</TableCell>
                            <TableCell className="font-black text-primary">{t.quantity}</TableCell>
                            <TableCell className="text-[10px] text-muted-foreground">{t.officer}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          );
        })}

        {/* TAB 4: STOK BARANG */}
        <TabsContent value="stock">
          <Card>
            <CardHeader><CardTitle>Sisa Stok Tersedia (Real-time)</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Barang</TableHead>
                      <TableHead>Kode</TableHead>
                      <TableHead>Jenis</TableHead>
                      <TableHead className="text-center text-green-600">Total Masuk</TableHead>
                      <TableHead className="text-center text-red-600">Total Keluar</TableHead>
                      <TableHead className="text-center font-bold">Sisa Stok</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockSummary.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-bold text-xs">{item.name}</TableCell>
                        <TableCell className="font-mono text-[10px]">{item.code}</TableCell>
                        <TableCell><span className="px-2 py-0.5 bg-gray-100 rounded text-[10px] font-bold">{item.type}</span></TableCell>
                        <TableCell className="text-center text-green-700 font-medium">{item.totalIn}</TableCell>
                        <TableCell className="text-center text-red-700 font-medium">{item.totalOut}</TableCell>
                        <TableCell className="text-center text-lg font-black">{item.stock}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${item.stock <= 0 ? 'bg-red-100 text-red-700' : item.stock <= 5 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                            {item.stock <= 0 ? 'HABIS' : item.stock <= 5 ? 'KRITIS' : 'OK'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: LAPORAN BULANAN */}
        <TabsContent value="report">
          <Card>
            <CardHeader className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
              <div>
                <CardTitle>Rekapitulasi Mutasi Bulanan</CardTitle>
                <CardDescription>Semua transaksi barang di bulan {monthLabel}.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={reportTypeFilter} onValueChange={(v: any) => setReportTypeFilter(v)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Semua Mutasi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Semua">Semua Mutasi</SelectItem>
                    <SelectItem value="Masuk">Barang Masuk</SelectItem>
                    <SelectItem value="Keluar">Barang Keluar</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={exportMonthlyPDF} className="gap-2" disabled={displayedReportTransactions.length === 0}>
                  <Printer className="h-4 w-4" /> Cetak PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Barang</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Petugas</TableHead>
                      <TableHead>Keterangan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingTransactions ? (
                      <TableRow><TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                    ) : displayedReportTransactions.length > 0 ? displayedReportTransactions.map(t => (
                      <TableRow key={t.id}>
                        <TableCell className="text-xs font-medium">{format(new Date(t.date), 'dd MMM yyyy', { locale: indonesiaLocale })}</TableCell>
                        <TableCell className="font-bold text-xs">{t.materialName}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${t.type === 'Masuk' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {t.type.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell className="font-black text-center">{t.quantity}</TableCell>
                        <TableCell className="text-xs">{t.officer}</TableCell>
                        <TableCell className="text-[10px] text-muted-foreground italic max-w-[150px] truncate">{t.notes || '-'}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">Belum ada transaksi tercatat untuk kriteria ini.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* DIALOG: TAMBAH/EDIT MATERIAL */}
      <Dialog open={isAddMaterialOpen} onOpenChange={(open) => {
        if (!open) {
          setEditingMaterial(null);
          setPhotoPreview(null);
        }
        setAddMaterialOpen(open);
      }}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editingMaterial ? 'Perbarui' : 'Daftarkan'} Material</DialogTitle>
            <DialogDescription>Isi detail material workshop secara lengkap.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-bold flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Foto Barang</label>
              
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={handleCapturePhoto}>
                  <Camera className="h-4 w-4 mr-2" /> Ambil Kamera
                </Button>
                <div className="flex-1 relative">
                  <Input 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    title="Pilih dari Galeri"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                          const base64Str = reader.result as string;
                          const compressed = await resizeAndCompressImage(base64Str);
                          setPhotoPreview(compressed);
                        };
                        reader.readAsDataURL(file);
                      }
                      // Reset file input value so selecting the same file works again
                      e.target.value = '';
                    }}
                  />
                  <Button type="button" variant="outline" className="w-full relative z-0">
                    <ImageIcon className="h-4 w-4 mr-2" /> Dari Galeri
                  </Button>
                </div>
              </div>

              <div className={`relative w-full aspect-video rounded-lg border-2 mt-2 flex flex-col items-center justify-center overflow-hidden ${photoPreview ? 'border-primary' : 'border-dashed border-muted-foreground/30 bg-muted/20'}`}>
                {photoPreview ? (
                  <>
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2">
                      <Button size="icon" variant="destructive" onClick={(e) => { e.stopPropagation(); setPhotoPreview(null); }} className="h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-8 w-8 mb-2 text-muted-foreground/50" />
                    <span className="text-xs font-medium text-muted-foreground">Belum ada foto</span>
                  </>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-bold text-gray-700">Nama Material</label>
              <Input value={materialForm.name} onChange={e => setMaterialForm({...materialForm, name: e.target.value})} placeholder="Contoh: Filter Coalescer Facet" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-bold text-gray-700">Kode Barang</label>
                <Input value={materialForm.code} onChange={e => setMaterialForm({...materialForm, code: e.target.value})} placeholder="F-12345" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-bold text-gray-700">Jenis Barang</label>
                <Input value={materialForm.type} onChange={e => setMaterialForm({...materialForm, type: e.target.value})} placeholder="FILTER / ALAT KERJA" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-1"><MapPin className="h-3 w-3" /> Lokasi</label>
                <Input value={materialForm.location} onChange={e => setMaterialForm({...materialForm, location: e.target.value})} placeholder="Gudang A / Lemari 1" />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-bold text-gray-700">Satuan</label>
                <Input value={materialForm.unit} onChange={e => setMaterialForm({...materialForm, unit: e.target.value})} placeholder="Pcs / Set / Dus" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddMaterialOpen(false)}>Batal</Button>
            <Button onClick={handleSaveMaterial} size="sm" disabled={isUploading}>
              {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Proses...</> : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
