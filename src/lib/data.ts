
import type { Employee, AttendanceRecord, WasteData, Guest, SarprasItem } from './types';

export const employees: Employee[] = [
  { id: '745526', name: 'Joni Herawan', jabatan: 'AFT Manager DEO', keterangan: 'ORGANIK' },
  { id: '752172', name: 'Urip Widodo', jabatan: 'Supervisor RSD', keterangan: 'ORGANIK' },
  { id: '754519', name: 'Kiamnasmeithson', jabatan: 'Supervisor Maintenance', keterangan: 'ORGANIK' },
  { id: '756087', name: 'Boetros Boetros ghali Hutajulu', jabatan: 'Jr. SPV RSD', keterangan: 'ORGANIK' },
  { id: '755997', name: 'Hary Achmad Nugroho', jabatan: 'Jr. SPV RSD', keterangan: 'ORGANIK' },
  { id: '39021302', name: 'Delvilino B Wader', jabatan: 'Lead Operator HSSE & GA', keterangan: 'ORGANIK' },
  { id: 'M518-212582', name: 'M Ibrahim Aldian Pasau', jabatan: 'Adm Layanan Jual', keterangan: 'TKJP (PTC Mandays)' },
  { id: 'M518-191865', name: 'Alfares Syatfle', jabatan: 'Penerimaan & Penimbunan', keterangan: 'TKJP (PTC Mandays)' },
  { id: 'M518-191864', name: 'Dereck Ginuni', jabatan: 'Teknik Support', keterangan: 'TKJP (PTC Mandays)' },
  { id: 'M518-191999', name: 'Rahmat', jabatan: 'Penerimaan & Penimbunan', keterangan: 'TKJP (PTC Mandays)' },
  { id: 'D119-250003', name: 'Muchamad Agunisman Zainal', jabatan: 'Penerimaan & Penimbunan', keterangan: 'TAD PTC (Volume)' },
  { id: 'M518-242767', name: 'Lelyana Sanda Padang', jabatan: 'Adm Teknik', keterangan: 'TKJP (PTC Mandays)' },
  { id: 'M275-242194', name: 'Akbar', jabatan: 'Teknik Support', keterangan: 'TAD PTC Volume' },
  { id: 'M968-231350', name: 'Ririn Anggraini Sudarto', jabatan: 'Medical', keterangan: 'TAD IHC' },
  { id: 'M156-122624', name: 'Andarias Ampang', jabatan: 'Refuelling Operator', keterangan: 'PTC (OPERATOR REFUELLING)' },
  { id: 'M156-165916', name: 'Ismail Boby', jabatan: 'Refuelling Operator', keterangan: 'PTC (OPERATOR REFUELLING)' },
  { id: 'M156-145915', name: 'Grivicko Paliama', jabatan: 'Refuelling Operator', keterangan: 'PTC (OPERATOR REFUELLING)' },
  { id: 'M156-180550', name: 'Efran Alex Murray', jabatan: 'Refuelling Operator', keterangan: 'PTC (OPERATOR REFUELLING)' },
  { id: 'M156-180552', name: 'Simon Marar', jabatan: 'Refuelling Operator', keterangan: 'PTC (OPERATOR REFUELLING)' },
  { id: 'M156-212775', name: 'Ahmad', jabatan: 'Refuelling Operator', keterangan: 'PTC (OPERATOR REFUELLING)' },
  { id: 'M156-180551', name: 'Muh Nur', jabatan: 'Refuelling Operator', keterangan: 'PTC (OPERATOR REFUELLING)' },
  { id: 'M156-223423', name: 'Ardis', jabatan: 'Refuelling Operator', keterangan: 'PTC (OPERATOR REFUELLING)' },
  { id: 'M156-165916-2', name: 'Mustaril Jawas', jabatan: 'Refuelling Operator', keterangan: 'PTC (OPERATOR REFUELLING)' },
  { id: 'M093-112647', name: 'Syamsuddin', jabatan: 'Security', keterangan: 'PTC (SECURITY)' },
  { id: 'M093-112633', name: 'Muhamad Nur', jabatan: 'Security', keterangan: 'PTC (SECURITY)' },
  { id: 'M093-167225', name: 'Muhamad Faisal', jabatan: 'Security', keterangan: 'PTC (SECURITY)' },
  { id: 'M093-112626', name: 'Alfons Saflesa', jabatan: 'Security', keterangan: 'PTC (SECURITY)' },
  { id: 'M887-223262', name: 'Delfis A Sitaniapessy', jabatan: 'Security', keterangan: 'PTC (SECURITY)' },
  { id: 'M887-223263', name: 'Cindy F Umacina', jabatan: 'Security', keterangan: 'PTC Volume (SECURITY)' },
  { id: 'F006-240415', name: 'Rahmat', jabatan: 'Security', keterangan: 'PTC (SECURITY)' },
  { id: 'TEMP-SEC-01', name: 'Romadhon Gian Prayoga', jabatan: 'Security', keterangan: 'Security Sementara' },
  { id: 'TEMP-SEC-02', name: 'La Ode Herman', jabatan: 'Security', keterangan: 'Security Sementara' },
  { id: '-20260026', name: 'Alexander Ulahayanan', jabatan: 'Driver Operasional', keterangan: 'Driver (Patra Logistik)' },
  { id: '-21260006', name: 'Supandi', jabatan: 'Driver AFTM', keterangan: 'Driver (PT PAR)' },
  { id: '-12546134', name: 'Fajri Amir', jabatan: 'Driver Pool Operasional', keterangan: 'Driver (Patra Logistik)' },
  { id: '-12546131', name: 'Yunike Muray', jabatan: 'Gardener', keterangan: 'CS (Patra Jasa)' },
  { id: '-12546707', name: 'Anggraini', jabatan: 'Gardener', keterangan: 'CS (Patra Jasa)' },
  { id: '-12546130', name: 'Ridwan Syam', jabatan: 'Leader CSBR', keterangan: 'CS (Patra Jasa)' },
  { id: '-12546129', name: 'Sardi', jabatan: 'CSBR', keterangan: 'CS (Patra Jasa)' },
  { id: 'PENDING-01', name: 'Acep M Gunadi', jabatan: 'CSBR', keterangan: 'CS (Patra Jasa)' },
  { id: '-12548590', name: 'Muhammad Darmansyah', jabatan: 'CSBR', keterangan: 'CS (Patra Jasa)' },
  { id: '12552928', name: 'Muh Yusril', jabatan: 'Gardener', keterangan: 'CS (Patra Jasa)' },
  { id: '732757644', name: 'Muh Yustin', jabatan: 'IT', keterangan: 'PT. Berca Hardayaperkasa' },
  { id: '12552929', name: 'Mawar E Saputri', jabatan: 'Gardener', keterangan: 'CS (Patra Jasa)' },
];

