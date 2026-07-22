
'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { addSarpras, updateSarpras, deleteSarpras } from '@/firebase/firestore/sarpras';
import type { SarprasItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, MoreHorizontal, Edit, Trash2, QrCode, Printer } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '../ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import QRCode from 'react-qr-code';

const CarDamageMap = ({ selectedArea, onSelectArea }: { selectedArea: string, onSelectArea: (area: string) => void }) => {
  const areas = [
    { id: 'Depan', label: 'Depan', classes: 'top-0 left-1/2 -translate-x-1/2 w-20 h-10 rounded-t-xl' },
    { id: 'Belakang', label: 'Belakang', classes: 'bottom-0 left-1/2 -translate-x-1/2 w-20 h-10 rounded-b-xl' },
    { id: 'Kiri', label: 'Kiri', classes: 'top-1/2 left-0 -translate-y-1/2 w-10 h-24 rounded-l-xl' },
    { id: 'Kanan', label: 'Kanan', classes: 'top-1/2 right-0 -translate-y-1/2 w-10 h-24 rounded-r-xl' },
    { id: 'Atas/Mesin', label: 'Atas/Mesin', classes: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-20 rounded-md' },
  ];

  return (
    <div className="relative w-48 h-72 mx-auto border-4 border-slate-300 rounded-3xl bg-slate-100 my-4 shadow-inner">
      {areas.map(area => (
        <div 
          key={area.id}
          onClick={() => onSelectArea(area.id)}
          className={`absolute flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all border-2
            ${selectedArea === area.id ? 'bg-red-500 border-red-700 text-white scale-105 z-10 shadow-lg' : 'bg-slate-300/60 border-slate-400 text-slate-700 hover:bg-slate-400/80'}
            ${area.classes}
          `}
        >
          {area.label}
        </div>
      ))}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <span className="text-slate-300 font-black text-2xl -rotate-90 opacity-50 tracking-widest">VEHICLE</span>
      </div>
    </div>
  );
};

interface AssetManagerProps {
  category: SarprasItem['category'];
  assets: SarprasItem[];
  loading: boolean;
  canManage: boolean;
}

export default function AssetManager({ category, assets, loading, canManage }: AssetManagerProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isAddOpen, setAddOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<SarprasItem | null>(null);
  const [printQrAsset, setPrintQrAsset] = useState<SarprasItem | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    plateNumber: '',
    location: 'AFT DEO',
    status: 'Baik' as 'Baik' | 'Perlu Perbaikan' | 'Rusak',
    lastMaintenance: new Date().toISOString().split('T')[0],
    damageArea: '',
    damageNotes: ''
  });

  const handleSave = async () => {
    if (!formData.name) return;
    
    if (editingAsset) {
      updateSarpras(firestore, editingAsset.id, { ...formData, category });
      toast({ title: 'Berhasil', description: 'Data aset telah diperbarui.' });
    } else {
      addSarpras(firestore, { ...formData, category });
      toast({ title: 'Berhasil', description: 'Aset baru telah ditambahkan.' });
    }
    
    setAddOpen(false);
    setEditingAsset(null);
    setFormData({ name: '', plateNumber: '', location: 'AFT DEO', status: 'Baik', lastMaintenance: new Date().toISOString().split('T')[0], damageArea: '', damageNotes: '' });
  };

  const openEdit = (asset: SarprasItem) => {
    setEditingAsset(asset);
    setFormData({ 
      name: asset.name, 
      plateNumber: asset.plateNumber || '', 
      location: asset.location, 
      status: asset.status, 
      lastMaintenance: asset.lastMaintenance,
      damageArea: asset.damageArea || '',
      damageNotes: asset.damageNotes || ''
    });
    setAddOpen(true);
  };

  const handlePrintQr = () => {
    if (!printQrAsset) return;
    const svg = document.getElementById('qr-svg')?.outerHTML;
    if (!svg) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head><title>Print QR Label</title>
        <style>
          body { font-family: system-ui, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
          .label-container { border: 2px dashed #000; padding: 20px; border-radius: 12px; text-align: center; width: 250px; }
          h3 { margin: 0 0 15px 0; font-size: 20px; text-transform: uppercase; }
          p { margin: 15px 0 0 0; font-size: 12px; color: #666; font-family: monospace; }
          .company { font-size: 12px; font-weight: bold; margin-top: 5px; color: #000; }
        </style>
        </head>
        <body>
          <div class="label-container">
            <h3>${printQrAsset.name}</h3>
            ${svg}
            <p>${printQrAsset.id}</p>
            <div class="company">AFT DEO SORONG</div>
          </div>
          <script>
            setTimeout(() => { window.print(); window.close(); }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-2">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20">
          <div>
            <CardTitle className="text-lg">Monitoring {category}</CardTitle>
            <CardDescription>Daftar aset operasional kategori {category.toLowerCase()}.</CardDescription>
          </div>
          {canManage && (
            <Button onClick={() => setAddOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Tambah Unit
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Unit</TableHead>
                  {category !== 'Barang Kantor' && <TableHead>No. Polisi</TableHead>}
                  <TableHead>Lokasi</TableHead>
                  <TableHead>Maint. Terakhir</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : assets.length > 0 ? assets.map(asset => (
                  <TableRow key={asset.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-bold text-primary">{asset.name}</TableCell>
                    {category !== 'Barang Kantor' && <TableCell className="font-mono text-xs">{asset.plateNumber || '-'}</TableCell>}
                    <TableCell>{asset.location}</TableCell>
                    <TableCell>{new Date(asset.lastMaintenance).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        asset.status === 'Baik' ? 'bg-green-100 text-green-700 border border-green-200' : 
                        asset.status === 'Perlu Perbaikan' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 
                        'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                        {asset.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {canManage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setPrintQrAsset(asset)}><QrCode className="mr-2 h-4 w-4 text-blue-600" /> Cetak QR Code</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(asset)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => deleteSarpras(firestore, asset.id)}><Trash2 className="mr-2 h-4 w-4" /> Hapus</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                      Belum ada unit {category} yang terdaftar di database.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAsset ? 'Edit' : 'Tambah'} Unit {category}</DialogTitle>
            <CardDescription>Masukkan detail unit aset baru untuk dimonitoring.</CardDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-bold">Nama Aset / Unit</label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Contoh: Refueller 01 / AC Ruang Rapat" />
            </div>
            {category !== 'Barang Kantor' && (
              <div className="grid gap-2">
                <label className="text-sm font-bold">Nomor Polisi</label>
                <Input value={formData.plateNumber} onChange={e => setFormData({...formData, plateNumber: e.target.value})} placeholder="PB 1234 XX" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-bold">Lokasi</label>
                <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-bold">Maintenance Terakhir</label>
                <Input type="date" value={formData.lastMaintenance} onChange={e => setFormData({...formData, lastMaintenance: e.target.value})} />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-bold">Status Kondisi Saat Ini</label>
              <Select value={formData.status} onValueChange={(v: any) => setFormData({...formData, status: v})}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baik">BAIK (Operasional)</SelectItem>
                  <SelectItem value="Perlu Perbaikan">PERLU PERBAIKAN</SelectItem>
                  <SelectItem value="Rusak">RUSAK (Grounded)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.status !== 'Baik' && ['Refueller', 'Bridger', 'Mobil Kantor'].includes(category) && (
              <div className="mt-4 p-4 border rounded-xl bg-slate-50/50">
                <label className="text-sm font-bold text-red-600 flex items-center gap-2">Visual Damage Mapping (Peta Kerusakan)</label>
                <p className="text-xs text-muted-foreground mb-4">Klik pada area kendaraan di bawah ini untuk menandai lokasi kerusakan.</p>
                <CarDamageMap selectedArea={formData.damageArea} onSelectArea={(a) => setFormData({...formData, damageArea: a})} />
                
                {formData.damageArea && (
                  <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-bottom-2">
                    <label className="text-sm font-bold">Catatan Kerusakan Area {formData.damageArea}</label>
                    <Textarea 
                      placeholder="Contoh: Bumper penyok parah menabrak tiang, lampu depan pecah..." 
                      value={formData.damageNotes} 
                      onChange={e => setFormData({...formData, damageNotes: e.target.value})} 
                      className="resize-none"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
            <Button onClick={handleSave}>Simpan Data Aset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!printQrAsset} onOpenChange={(open) => !open && setPrintQrAsset(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Cetak Label QR Aset</DialogTitle>
            <CardDescription>Cetak label pintar ini dan tempelkan pada fisik aset. Scan dengan HP untuk melihat detail.</CardDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 space-y-6">
            <div className="flex flex-col items-center bg-white p-6 border-2 border-dashed border-slate-300 rounded-xl w-64 shadow-sm">
              <h3 className="font-black text-center text-lg mb-4 text-slate-800">{printQrAsset?.name}</h3>
              <div className="bg-white p-2 rounded-lg">
                {printQrAsset && (
                  <QRCode 
                    id="qr-svg"
                    value={`${window.location.origin}/teknik-maintenance/asset/${printQrAsset.id}`} 
                    size={150} 
                  />
                )}
              </div>
              <p className="text-[10px] font-mono text-center mt-4 text-slate-400">{printQrAsset?.id}</p>
              <p className="text-[10px] font-bold text-center mt-1 text-slate-600">AFT DEO SORONG</p>
            </div>
            <Button onClick={handlePrintQr} className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
              <Printer className="w-4 h-4" /> Cetak Label Sekarang
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
