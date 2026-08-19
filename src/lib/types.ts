
import { Timestamp } from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";


export interface AppUser extends FirebaseUser {
  id?: string; // Firestore document ID (ditambahkan oleh useCollection hook)
  role?: 'admin' | 'employee' | 'security' | 'receptionist' | 'teknik' | 'csbr' | 'tad' | 'ro' | 'pp' | 'driver' | 'spv_rsd' | 'spv_maintenance' | 'aftm';
  status?: 'pending' | 'approved';
  jobTitle?: string;
}

export type PTPPWorkflowState = 'DRAFT' | 'WAITING_SPV_RSD_1' | 'WAITING_MAINTENANCE' | 'WAITING_SPV_RSD_2' | 'WAITING_AFTM' | 'COMPLETED' | 'REJECTED';

export interface DamageReport {
  id?: string;
  noLaporan: string; // Auto-generated
  
  // -- PART 1: Di isi oleh pemohon/auditor --
  timestamp: string; // Waktu pelaporan
  timestamp_obj?: any; // For sorting
  namaPelapor: string; // Dari/Fungsi (Pemohon)
  jabatanPelapor: string;
  kepadaFungsi?: string; // e.g. Kiamnasmeithson / Maintenance
  areaKerusakan: string; // Area / Lokasi Temuan
  
  sumberKetidaksesuaian?: string; // (Keluhan, Audit, dll)
  jenisKerusakan: string; // KETIDAKSESUAIAN ATAU POTENSI YANG DITEMUKAN
  persyaratanDilanggar?: string;
  kategoriPTPP?: 'Perbaikan' | 'Perawatan';
  batasWaktuReply?: string;
  fotoKerusakan?: string; // Ilustrasi / Gambar
  
  signaturePemohon?: string; // Timestamp / Name
  signaturePemohon_image?: string; // Base64 signature
  signatureSpvRsd1?: string; // Tanda tangan Urip Widodo
  signatureSpvRsd1_timestamp?: any;
  signatureSpvRsd1_image?: string; // Base64 signature

  // -- PART 2: Di isi oleh penerima laporan --
  perbaikanSementara?: string;
  tanggalInspeksi?: string;
  
  // Tabel Analisa & Tindakan
  analisaPenyebab?: string;
  tindakanPerbaikan?: string;
  pic?: string;
  waktuPelaksanaan?: string;
  
  dokumenDirevisi?: string; // Pedoman/Manual, TKI, TKO, dll
  targetWaktuVerifikasi?: string;
  
  signatureSpvMaintenance?: string; // Penanggung Jawab
  signatureSpvMaintenance_timestamp?: any;
  signatureSpvMaintenance_image?: string; // Base64 signature
  signatureSpvRsd2?: string; // Disetujui Oleh (Urip Widodo)
  signatureSpvRsd2_timestamp?: any;
  signatureSpvRsd2_image?: string; // Base64 signature

  // -- PART 3: Di isi oleh pemohon/auditor --
  status: 'Open' | 'Close' | 'On Progres' | 'Perlu Follow up' | 'REJECTED'; 
  tanggalVerifikasi?: string;
  targetVerifikasiSelanjutnya?: string;
  catatan?: string;
  
  signatureAftm?: string; // Approval AFTM
  signatureAftm_timestamp?: any;
  signatureAftm_image?: string; // Base64 signature

  // Workflow State
  workflowState?: PTPPWorkflowState;
  
  rejectNoteRSD1?: string;
  rejectNoteRSD2?: string;
  rejectNoteAFTM?: string;
  
  // Old/Legacy fields to maintain compatibility temporarily
  tanggalTindakLanjut?: string;
  pelaksanaanPerbaikan?: string;
  jabatanTimPerbaikan?: string;
  kebutuhanMaterial?: string;
  konversiGambar?: string;
  statusPengadaan?: string;
  priority?: 'Rendah' | 'Sedang' | 'Tinggi';
}
