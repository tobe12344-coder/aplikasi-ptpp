
import { Timestamp } from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";

export interface Employee {
  id: string;
  name: string;
  jabatan?: string;
  keterangan?: string;
}

export interface WorkshopMaterial {
  id: string;
  name: string;
  code: string;
  type: string;
  location: string;
  unit: string;
  photo?: string;
}

export interface WorkshopTransaction {
  id: string;
  materialId: string;
  materialName: string;
  type: 'Masuk' | 'Keluar';
  quantity: number;
  date: string;
  officer: string;
  notes?: string;
  timestamp: Timestamp;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  status: 'Present' | 'Clocked Out' | 'Absent' | 'On Leave';
  clockIn: string;
  clockOut: string;
  leaveOut: string;
  returnIn: string;
  notes: string;
}

export interface WasteData {
  id: string;
  jenis:
    | 'Oli bekas'
    | 'Filter Bekas'
    | 'Accu Bekas'
    | 'Kemasan Tinta Bekas'
    | 'Kain Majun Bekas'
    | 'Lampu Bekas';
  jumlah: number;
  unit: 'Kg' | 'Liter' | 'TON';
  tanggalMasuk: string;
  sumber: 'Proses' | 'Operasional' | 'Kantor';
  status: string;
  perlakuan: string;
  kodeManifestasi?: string;
  catatan?: string;
}

export interface SarprasItem {
  id: string;
  name: string;
  category: 'Refueller' | 'Bridger' | 'Mobil Kantor' | 'Barang Kantor' | 'Barang Workshop';
  status: 'Baik' | 'Perlu Perbaikan' | 'Rusak';
  lastMaintenance: string;
  location: string;
  plateNumber?: string;
  capacity?: string;
  damageArea?: string;
  damageNotes?: string;
}

export interface OfficeSupply {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minStock?: number;
  lastUpdated: Timestamp;
}

export interface Guest {
  id: string;
  name: string;
  perusahaan: string;
  yangDikunjungi: string;
  maksudKunjungan: string;
  tandaPengenal: string;
  photoID?: string;
  zona: 'Bebas' | 'Terbatas' | 'Terlarang';
  visitorCardNumber: string;
  signature: string;
  photo?: string;
  timestamp: Timestamp | string;
  checkOutTime?: Timestamp | string;
  status?: 'Aktif' | 'Selesai';
  durationHours?: string;
}

export interface AppUser extends FirebaseUser {
  id?: string; // Firestore document ID (ditambahkan oleh useCollection hook)
  role?: 'admin' | 'employee' | 'security' | 'receptionist' | 'teknik' | 'csbr' | 'tad' | 'ro' | 'pp' | 'driver';
  status?: 'pending' | 'approved';
  jobTitle?: string;
}

export interface OvertimeRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  approvedDuration?: number;
  description: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  signature?: string;
}

export interface SafetyBriefing {
  id: string;
  date: string;
  topic: string;
  conductor: string;
  attendees: string[];
  notes?: string;
  photo?: string;
  photos?: string[];
  pengawasName?: string;
  pengawasSignature?: string;
  isSignedByPengawas?: boolean;
  aftmName?: string;
  aftmSignature?: string;
  isSignedByAFTM?: boolean;
  timestamp: Timestamp | string;
}

export interface LeavePermit {
    id: string;
    employeeId: string;
    employeeName: string;
    date: string;
    leaveTime: string;
    purpose: string;
    securityOnDuty: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'On Leave' | 'Returned' | 'Butuh Klarifikasi';
    approvedBy?: string;
    timestamp: Timestamp;
    securityOutSignature?: string;
    actualLeaveTime?: string;
    actualReturnTime?: string;
}

export interface OfficerEntry {
  name: string;
  photo: string;
  signature?: string;
}

export interface ShiftHandover {
  id: string;
  date: string;
  shift: 'Pagi' | 'Siang' | 'Malam';
  handoverPhoto: string;
  handoverPhotos?: string[];
  outgoingOfficers: OfficerEntry[];
  incomingOfficers: OfficerEntry[];
  notes: string;
  timestamp: Timestamp;
}

export interface PatrolCheck {
  location: string;
  photo: string;
  photos?: string[];
  coordinates?: string;
}

