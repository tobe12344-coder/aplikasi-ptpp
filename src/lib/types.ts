
import { Timestamp } from "firebase/firestore";
import type { User as FirebaseUser } from "firebase/auth";


export interface AppUser extends FirebaseUser {
  id?: string; // Firestore document ID (ditambahkan oleh useCollection hook)
  role?: 'admin' | 'employee' | 'security' | 'receptionist' | 'teknik' | 'csbr' | 'tad' | 'ro' | 'pp' | 'driver';
  status?: 'pending' | 'approved';
  jobTitle?: string;
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
