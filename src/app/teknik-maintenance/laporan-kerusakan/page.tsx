import Header from '@/components/common/Header';
import BackButton from '@/components/common/BackButton';
import LaporanKerusakanClient from '@/components/teknik-maintenance/LaporanKerusakanClient';

export default function LaporanKerusakanPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <div className="p-4 md:p-8 flex-1">
        <BackButton href="/teknik-maintenance" />
        <div className="container mx-auto max-w-7xl mt-4">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Laporan Kerusakan Sarpras</h1>
            <p className="text-slate-500 mt-2 font-medium">Monitoring pelaporan kerusakan sarana dan prasarana.</p>
          </div>
          <LaporanKerusakanClient />
        </div>
      </div>
    </div>
  );
}