export interface PatrolRecord {
  id: string;
  date: string;
  time: string;
  officers: string[]; // Diubah dari officer: string
  locationChecks: PatrolCheck[];
  findings: string;
  status: 'Aman' | 'Ada Temuan';
  timestamp: Timestamp;
}

export interface SecurityLog {
  id: string;
  date: string;
  time: string;
  officer: string;
  activity: string;
  details: string;
  location?: string;
  shift?: string;
  photo?: string;
  photos?: string[];
  timestamp: Timestamp;
}

export interface GatePassChecklist {
  suratJalan: boolean;
  kabinKendaraan: boolean;
  segelKargo: boolean;
}

export interface GatePassBridgerChecklist {
  dokumen: boolean;
  segel: boolean;
}

export interface GatePassLog {
  id: string;
  category?: 'Umum' | 'Bridger';
  noShipment?: string;
  noSegel?: string;
  date: string;
  time: string;
  vehicleNumber: string;
  driverName: string;
  company: string;
  purpose: string;
  itemDescription: string;
  type?: 'Masuk' | 'Keluar';
  officer: string;
  timestamp: Timestamp;
  photo?: string;
  vehicleType?: string;
  photos?: string[];
  status?: 'Di Dalam' | 'Selesai';
  checks?: GatePassChecklist;
  bridgerChecks?: GatePassBridgerChecklist;
  outDate?: string;
  outTime?: string;
  outOfficer?: string;
  outPhotos?: string[];
  outChecks?: GatePassChecklist;
}

export interface PenitipanLog {
  id: string;
  receiptNumber?: string;
  date: string;
  time: string;
  itemName: string;
  ownerName: string;
  notes?: string;
  status: 'Titip' | 'Diambil';
  returnDate?: string;
  returnTime?: string;
  officer: string;
  timestamp: Timestamp;
  photo?: string;
  signature?: string;
  returnPhoto?: string;
}

export interface MaintenanceChecklist {
  id?: string;
  no: string;
  item: string;
  sf: string;
  period: string;
  lastInspection: string;
  nextInspection: string;
  status: 'Check' | 'Complete' | 'Pending';
  keterangan: string;
  hasilCeklish?: string;
  formUrl?: string; // For the uploaded form
  sfFileUrl?: string; // For the blank SF template
  updatedAt?: Timestamp | string;
  updatedBy?: string;
}

export interface MaintenanceHistory {
  id?: string;
  checklistId: string;
  item: string;
  sf: string;
  period: string;
  inspectionDate: string;
  status: string;
  keterangan: string;
  hasilCeklish?: string;
  formUrl?: string;
  createdAt: Timestamp | string;
  createdBy?: string;
}

export interface CalibrationCertificate {
  year: string;
  fileUrl: string;
  fileName: string;
  uploadedAt?: string;
}

export interface CalibrationRecord {
  id: string;
  kategori: string; // 'FLOW METER' | 'TANKI TIMBUN/REFUELLER' | 'PERALATAN LAIN'
  namaPeralatan: string;
  noSeri?: string;
  tahunPemakaian: string;
  kondisiFisik: 'Berfungsi' | 'Tidak Berfungsi';
  teraTerakhir: string; // YYYY-MM-DD
  teraBerikutnya: string; // YYYY-MM-DD
  usulanProgram?: string;
  keterangan: string;
  certificates?: CalibrationCertificate[];
  timestamp: Timestamp;
}

export interface DailyReport {
  id?: string;
  date: string;
  activities: string;
  attendanceSummary: string;
  guestAndSecuritySummary: string;
  leaveAndOvertimeSummary: string;
  generatedReport: string;
  createdAt: Timestamp | string;
  createdBy?: string;
}

export interface ShiftExchangeRecord {
  id: string;
  applicantName: string;
  applicantShift: string;
  originalDate: string;
  substituteName: string;
  substituteShift: string;
  exchangeDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  timestamp: Timestamp | string;
  approvedBy?: string;
  signature?: string;          // Tanda tangan admin/atasan
  applicantSignature?: string; // Tanda tangan pemohon
  substituteSignature?: string; // Tanda tangan pengganti
}

