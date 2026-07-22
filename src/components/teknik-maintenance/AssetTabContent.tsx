
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Wrench, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '../ui/skeleton';

interface AssetTabContentProps {
  category: SarprasItem['category'];
  assets: SarprasItem[];
  loading: boolean;
  canManage: boolean;
}

export default function AssetTabContent({ category, assets, loading, canManage }: AssetTabContentProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isAddOpen, setAddOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<SarprasItem | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    plateNumber: '',
    location: 'AFT DEO',
    status: 'Baik' as 'Baik' | 'Perlu Perbaikan' | 'Rusak',
    lastMaintenance: new Date().toISOString().split('T')[0]
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
    setFormData({ name: '', plateNumber: '', location: 'AFT DEO', status: 'Baik', lastMaintenance: new Date().toISOString().split('T')[0] });
  };

  const openEdit = (asset: SarprasItem) => {
    setEditingAsset(asset);
    setFormData({ 
      name: asset.name, 
      plateNumber: asset.plateNumber || '', 
      location: asset.location, 
      status: asset.status, 
      lastMaintenance: asset.lastMaintenance 
    });
    setAddOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Monitoring {category}</CardTitle>
            <CardDescription>Status dan jadwal maintenance {category.toLowerCase()}.</CardDescription>
          </div>
          {canManage && (
            <Button onClick={() => setAddOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Tambah Unit
            </Button>
          )}
        </CardHeader>
        <CardContent>
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
                <TableRow key={asset.id}>
                  <TableCell className="font-bold">{asset.name}</TableCell>
                  {category !== 'Barang Kantor' && <TableCell>{asset.plateNumber || '-'}</TableCell>}
                  <TableCell>{asset.location}</TableCell>
                  <TableCell>{new Date(asset.lastMaintenance).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      asset.status === 'Baik' ? 'bg-green-100 text-green-700' : 
                      asset.status === 'Perlu Perbaikan' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {asset.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(asset)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => deleteSarpras(firestore, asset.id)}><Trash2 className="mr-2 h-4 w-4" /> Hapus</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">Belum ada unit {category} terdaftar.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingAsset ? 'Edit' : 'Tambah'} Unit {category}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Nama Aset / Unit</label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Contoh: Refueller 01 / AC Ruang Rapat" />
            </div>
            {category !== 'Barang Kantor' && (
              <div className="grid gap-2">
                <label className="text-sm font-medium">Nomor Polisi</label>
                <Input value={formData.plateNumber} onChange={e => setFormData({...formData, plateNumber: e.target.value})} placeholder="PB 1234 XX" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Lokasi</label>
                <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Maintenance Terakhir</label>
                <Input type="date" value={formData.lastMaintenance} onChange={e => setFormData({...formData, lastMaintenance: e.target.value})} />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Status Kondisi</label>
              <Select value={formData.status} onValueChange={(v: any) => setFormData({...formData, status: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baik">Baik / Operasional</SelectItem>
                  <SelectItem value="Perlu Perbaikan">Perlu Perbaikan</SelectItem>
                  <SelectItem value="Rusak">Rusak / Grounded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
            <Button onClick={handleSave}>Simpan Unit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
