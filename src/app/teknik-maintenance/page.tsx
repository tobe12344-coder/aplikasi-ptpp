
import BackButton from '@/components/common/BackButton';
import Header from '@/components/common/Header';
import TeknikModuleClient from '@/components/teknik-maintenance/TeknikModuleClient';

export default function TeknikMaintenancePage() {
  return (
    <>
      <Header />
      <div className="p-4 md:p-8">
        <BackButton />
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-8 text-center md:text-left">
            Teknik dan Maintenance
          </h1>
          <TeknikModuleClient />
        </div>
      </div>
    </>
  );
}
