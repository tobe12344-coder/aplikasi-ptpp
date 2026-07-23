
import BackButton from '@/components/common/BackButton';
import Header from '@/components/common/Header';
import TeknikModuleClient from '@/components/teknik-maintenance/TeknikModuleClient';

export default function TeknikMaintenancePage() {
  return (
    <>
      <Header />
      <div className="p-4 md:p-8">
        <div className="max-w-6xl mx-auto">

          <TeknikModuleClient />
        </div>
      </div>
    </>
  );
}
