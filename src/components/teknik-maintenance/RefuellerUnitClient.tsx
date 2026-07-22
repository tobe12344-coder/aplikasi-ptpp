'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirestore } from '@/firebase';
import { addSarpras, updateSarpras } from '@/firebase/firestore/sarpras';
import { useToast } from '@/hooks/use-toast';
import type { SarprasItem } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Truck, Wrench, ShieldAlert, CheckCircle2, Save, Calendar, MapPin, Gauge, Activity, RefreshCcw, HeartPulse, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RefuellerUnitClientProps {
  unitName: string;
  unitData?: SarprasItem;
  loading: boolean;
  canManage: boolean;
  capacity: string;
}

const initialConditions = {
  cab: { label: 'Kabin Utama (Cab)', items: { seats: 85, windshield: 92, dashboard: 100, doors: 88 } },
  tank: { label: 'Sistem Tangki (Tank)', items: { body: 90, manhole12: 95, manhole34: 95, tumeTube: 88, ladder: 70 } },
  engine: { label: 'Mesin & Sasis', items: { engine: 86, battery: 90, exhaust: 60, brakes: 77 } },
  pump: { label: 'Modul Pompa (Pump Module)', items: { mainPump: 76, separator: 88, flowMeter: 95, valve: 81 } },
  hose: { label: 'Penyaluran (Hose & Reel)', items: { reel: 65, underwing: 72, overwing: 80, grounding: 55 } },
  wheels: { label: 'Roda (Ban & Suspensi)', items: { steering: 82, drive: 68, trailer1: 75, trailer2: 71 } }
};

