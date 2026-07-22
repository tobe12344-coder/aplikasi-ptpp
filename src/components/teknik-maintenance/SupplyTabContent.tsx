
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
import { Plus, Minus, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface SupplyTabContentProps {
  supplies: OfficeSupply[];
  loading: boolean;
  canManage: boolean;
}

export default function SupplyTabContent({ supplies, loading, canManage }: SupplyTabContentProps) {
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Stok Barang Kantor (ATK)</CardTitle>
            <CardDescription>Manajemen jumlah persediaan barang habis pakai.</CardDescription>
          </div>
          {canManage && (
            <Button onClick={() => setAddOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Tambah Barang
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Barang</TableHead>
                <TableHead>Stok Saat Ini</TableHead>
                <TableHead>Satuan</TableHead>
                <TableHead>Min. Stok</TableHead>
                <TableHead>Update Terakhir</TableHead>
                <TableHead className="text-right">Aksi Cepat</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell>
                  </TableRow>
                ))
              ) : supplies.length > 0 ? supplies.map(supply => (
                <TableRow key={supply.id} className={supply.quantity <= (supply.minStock || 0) ? 'bg-red-50' : ''}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {supply.name}
                      {supply.quantity <= (supply.minStock || 0) && <AlertTriangle className="h-3 w-3 text-red-500" />}
                    </div>
                  </TableCell>
                  <TableCell className={`font-bold ${supply.quantity <= (supply.minStock || 0) ? 'text-red-600' : ''}`}>
                    {supply.quantity}
                  </TableCell>
                  <TableCell>{supply.unit}</TableCell>
                  <TableCell>{supply.minStock || '-'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {supply.lastUpdated?.toDate ? supply.lastUpdated.toDate().toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => adjustQty(supply, -1)} disabled={!canManage}><Minus className="h-3 w-3" /></Button>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => adjustQty(supply, 1)} disabled={!canManage}><Plus className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 ml-2" onClick={() => openEdit(supply)} disabled={!canManage}><Edit className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteSupply(firestore, supply.id)} disabled={!canManage}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">Belum ada barang terdaftar di stok.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingSupply ? 'Edit' : 'Tambah'} Barang Stok</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Nama Barang</label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Contoh: Kertas A4 80gr" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Jumlah Stok</label>
                <Input type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})} />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Satuan</label>
                <Input value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder="Rim / Pack / Buah" />
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Batas Stok Minimum (Warning)</label>
              <Input type="number" value={formData.minStock} onChange={e => setFormData({...formData, minStock: parseInt(e.target.value) || 0})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
            <Button onClick={handleSave}>Simpan Barang</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