export interface MobilChecklist {
  id?: string;
  mobilId: string;
  mobilName: string; // e.g. "Innova 1"
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  driverName: string;
  kilometer: number;
  bbmBar: number; // in bars
  checks: Record<string, 'Bagus' | 'Rusak'>; // For the 33 items
  photos: {
    depan?: string;
    belakang?: string;
    kiri?: string;
    kanan?: string;
    dalam?: string;
  };
  catatan: string;
  statusKelaikan: 'Layak Jalan' | 'Tidak Layak' | 'Menunggu Pengecekan';
  shift?: 'Pagi' | 'Sore';
  kebersihan?: 'Bersih' | 'Kotor';
  hsseStatus?: 'Pending' | 'Approved' | 'Rejected';
  hsseApprovedBy?: string;
  hsseApprovedAt?: Timestamp | string;
  timestamp: Timestamp | string;
}

export interface DippingMeasurement {
  refueller: string; // 'DEO 10' | 'DEO 12' | 'DEO 14' | 'DEO 15'
  value: string; // e.g., '122.8 cm', '-', 'sdr.Taril lanjut'
  roName: string;
}

export interface DippingSession {
  id?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  shift: string; // e.g., 'Pagi', 'Siang', 'Malam'
  group: string; // e.g., 'Group C'
  securityName: string;
  measurements: DippingMeasurement[];
  photo?: string;
  timestamp: Timestamp | string;
}

export interface CeklishRefuellerItem {
  id: string;
  name: string;
  status: string; // 'S', 'C', 'N/A', or ''
  note: string;
}

export interface CeklishRefuellerSession {
  id?: string;
  unit: string;
  date: string;
  time: string;
  group: string;
  shift: string;
  truckConditions: Record<string, CeklishRefuellerItem>;
  tankCondition: Record<string, CeklishRefuellerItem>;
  safetyEquipments: Record<string, CeklishRefuellerItem>;
  refuelingEquipments: Record<string, CeklishRefuellerItem>;
  operatorName: string;
  timestamp: Timestamp | string;
}

export interface LogbookEndorsement {
  id?: string; // e.g. "2026-07-10"
  date: string; // YYYY-MM-DD
  isSignedByAFTM: boolean;
  signedAt: Timestamp | string;
  signedBy: string;
}

export interface OperationalLog {
  id?: string;
  date: string;
  time: string;
  mobilId: string;
  mobilName: string;
  driverName: string;
  purpose: string;
  status: 'Pending' | 'Di Luar' | 'Selesai';
  outOfficer?: string;
  outTime?: string;
  outDate?: string;
  inOfficer?: string;
  inTime?: string;
  inDate?: string;
  photoIn?: string;
  timestamp: Timestamp | string;
}

export interface SecurityReport {
  id?: string;
  date: string;
  shift: string;
  penyerahName: string;
  penyerahSignature: string;
  penerimaName: string;
  penerimaSignature: string;
  isSignedByHSSE: boolean;
  hsseName?: string;
  hsseSignature?: string;
  hsseSignedAt?: Timestamp | string;
  isSignedByAFTM: boolean;
  aftmName?: string;
  aftmSignature?: string;
  aftmSignedAt?: Timestamp | string;
  createdAt: Timestamp | string;
}

export interface DamageReport {
  id?: string;
  noLaporan: string; // Auto-generated
  
  // -- Diisi oleh Pelapor --
  timestamp: string; // Waktu pelaporan
  timestamp_obj?: any; // For sorting
  namaPelapor: string;
  jabatanPelapor: string;
  areaKerusakan: string; // (Kantor, Refueller, dll)
  jenisKerusakan: string; // Penjelasan lengkap
  fotoKerusakan?: string;
  sumberKetidaksesuaian: string; // (Audit, Keluhan, dll)
  
  // -- Diisi oleh Admin Teknik --
  analisaPenyebab?: string;
  tanggalTindakLanjut?: string; // YYYY-MM-DD
  pelaksanaanPerbaikan?: string;
  jabatanTimPerbaikan?: string;
  status: 'Open' | 'Close' | 'On Progres'; // Default 'Open'
  kebutuhanMaterial?: string;
  konversiGambar?: string; // (URL Gambar)
  perbaikanSementara?: string;
  statusPengadaan?: string; // (Pengadaan Jasa, Material, dll)
  dokumenDirevisi?: string;
  
  priority?: 'Rendah' | 'Sedang' | 'Tinggi'; // For Dashboard Notifications
}
