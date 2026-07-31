import GuestLaporanForm from '@/components/teknik-maintenance/GuestLaporanForm';

export default function LaporPage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
            DIGITAL REPORT DEO
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-slate-500 dark:text-slate-400 sm:mt-4">
            Portal Pelaporan Kerusakan Sarana dan Prasarana
          </p>
        </div>
        <GuestLaporanForm />
      </div>
    </div>
  );
}
