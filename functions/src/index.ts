import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import { differenceInDays, parseISO, startOfDay } from "date-fns";

admin.initializeApp();
const db = admin.firestore();

// Token dan nomor tujuan WhatsApp
const FONNTE_TOKEN = "CuGgJDvoXw1ULh5QT8ui";
const TARGET_NUMBERS = "085399770069,085298099251,081247895859,082248013774";

/**
 * Scheduled function to run every day at 07:00 AM in Jayapura/Sorong (WIT) timezone.
 */
export const sendMaintenanceReminder = onSchedule({
    schedule: "0 7 * * *",
    timeZone: "Asia/Jayapura", 
    region: "asia-southeast1",
}, async (event) => {
    try {
        console.log("Memulai pengecekan jadwal maintenance harian...");
        const today = startOfDay(new Date());

        // 1. Cek Checklist Maintenance
        const snapshot = await db.collection("maintenance_checklists").get();
        const dueItems: any[] = [];

        if (!snapshot.empty) {
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.status === "Complete") return;
                if (!data.nextInspection || data.status === "Check") {
                    dueItems.push(data);
                    return;
                }
                try {
                    const nextDate = startOfDay(parseISO(data.nextInspection));
                    const diffDays = differenceInDays(nextDate, today);
                    if (diffDays <= 0) {
                        dueItems.push(data);
                    }
                } catch (error) {
                    console.error(`Error parsing date for item ${doc.id}:`, error);
                }
            });
        }

        // 2. Cek Kalibrasi dan Tera
        const calibSnapshot = await db.collection("calibrations").get();
        const dueCalibItems: any[] = [];

        if (!calibSnapshot.empty) {
            calibSnapshot.forEach((doc) => {
                const data = doc.data();
                if (!data.teraBerikutnya) return;
                try {
                    const nextDate = startOfDay(parseISO(data.teraBerikutnya));
                    const diffDays = differenceInDays(nextDate, today);
                    if (diffDays <= 0) {
                        dueCalibItems.push({ ...data, diffDays });
                    }
                } catch (error) {
                    console.error(`Error parsing date for calibration ${doc.id}:`, error);
                }
            });
        }

        if (dueItems.length === 0 && dueCalibItems.length === 0) {
            console.log("Tidak ada alat yang jatuh tempo hari ini.");
            return;
        }

        // Susun pesan WhatsApp
        let message = `*PENGINGAT RUTIN DEO MAINTENANCE*\n\n`;
        
        if (dueItems.length > 0) {
            message += `🛠️ *Ceklish Maintenance*\n`;
            message += `Terdapat *${dueItems.length} item* yang memerlukan inspeksi:\n`;
            dueItems.forEach((cItem, index) => {
                const title = cItem.item || `Item #${index + 1}`;
                message += `${index + 1}. ${title}`;
                if (cItem.sf) {
                    message += ` (${cItem.sf})`;
                }
                message += `\n`;
            });
            message += `\n`;
        }

        if (dueCalibItems.length > 0) {
            message += `⚖️ *Kalibrasi & Tera*\n`;
            message += `Terdapat *${dueCalibItems.length} alat* yang jatuh tempo kalibrasi/tera atau terlewat:\n`;
            dueCalibItems.forEach((item, index) => {
                const title = item.namaPeralatan || `Alat #${index + 1}`;
                const diff = item.diffDays;
                const status = diff < 0 ? `(Lewat ${Math.abs(diff)} hari)` : `(Hari ini)`;
                message += `${index + 1}. ${title} ${status}\n`;
            });
            message += `\n`;
        }

        message += `Silakan buka aplikasi DEO Maintenance untuk melakukan tindak lanjut.\n`;
        message += `\nTerima kasih! 🙏`;

        console.log("Mengirim pesan ke WhatsApp...");
        
        // Kirim ke Fonnte
        const response = await fetch("https://api.fonnte.com/send", {
            method: "POST",
            headers: {
                "Authorization": FONNTE_TOKEN,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                target: TARGET_NUMBERS,
                message: message,
                countryCode: "62",
            }),
        });

        const result = await response.json();
        
        if (!response.ok || !result.status) {
            console.error("Gagal mengirim WA via Fonnte:", result);
        } else {
            console.log("Berhasil mengirim pengingat WA harian!", result);
        }

    } catch (error) {
        console.error("Terjadi kesalahan saat memproses pengingat harian:", error);
    }
});
