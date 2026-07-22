# Walkthrough: Tanda Tangan Digital AFTM untuk Logbook Security

Saya telah selesai mengimplementasikan sistem Endorsement (Tanda Tangan) AFTM sesuai dengan rencana kita. Berikut adalah rincian perubahannya:

## 1. Halaman Tanda Tangan Dokumen (Admin Dashboard)
- Terdapat menu baru bernama **"Tanda Tangan Dokumen"** dengan ikon pena di Dashboard.
- Halaman ini (`/admin-endorsements`) akan menampilkan daftar tanggal dalam 14 hari terakhir.
- AFTM dapat melihat status Logbook harian apakah sudah ditandatangani atau belum.
- Tombol **"Tandatangani"** bisa ditekan untuk memberikan persetujuan (akan mengubah status menjadi **Disetujui**).

## 2. Pengecekan Non-blocking di Ekspor PDF
- Di halaman Logbook Security, saat tombol **"Ekspor Laporan"** ditekan, sistem kini mengecek terlebih dahulu status tanda tangan untuk rentang hari laporan tersebut (mengecek status di hari terakhir / _End Date_).
- **Jika sudah ditandatangani:** Tanda tangan AFTM yang diambil dari file `TTDAFTM.png` akan disematkan secara otomatis di bagian bawah PDF.
- **Jika belum ditandatangani:** Akan muncul kotak tanda tangan dengan garis putus-putus untuk mengakomodasi tanda tangan basah jika diperlukan, dan PDF tetap bisa dicetak kapanpun.

> [!TIP]
> **Silakan dicoba di aplikasi Anda!**
> 1. Buka halaman **Dashboard**, pilih menu **Tanda Tangan Dokumen**.
> 2. Klik tombol "Tandatangani" untuk hari ini.
> 3. Buka modul **Keamanan** -> **Logbook**, dan lakukan Ekspor PDF untuk hari ini.
> 4. Anda akan melihat gambar `TTDAFTM.png` otomatis muncul di bagian bawah dokumen PDF!

## Langkah Berikutnya
Karena sistem ini sudah diterapkan di **Logbook Security**, Anda bisa mencobanya terlebih dahulu. Jika alurnya sudah dirasa pas dan berjalan dengan baik, kita bisa mulai menerapkan konsep yang sama (atau modifikasi kecil) untuk dokumen lain yang memerlukan persetujuan AFTM.
