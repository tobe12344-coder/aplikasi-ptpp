// Mengganti nama di signatureSpvRsd1 & signatureSpvRsd2 pada semua damage_reports menjadi "Urip Widodo".
// Hanya kolom yang sudah terisi (laporan yang sudah disetujui) yang diubah; kolom kosong dibiarkan.
//
// Butuh kredensial Google Cloud dengan akses ke project digiport-ptpp, salah satunya:
//   gcloud auth application-default login
//   atau GOOGLE_APPLICATION_CREDENTIALS=/path/ke/service-account.json
//
// Pemakaian:
//   node scripts/fix-rsd-names.mjs           # cek saja (dry run)
//   node scripts/fix-rsd-names.mjs --apply   # benar-benar mengubah
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const TARGET_NAME = "Urip Widodo";
const FIELDS = ["signatureSpvRsd1", "signatureSpvRsd2"];
const apply = process.argv.includes("--apply");

initializeApp({ credential: applicationDefault(), projectId: "digiport-ptpp" });
const db = getFirestore();

async function fixNames() {
  const snapshot = await db.collection("damage_reports").get();
  console.log(`Total laporan: ${snapshot.size}\n`);

  const changes = [];
  for (const reportDoc of snapshot.docs) {
    const data = reportDoc.data();
    const updates = {};
    for (const field of FIELDS) {
      const current = typeof data[field] === "string" ? data[field].trim() : "";
      if (current && current !== TARGET_NAME) {
        updates[field] = TARGET_NAME;
        console.log(`${data.noLaporan || reportDoc.id}  ${field}: "${data[field]}" -> "${TARGET_NAME}"`);
      }
    }
    if (Object.keys(updates).length > 0) changes.push({ ref: reportDoc.ref, updates });
  }

  console.log(`\n${changes.length} laporan perlu diubah.`);
  if (!apply) {
    console.log("Dry run: tidak ada yang diubah. Jalankan lagi dengan --apply untuk menyimpan.");
    return;
  }

  // Batch Firestore maksimal 500 operasi
  for (let i = 0; i < changes.length; i += 500) {
    const batch = db.batch();
    for (const { ref, updates } of changes.slice(i, i + 500)) batch.update(ref, updates);
    await batch.commit();
  }
  console.log(`✅ ${changes.length} laporan berhasil diubah.`);
}

fixNames().catch((error) => {
  console.error("❌ Gagal:", error.message);
  process.exit(1);
});