export default function RefuellerUnitClient({ unitName, unitData, loading, canManage, capacity }: RefuellerUnitClientProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isEditing, setIsEditing] = useState(false);
  const [conditions, setConditions] = useState(initialConditions);

  const [formData, setFormData] = useState({
    plateNumber: '',
    location: 'AFT DEO',
    status: 'Baik' as 'Baik' | 'Perlu Perbaikan' | 'Rusak',
    lastMaintenance: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (unitData) {
      setFormData({
        plateNumber: unitData.plateNumber || '',
        location: unitData.location || 'AFT DEO',
        status: unitData.status || 'Baik',
        lastMaintenance: unitData.lastMaintenance || new Date().toISOString().split('T')[0]
      });
    }
  }, [unitData]);

  const handleSave = async () => {
    if (!firestore) return;

    const payload = {
      ...formData,
      name: unitName,
      category: 'Refueller' as const,
      capacity: capacity
    };

    if (unitData?.id) {
      updateSarpras(firestore, unitData.id, payload);
      toast({ title: 'Berhasil', description: `Data ${unitName} telah diperbarui.` });
    } else {
      addSarpras(firestore, payload);
      toast({ title: 'Berhasil', description: `Data ${unitName} telah diinisialisasi.` });
    }
    setIsEditing(false);
  };

  const overallCondition = useMemo(() => {
    let total = 0;
    let count = 0;
    Object.values(conditions).forEach(group => {
      Object.values(group.items).forEach(val => {
        total += val;
        count++;
      });
    });
    return (total / count).toFixed(1);
  }, [conditions]);

  const handleReportDamage = () => {
    const newConditions = JSON.parse(JSON.stringify(conditions));
    Object.keys(newConditions).forEach(groupKey => {
      Object.keys(newConditions[groupKey].items).forEach(itemKey => {
        // Melaporkan kerusakan berarti menurunkan nilai kesehatan komponen
        newConditions[groupKey].items[itemKey] = Math.floor(Math.random() * 40) + 30;
      });
    });
    setConditions(newConditions);
    toast({ 
      variant: 'destructive',
      title: 'Laporan Kerusakan Diterima', 
      description: `Laporan kerusakan untuk unit ${unitName} telah tercatat di sistem.` 
    });
  };

  const handleRepairAll = () => {
    setConditions(initialConditions);
    toast({ title: 'Unit Diperbaiki', description: 'Seluruh sistem telah dikalibrasi ke kondisi prima.' });
  };

  if (loading) {
    return <Skeleton className="h-[400px] w-full rounded-xl" />;
  }

  const getHealthColor = (val: number) => {
    if (val > 80) return 'text-emerald-600';
    if (val > 60) return 'text-orange-500';
    return 'text-red-600';
  };

  const status = (unitData?.status || 'Baik');

  return (
    <div className="space-y-6">
      {/* Top Status Card */}
      <Card className="overflow-hidden border-2 shadow-sm bg-white">
        <div className="pertamina-header-gradient h-2" />
        <CardHeader className="flex flex-row items-center justify-between bg-muted/5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Truck className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-3xl font-black text-gray-900">{unitName}</CardTitle>
              <CardDescription className="flex items-center gap-2 font-bold text-primary">
                <Gauge className="h-4 w-4" /> Kapasitas: {capacity}
              </CardDescription>
            </div>
          </div>
          <div className={cn(
            "px-4 py-2 rounded-lg border flex items-center gap-2 font-black text-sm",
            status === 'Baik' ? "text-emerald-600 bg-emerald-50 border-emerald-200" :
            status === 'Perlu Perbaikan' ? "text-orange-600 bg-orange-50 border-orange-200" :
            "text-red-600 bg-red-50 border-red-200"
          )}>
            {status === 'Baik' ? <CheckCircle2 className="h-4 w-4" /> : status === 'Rusak' ? <ShieldAlert className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
            {status.toUpperCase()}
          </div>
        </CardHeader>
        
        <CardContent className="pt-8">
          {!isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-50 rounded-lg border border-gray-100"><MapPin className="h-5 w-5 text-gray-400" /></div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lokasi Sekarang</p>
                    <p className="font-bold text-lg text-gray-800">{unitData?.location || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-50 rounded-lg border border-gray-100"><Calendar className="h-5 w-5 text-gray-400" /></div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Maintenance Terakhir</p>
                    <p className="font-bold text-lg text-gray-800">
                      {unitData?.lastMaintenance 
                        ? new Date(unitData.lastMaintenance).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) 
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-50 rounded-lg border border-gray-100"><Truck className="h-5 w-5 text-gray-400" /></div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nomor Polisi</p>
                    <p className="font-mono font-bold text-xl text-gray-800">{unitData?.plateNumber || '-'}</p>
                  </div>
                </div>
                {canManage && (
                  <Button variant="outline" className="w-full h-12 gap-2 font-bold" onClick={() => setIsEditing(true)}>
                    <Wrench className="h-4 w-4" /> Perbarui Status Unit
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6 bg-muted/10 p-6 rounded-xl border border-dashed border-primary/30">
              <h3 className="font-black text-primary uppercase tracking-tighter">Edit Data Unit</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold text-gray-700">Nomor Polisi</Label>
                  <Input value={formData.plateNumber} onChange={e => setFormData({...formData, plateNumber: e.target.value})} placeholder="Contoh: PB 1234 XX" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-gray-700">Lokasi Unit</Label>
                  <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-gray-700">Status Kondisi</Label>
                  <Select value={formData.status} onValueChange={(v: any) => setFormData({...formData, status: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Baik">BAIK (Siap Operasi)</SelectItem>
                      <SelectItem value="Perlu Perbaikan">PERLU PERBAIKAN (Maintenance)</SelectItem>
                      <SelectItem value="Rusak">RUSAK (Grounded)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-gray-700">Tanggal Terakhir Maintenance</Label>
                  <Input type="date" value={formData.lastMaintenance} onChange={e => setFormData({...formData, lastMaintenance: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="ghost" onClick={() => setIsEditing(false)}>Batal</Button>
                <Button onClick={handleSave} className="gap-2"><Save className="h-4 w-4" /> Simpan Perubahan</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Technical Health Dashboard */}
      <div className="bg-white rounded-2xl p-6 text-gray-900 border-2 border-gray-100 shadow-xl overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Visual SVG Diagram */}
          <div className="lg:w-1/3 flex flex-col items-center">
            <h3 className="text-xl font-black mb-10 text-gray-500 uppercase tracking-tighter flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> Visual Diagram
            </h3>
            
            <div className="relative w-64 h-96 flex items-center justify-center">
              <svg viewBox="0 0 200 400" className="w-full h-full drop-shadow-md">
                {/* Cab */}
                <rect x="60" y="20" width="80" height="60" rx="10" fill="#cc0000" stroke="#000" strokeWidth="1" />
                <rect x="70" y="30" width="60" height="25" rx="4" fill="#333" />
                
                {/* Pump Module */}
                <rect x="60" y="90" width="80" height="40" rx="4" fill="#444" stroke="#000" strokeWidth="1" />
                <circle cx="80" cy="110" r="5" fill="#888" />
                <circle cx="100" cy="110" r="5" fill="#888" />
                <circle cx="120" cy="110" r="5" fill="#888" />
                
                {/* Tank */}
                <rect x="50" y="140" width="100" height="200" rx="10" fill="#cc0000" stroke="#000" strokeWidth="1" />
                <rect x="60" y="150" width="80" height="180" rx="5" fill="white" stroke="#ccc" strokeWidth="1" />
                <rect x="90" y="160" width="20" height="160" fill="#cc0000" />
                
                {/* Wheels */}
                <rect x="40" y="40" width="15" height="30" rx="2" fill="#333" />
                <rect x="145" y="40" width="15" height="30" rx="2" fill="#333" />
                <rect x="40" y="100" width="15" height="30" rx="2" fill="#333" />
                <rect x="145" y="100" width="15" height="30" rx="2" fill="#333" />
                
                <rect x="40" y="250" width="15" height="30" rx="2" fill="#333" />
                <rect x="145" y="250" width="15" height="30" rx="2" fill="#333" />
                <rect x="40" y="290" width="15" height="30" rx="2" fill="#333" />
                <rect x="145" y="290" width="15" height="30" rx="2" fill="#333" />
                
                {/* Hose Reel */}
                <rect x="145" y="330" width="20" height="20" rx="2" fill="#444" stroke="#000" strokeWidth="1" />
              </svg>
              
              {/* Diagram Labels */}
              <div className="absolute top-10 left-0 text-[10px] font-bold text-gray-600 border-l border-dashed border-gray-300 pl-2 uppercase">Kabin (Cab)</div>
              <div className="absolute top-24 right-0 text-[10px] font-bold text-gray-600 border-r border-dashed border-gray-300 pr-2 uppercase">Modul Pompa</div>
              <div className="absolute top-48 left-0 text-[10px] font-bold text-gray-600 border-l border-dashed border-gray-300 pl-2 uppercase">Tangki Avtur</div>
              <div className="absolute bottom-16 right-0 text-[10px] font-bold text-gray-600 border-r border-dashed border-gray-300 pr-2 uppercase">Gulungan Selang</div>
            </div>
          </div>

          {/* Health Stats Grid */}
          <div className="lg:w-2/3 space-y-8">
            <div className="flex justify-between items-end border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">{unitName} Technical Health</h2>
                <p className="text-gray-500 text-sm mt-1">Refueller Type: Aviation Fuel Truck | Capacity: {capacity}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Overall Condition</p>
                <p className={cn("text-4xl font-black", parseFloat(overallCondition) > 80 ? "text-emerald-600" : "text-orange-500")}>
                  {overallCondition}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {Object.entries(conditions).map(([key, group]) => (
                <div key={key} className="space-y-3">
                  <h4 className="text-sm font-black uppercase tracking-widest text-gray-700 border-b border-gray-200 pb-1">{group.label}</h4>
                  <div className="space-y-2">
                    {Object.entries(group.items).map(([itemKey, val]) => (
                      <div key={itemKey} className="flex justify-between items-center text-xs">
                        <span className="text-gray-800 capitalize font-medium">{itemKey.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className={cn("font-bold", getHealthColor(val as number))}>({val}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-100">
              <Button 
                variant="outline" 
                className="bg-white border-red-200 text-red-600 hover:bg-red-50 flex-1 h-12 gap-2 font-bold"
                onClick={handleReportDamage}
              >
                <AlertTriangle className="h-4 w-4" /> Laporkan Kerusakan
              </Button>
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 h-12 gap-2 font-bold shadow-md shadow-emerald-100"
                onClick={handleRepairAll}
              >
                <HeartPulse className="h-4 w-4" /> Perbaiki Semua
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
