# Rencana Implementasi: Endorsement AFTM untuk Logbook Security

Fitur ini akan mengimplementasikan sistem persetujuan (endorsement) non-blocking untuk laporan **Logbook Security**. AFTM dapat memantau dan menandatangani logbook per hari melalui dashboard, sementara staf tetap bisa mencetak PDF kapan saja (dengan atau tanpa tanda tangan).

## 1. Konsep Data (Firestore)
Karena Logbook Security terdiri dari banyak entri (`security-logs`) per harinya, AFTM sebaiknya tidak menandatangani setiap baris, melainkan **menandatangani Logbook per Hari**.

Kita akan membuat satu _collection_ baru di Firestore bernama `logbook-endorsements`.
**Struktur Data:**
```typescript
interface LogbookEndorsement {
  id: string; // Format: "YYYY-MM-DD" (sebagai ID unik per hari)
  date: string;
  isSignedByAFTM: boolean;
  signedAt: Timestamp;
  signedBy: string; // Nama AFTM
  signatureImage?: string; // (Opsional) jika kita ingin menyimpan url gambar TTD
}
```

## 2. Modifikasi PDF Logbook (`LogbookClient.tsx`)
- Pada bagian bawah PDF (`doc.autoTable` didDrawPage atau setelah tabel selesai), kita akan menambahkan **Kolom Tanda Tangan**.
- Sistem akan mengecek ke koleksi `logbook-endorsements` berdasarkan rentang tanggal yang dipilih.
- **Jika sudah di-TTD:** Menampilkan gambar tanda tangan AFTM beserta nama dan tanggal pengesahan.
- **Jika belum di-TTD:** Menampilkan kotak tanda tangan kosong dengan tulisan "Mengetahui, AFTM" agar bisa ditandatangani basah jika perlu.

## 3. Dashboard Admin AFTM
- Membuat halaman baru: `src/app/admin/endorsements/page.tsx` (atau menu serupa di Dashboard).
- Menampilkan daftar tanggal (misalnya 7 hari terakhir) yang **belum ditandatangani**.
- Terdapat tombol **"Tandatangani"**. Saat diklik, sistem akan membuat dokumen di koleksi `logbook-endorsements` dengan `isSignedByAFTM: true`.

> [!IMPORTANT]
> **Pertanyaan untuk Anda:**
> 1. Karena Logbook bisa diekspor untuk **rentang hari** (misal: 1 Juli - 7 Juli), apakah Anda setuju jika AFTM menandatangani Logbook **secara Harian** (Per Hari)? Ataukah AFTM menandatanganinya per **Laporan** yang di-generate? Pendekatan harian (Per Hari) biasanya lebih mudah dilacak di Dashboard.
> 2. Apakah Anda sudah memiliki gambar/file Tanda Tangan AFTM yang akan disematkan ke dalam PDF? (Untuk sementara saya bisa gunakan _placeholder_ atau gambar dummy).
> 3. Apakah halaman Dashboard AFTM ini akan kita buatkan menu baru di sidebar bernama "Approval/Endorsement"?

## 4. Rencana Verifikasi
- Melakukan generate PDF sebelum di-TTD (pastikan kolom TTD kosong).
- Menekan tombol "Tandatangani" di Dashboard AFTM.
- Melakukan generate PDF ulang (pastikan kolom TTD berisi gambar tanda tangan).
