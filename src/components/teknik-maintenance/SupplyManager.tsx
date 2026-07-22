
'use client';

import { useState } from 'react';
import { useFirestore } from '@/firebase';
import { addSupply, updateSupply, deleteSupply } from '@/firebase/firestore/sarpras';
import type { OfficeSupply } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Minus, Edit, Trash2, AlertTriangle, PackageSearch } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface SupplyManagerProps {
  supplies: OfficeSupply[];
  loading: boolean;
  canManage: boolean;
}

export default function SupplyManager({ supplies, loading, canManage }: SupplyManagerProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isAddOpen, setAddOpen] = useState(false);
  const [editingSupply, setEditingSupply] = useState<OfficeSupply | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    quantity: 0,
    unit: 'Rim',
    minStock: 5
  });

  const handleSave = async () => {
    if (!formData.name) return;
    
    if (editingSupply) {
      updateSupply(firestore, editingSupply.id, formData);
      toast({ title: 'Berhasil', description: 'Data stok telah diperbarui.' });
    } else {
      addSupply(firestore, formData);
      toast({ title: 'Berhasil', description: 'Barang baru telah didaftarkan ke stok.' });
    }
    
    setAddOpen(false);
    setEditingSupply(null);
    setFormData({ name: '', quantity: 0, unit: 'Rim', minStock: 5 });
  };

  const adjustQty = (supply: OfficeSupply, amount: number) => {
    const newQty = Math.max(0, supply.quantity + amount);
    updateSupply(firestore, supply.id, { quantity: newQty });
  };

  const openEdit = (supply: OfficeSupply) => {
    setEditingSupply(supply);
    setFormData({ 
      name: supply.name, 
      quantity: supply.quantity, 
      unit: supply.unit, 
      minStock: supply.minStock || 0 
    });
    setAddOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-2">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <PackageSearch className="h-5 w-5 text-emerald-600" />
              Inventaris ATK & Barang Habis Pakai
            </CardTitle>
            <CardDescription>Manajemen jumlah persediaan barang operasional kantor.</CardDescription>
          </div>
          {canManage && (
            <Button onClick={() => setAddOpen(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> Tambah Barang
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead>Stok Saat Ini</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead>Min. Stok</TableHead>
                  <TableHead>Update Terakhir</TableHead>
                  <TableHead className="text-right">Kontrol Stok</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : supplies.length > 0 ? supplies.map(supply => {
                  const isLow = supply.quantity <= (supply.minStock || 0);
                  return (
                    <TableRow key={supply.id} className={isLow ? 'bg-red-50/50' : 'hover:bg-muted/30 transition-colors'}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {supply.name}
                          {isLow && <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />}
                        </div>
                      </TableCell>
                      <TableCell className={`font-black text-lg ${isLow ? 'text-red-600' : 'text-emerald-700'}`}>
                        {supply.quantity}
                      </TableCell>
                      <TableCell className="text-xs uppercase font-bold text-muted-foreground">{supply.unit}</TableCell>
                      <TableCell className="text-xs">{supply.minStock || '-'}</TableCell>
                      <TableCell className="text-[10px] text-muted-foreground uppercase">
                        {supply.lastUpdated?.toDate ? supply.lastUpdated.toDate().toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-1">
                          <Button variant="outline" size="icon" className="h-8 w-8 border-red-200 text-red-600 hover:bg-red-50" onClick={() => adjustQty(supply, -1)} disabled={!canManage} title="Kurangi 1">
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8 border-emerald-200 text-emerald-600 hover:bg-emerald-50" onClick={() => adjustQty(supply, 1)} disabled={!canManage} title="Tambah 1">
                            <Plus className="h-3 w-3" />
                          </Button>
                          <div className="w-px h-4 bg-border mx-1" />
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(supply)} disabled={!canManage}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={() => deleteSupply(firestore, supply.id)} disabled={!canManage}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                      Belum ada barang yang didaftarkan dalam stok ATK.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{editingSupply ? 'Edit' : 'Tambah'} Barang Stok</DialogTitle>
            <CardDescription>Manajemen data persediaan barang operasional.</CardDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-bold text-gray-700">Nama Barang</label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Contoh: Kertas A4 80gr" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-bold text-gray-700">Jumlah Stok Awal</label>
                <Input type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-bold text-gray-700">Satuan</label>
                <Input value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder="Rim / Pack / Buah" />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-bold text-gray-700">Batas Stok Minimum (Peringatan)</label>
              <Input type="number" value={formData.minStock} onChange={e => setFormData({...formData, minStock: parseInt(e.target.value) || 0})} />
              <p className="text-[10px] text-muted-foreground italic">Sistem akan memberi warna merah jika stok menyentuh angka ini.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">Simpan Barang</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