export const mockAttendance: AttendanceRecord[] = [];
export const mockWasteData: WasteData[] = [
    { id: '1', jenis: 'Oli bekas', jumlah: 20, unit: 'Liter', tanggalMasuk: '2023-10-26', sumber: 'Operasional', status: 'Disimpan Sementara', perlakuan: 'DISIMPAN DI TPS' },
    { id: '2', jenis: 'Kain Majun Bekas', jumlah: 5, unit: 'Kg', tanggalMasuk: '2023-10-25', sumber: 'Proses', status: 'Disimpan Sementara', perlakuan: 'DISIMPAN DI TPS', kodeManifestasi: 'M-12345' },
];
export const mockGuests: Guest[] = [];
export const mockSarpras: SarprasItem[] = [
  { 
    id: 'S001', 
    name: 'Mobil Tangki 01', 
    category: 'Refueller', // Ubah dari 'Kendaraan'
    status: 'Baik', 
    lastMaintenance: '2024-03-15', 
    location: 'Garasi A' 
  },
  { 
    id: 'S002', 
    name: 'Pompa Transfer A', 
    category: 'Barang Workshop', // Ubah dari 'Peralatan'
    status: 'Perlu Perbaikan', 
    lastMaintenance: '2024-01-20', 
    location: 'Area Pengisian' 
  },
  { 
    id: 'S003', 
    name: 'Gedung Kantor', 
    category: 'Barang Kantor', // Ubah dari 'Bangunan'
    status: 'Baik', 
    lastMaintenance: '2024-05-01', 
    location: 'Area Kantor' 
  },
];
