
'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, Car, Box, Package, Fuel, AlertTriangle, CheckCircle2, Wrench, ShieldAlert, Hammer, ClipboardCheck, BellRing, CalendarDays, AlertOctagon } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, type CollectionReference, query, where } from 'firebase/firestore';
import type { SarprasItem, OfficeSupply, MaintenanceChecklist, CalibrationRecord, DamageReport } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { differenceInDays, parseISO } from 'date-fns';

const sarprasMenus = [
  // {
  //   title: 'Monitoring Mobil Refueller',
  //   description: 'Pantau kondisi 4 unit mobil tangki pengisi pesawat.',
  //   icon: Truck,
  //   href: '/refueller',
  //   color: 'text-blue-600',
  //   bgColor: 'bg-blue-50',
  // },

  {
    title: 'Inventaris Barang Workshop',
    description: 'Monitoring alat kerja dan perlengkapan teknik di workshop.',
    icon: Hammer,
    href: '/workshop',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
  },
  {
    title: 'Ceklish Maintenance',
    description: 'Form checklist pemeriksaan sarana dan prasarana rutin.',
    icon: ClipboardCheck,
    href: '/ceklish-maintenance',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
  {
    title: 'Kalibrasi dan Tera Peralatan',
    description: 'Daftar pemantauan jadwal kalibrasi dan tera peralatan teknik.',
    icon: ClipboardCheck,
    href: '/calibration',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  {
    title: 'Laporan Kerusakan Sarpras',
    description: 'Pelaporan kerusakan dan pencatatan perbaikan sarana & prasarana (SF PTPP).',
    icon: AlertOctagon,
    href: '/laporan-kerusakan',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
];

export default function TeknikModuleClient() {
  const firestore = useFirestore();

  // Fetch all sarpras items
  const sarprasQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'sarpras') as CollectionReference<SarprasItem>;
  }, [firestore]);

  // Fetch all supplies
  const suppliesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'supplies') as CollectionReference<OfficeSupply>;
  }, [firestore]);

  const { data: assets, loading: loadingAssets } = useCollection<SarprasItem>(sarprasQuery);
  const { data: supplies, loading: loadingSupplies } = useCollection<OfficeSupply>(suppliesQuery);

  const checklistQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'maintenance_checklists') as CollectionReference<MaintenanceChecklist>;
  }, [firestore]);

  const calibrationQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'calibrations') as CollectionReference<CalibrationRecord>;
  }, [firestore]);

  const damageReportQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'damage_reports') as CollectionReference<DamageReport>,
      where('status', '==', 'Open')
    );
  }, [firestore]);

  const { data: checklists } = useCollection<MaintenanceChecklist>(checklistQuery);
  const { data: calibrations } = useCollection<CalibrationRecord>(calibrationQuery);
  const { data: openDamageReports } = useCollection<DamageReport>(damageReportQuery);

  const predictiveAlerts = useMemo(() => {
    if (!checklists && !calibrations) return [];

    const alerts = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let maintCount = 0;
    let maintUrgent = 0;
    let calibCount = 0;
    let calibUrgent = 0;

    if (checklists) {
      checklists.forEach(item => {
        if (!item.nextInspection) {
          maintCount++;
          maintUrgent++;
        } else {
          try {
            const nextDate = parseISO(item.nextInspection);
            const diff = differenceInDays(nextDate, today);
            const isUrgent = diff <= 0 || item.status === 'Check';

            if (isUrgent) {
              maintCount++;
              maintUrgent++;
            } else if (diff <= 7) {
              maintCount++;
            }
          } catch (e) { }
        }
      });
    }

    if (calibrations) {
      calibrations.forEach(item => {
        if (item.teraBerikutnya) {
          try {
            const nextDate = parseISO(item.teraBerikutnya);
            const diff = differenceInDays(nextDate, today);
            if (diff <= 30) {
              calibCount++;
              if (diff <= 0) calibUrgent++;
            }
          } catch (e) { }
        }
      });
    }

    if (calibCount > 0) {
      alerts.push({
        id: 'calib_group',
        type: 'calibration',
        title: `${calibCount} Peralatan Butuh Kalibrasi/Tera`,
        message: calibUrgent > 0
          ? `${calibUrgent} peralatan teranya sudah KADALUARSA. Segera lakukan pengecekan!`
          : `Ada ${calibCount} peralatan yang teranya akan habis dalam 30 hari ke depan.`,
        isUrgent: calibUrgent > 0,
        link: '/calibration'
      });
    }

    if (maintCount > 0) {
      alerts.push({
        id: 'maint_group',
        type: 'maintenance',
        title: `${maintCount} Item Mendekati Jadwal Maintenance`,
        message: maintUrgent > 0
          ? `${maintUrgent} item sudah LEWAT JADWAL (HARI INI). Segera lakukan pemeriksaan.`
          : `Ada ${maintCount} item yang perlu di-maintenance dalam 7 hari ke depan.`,
        isUrgent: maintUrgent > 0,
        link: '/ceklish-maintenance'
      });
    }

    if (openDamageReports) {
      const highPriority = openDamageReports.filter(dr => dr.priority === 'Tinggi');
      if (highPriority.length > 0) {
        alerts.push({
          id: 'damage_reports_urgent',
          type: 'damage_report',
          title: `${highPriority.length} Laporan Kerusakan Urgent (Tinggi)`,
          message: `Terdapat laporan kerusakan sarpras dengan prioritas TINGGI yang belum diselesaikan!`,
          isUrgent: true,
          link: '/laporan-kerusakan'
        });
      }
    }

    return alerts;
  }, [checklists, calibrations, openDamageReports]);

  const stats = useMemo(() => {
    if (!assets || !supplies) return null;

    const brokenUnits = assets.filter(a => a.status === 'Rusak').length;
    const maintenanceUnits = assets.filter(a => a.status === 'Perlu Perbaikan').length;
    const lowStockItems = supplies.filter(s => s.quantity <= (s.minStock || 0)).length;
    const totalVehicles = assets.filter(a => ['Refueller', 'Bridger', 'Mobil Kantor'].includes(a.category)).length;

    return {
      brokenUnits,
      maintenanceUnits,
      lowStockItems,
      totalVehicles,
      isPerfect: brokenUnits === 0 && maintenanceUnits === 0 && lowStockItems === 0
    };
  }, [assets, supplies]);

  const loading = loadingAssets || loadingSupplies;

  return (
    <div className="space-y-10">

      {/* Predictive Dashboard Alerts */}
      {!loading && predictiveAlerts.length > 0 && (
        <div className="space-y-3 mb-6 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <BellRing className="w-4 h-4 text-orange-500" /> Action Required (Prediktif)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {predictiveAlerts.map(alert => (
              <Link href={alert.link} key={alert.id}>
                <Alert className={`cursor-pointer transition-all border-2 shadow-sm hover:shadow-md ${alert.isUrgent ? 'bg-red-50 border-red-200 hover:bg-red-100' : 'bg-orange-50 border-orange-200 hover:bg-orange-100'
                  }`}>
                  <CalendarDays className={`h-5 w-5 ${alert.isUrgent ? 'text-red-600' : 'text-orange-600'}`} />
                  <AlertTitle className={`font-bold ${alert.isUrgent ? 'text-red-900' : 'text-orange-900'}`}>
                    {alert.title}
                  </AlertTitle>
                  <AlertDescription className={`text-xs ${alert.isUrgent ? 'text-red-700 font-medium' : 'text-orange-700'}`}>
                    {alert.message}
                  </AlertDescription>
                </Alert>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Dashboard - Hidden */}
      {false && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))
          ) : (
            <>
              {/*             <Card className="bg-blue-600 text-white border-none shadow-md overflow-hidden relative">
                <div className="absolute right-[-10px] top-[-10px] opacity-20">
                  <Truck className="h-24 w-24" />
                </div>
                <CardContent className="p-4 flex flex-col justify-center h-full relative z-10">
                  <p className="text-xs font-bold uppercase opacity-80">Total Armada</p>
                  <p className="text-3xl font-black">{stats?.totalVehicles || 0} <span className="text-sm font-normal">Unit</span></p>
                </CardContent>
              </Card> */}

              <Card className={`${(stats?.brokenUnits ?? 0) > 0 ? 'bg-red-600 animate-pulse' : 'bg-white border-2'} transition-all duration-500`}>
                <CardContent className="p-4 flex items-center gap-4 h-full">
                  <div className={`p-2 rounded-lg ${(stats?.brokenUnits ?? 0) > 0 ? 'bg-white/20 text-white' : 'bg-red-50 text-red-600'}`}>
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                  <div>
                    <p className={`text-[10px] font-bold uppercase ${(stats?.brokenUnits ?? 0) > 0 ? 'text-white/80' : 'text-gray-500'}`}>Unit Rusak (Grounded)</p>
                    <p className={`text-2xl font-black ${(stats?.brokenUnits ?? 0) > 0 ? 'text-white' : 'text-red-600'}`}>{stats?.brokenUnits || 0}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-2">
                <CardContent className="p-4 flex items-center gap-4 h-full">
                  <div className="p-2 rounded-lg bg-yellow-50 text-yellow-600">
                    <Wrench className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-gray-500">Perlu Perbaikan</p>
                    <p className="text-2xl font-black text-yellow-600">{stats?.maintenanceUnits || 0}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className={`${(stats?.lowStockItems ?? 0) > 0 ? 'bg-orange-500 text-white border-none' : 'bg-white border-2'}`}>
                <CardContent className="p-4 flex items-center gap-4 h-full">
                  <div className={`p-2 rounded-lg ${(stats?.lowStockItems ?? 0) > 0 ? 'bg-white/20' : 'bg-orange-50 text-orange-600'}`}>
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div>
                    <p className={`text-[10px] font-bold uppercase ${(stats?.lowStockItems ?? 0) > 0 ? 'text-white/80' : 'text-gray-500'}`}>Stok ATK Kritis</p>
                    <p className="text-2xl font-black">{stats?.lowStockItems || 0}</p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}



      {/* Main Menus */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
        {sarprasMenus.map((menu) => (
          <Link key={menu.title} href={menu.href} className="group">
            <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/30 bg-white">
              <CardHeader className="flex flex-row items-center gap-6 p-6">
                <div className={`p-4 rounded-2xl ${menu.bgColor} ${menu.color} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                  <menu.icon className="h-10 w-10" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl group-hover:text-primary transition-colors tracking-tight">
                    {menu.title}
                  </CardTitle>
                  <CardDescription className="mt-1 text-sm leading-relaxed">
                    {menu.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6 pt-0 flex justify-end">
                <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary">
                    Buka Management
                  </span>
                  <div className="h-6 w-6 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                    <span className="text-lg">→</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
