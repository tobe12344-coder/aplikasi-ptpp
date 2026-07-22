
'use client';

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';
import type { ShiftHandover, PatrolRecord, SecurityLog, GatePassLog, PenitipanLog, OperationalLog } from '@/lib/types';

/**
 * Helper to determine shift based on time
 */
function getShiftByTime(timeStr: string) {
    const hour = parseInt(timeStr.split(':')[0]);
    if (hour >= 7 && hour < 15) return 'Shift Pagi';
    if (hour >= 15 && hour < 23) return 'Shift Siang';
    return 'Shift Malam';
}

/**
 * Helper internal untuk menulis ke logbook tanpa memicu loop sinkronisasi.
 */
async function internalAddSecurityLog(firestore: Firestore, data: Omit<SecurityLog, 'id' | 'timestamp'>) {
    const colRef = collection(firestore, 'security-logs');
    const payload = { ...data, timestamp: serverTimestamp() };
    return addDoc(colRef, payload);
}

export function addShiftHandover(firestore: Firestore | null, data: Omit<ShiftHandover, 'id' | 'timestamp'>) {
  if (!firestore) return;
  const colRef = collection(firestore, 'shift-handovers');
  const payload = { ...data, timestamp: serverTimestamp() };
  
  addDoc(colRef, payload).then(() => {
      internalAddSecurityLog(firestore, {
          date: data.date,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
          officer: data.incomingOfficers.map(o => o.name).join(', '),
          activity: 'SERAH TERIMA SHIFT',
          location: 'Pos Security Utama',
          shift: `Shift ${data.shift}`,
          photo: data.handoverPhotos?.[0] || data.handoverPhoto || '',
          details: `Pelaksanaan serah terima shift ${data.shift}. Petugas Selesai: ${data.outgoingOfficers.map(o => o.name).join(', ')}. Petugas Mulai: ${data.incomingOfficers.map(o => o.name).join(', ')}. Catatan: ${data.notes || '-'}`,
      });
  }).catch(serverError => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: colRef.path,
      operation: 'create',
      requestResourceData: payload,
    }));
  });
}

export function addPatrol(firestore: Firestore | null, data: Omit<PatrolRecord, 'id' | 'timestamp'>) {
  if (!firestore) return;
  const colRef = collection(firestore, 'patrols');
  const payload = { ...data, timestamp: serverTimestamp() };
  
  addDoc(colRef, payload).then(() => {
      internalAddSecurityLog(firestore, {
          date: data.date,
          time: data.time,
          officer: data.officers.join(', '), // Menggabungkan nama-nama petugas
          activity: 'PATROLI KEAMANAN',
          location: data.locationChecks.map(l => l.location).join(', '),
          shift: getShiftByTime(data.time),
          photo: data.locationChecks[0]?.photos?.[0] || data.locationChecks[0]?.photo || '',
          details: `Kontrol keliling area selesai dengan status: ${data.status.toUpperCase()}. Petugas: ${data.officers.join(' & ')}. Temuan: ${data.findings}`,
      });
  }).catch(serverError => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: colRef.path,
      operation: 'create',
      requestResourceData: payload,
    }));
  });
}

export function addSecurityLog(firestore: Firestore | null, data: Omit<SecurityLog, 'id' | 'timestamp'>) {
  if (!firestore) return;
  internalAddSecurityLog(firestore, data).catch(serverError => {
    const colRef = collection(firestore, 'security-logs');
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: colRef.path,
      operation: 'create',
      requestResourceData: { ...data, timestamp: 'serverTimestamp()' },
    }));
  });
}

export function addGatePassLog(firestore: Firestore | null, data: Omit<GatePassLog, 'id' | 'timestamp'>) {
  if (!firestore) return;
  const colRef = collection(firestore, 'gate-pass');
  const payload = { ...data, timestamp: serverTimestamp() };
  
  addDoc(colRef, payload).then(() => {
      let detailsText = `Kendaraan ${data.vehicleType || ''} ${data.vehicleNumber} (${data.driverName} - ${data.company}) masuk area. Keperluan: ${data.purpose}. Barang: ${data.itemDescription}`;
      
      if (data.category === 'Bridger') {
          detailsText = `Kendaraan Bridger ${data.vehicleNumber} (${data.driverName}) masuk area. No Shipment: ${data.noShipment || '-'}, No Segel: ${data.noSegel || '-'}. Keterangan: ${data.itemDescription}`;
      }

      internalAddSecurityLog(firestore, {
          date: data.date,
          time: data.time,
          officer: data.officer,
          activity: `GATE PASS MASUK`,
          location: 'Main Gate (Pintu Masuk)',
          shift: getShiftByTime(data.time),
          details: detailsText,
          photo: data.photos?.[0] || data.photo || '',
          photos: data.photos || (data.photo ? [data.photo] : []),
      });
  }).catch(serverError => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: colRef.path,
      operation: 'create',
      requestResourceData: payload,
    }));
  });
}

export function addPenitipanLog(firestore: Firestore | null, data: Omit<PenitipanLog, 'id' | 'timestamp'>) {
  if (!firestore) return;
  const colRef = collection(firestore, 'penitipan');
  const payload = { ...data, timestamp: serverTimestamp() };
  
  addDoc(colRef, payload).then(() => {
      internalAddSecurityLog(firestore, {
          date: data.date,
          time: data.time,
          officer: data.officer,
          activity: 'PENITIPAN BARANG',
          location: 'Pos Penjagaan',
          shift: getShiftByTime(data.time),
          details: `Barang "${data.itemName}" dititipkan oleh ${data.ownerName}. Resi: ${data.receiptNumber || '-'}. Status: ${data.status.toUpperCase()}`,
          photo: data.photo || '',
          photos: data.photo ? [data.photo] : [],
      });
  }).catch(serverError => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: colRef.path,
      operation: 'create',
      requestResourceData: payload,
    }));
  });
}

export function updatePenitipanStatus(firestore: Firestore | null, id: string, status: 'Titip' | 'Diambil', returnDate: string, returnTime: string, signature?: string, returnPhoto?: string) {
  if (!firestore) return;
  const docRef = doc(firestore, 'penitipan', id);
  const data: any = { status, returnDate, returnTime };
  if (signature) data.signature = signature;
  if (returnPhoto) data.returnPhoto = returnPhoto;
  
  updateDoc(docRef, data).catch(serverError => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: data,
    }));
  });
}

import { deleteDoc } from 'firebase/firestore';

export function updateGatePassLog(firestore: Firestore | null, id: string, data: Partial<Omit<GatePassLog, 'id' | 'timestamp'>>) {
  if (!firestore) return;
  const docRef = doc(firestore, 'gate-pass', id);
  
  updateDoc(docRef, data).catch(serverError => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: data,
    }));
  });
}

export function deleteGatePassLog(firestore: Firestore | null, id: string) {
  if (!firestore) return;
  const docRef = doc(firestore, 'gate-pass', id);
  
  deleteDoc(docRef).catch(serverError => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: docRef.path,
      operation: 'delete',
      requestResourceData: {},
    }));
  });
}

export function checkoutGatePass(firestore: Firestore | null, id: string, outData: {
  outDate: string;
  outTime: string;
  outOfficer: string;
  outPhotos?: string[];
  outChecks?: any;
}, gatePassLogData: any) {
  if (!firestore) return Promise.resolve();
  const docRef = doc(firestore, 'gate-pass', id);
  const dataToUpdate = { ...outData, status: 'Selesai' as const };
  
  return updateDoc(docRef, dataToUpdate).then(() => {
      let detailsText = `Kendaraan ${gatePassLogData.vehicleType || ''} ${gatePassLogData.vehicleNumber} (${gatePassLogData.driverName} - ${gatePassLogData.company}) keluar area.`;
      
      if (gatePassLogData.category === 'Bridger') {
          detailsText = `Kendaraan Bridger ${gatePassLogData.vehicleNumber} (${gatePassLogData.driverName}) keluar area.`;
      }

      internalAddSecurityLog(firestore, {
          date: outData.outDate,
          time: outData.outTime,
          officer: outData.outOfficer,
          activity: `GATE PASS KELUAR`,
          location: 'Main Gate (Pintu Keluar)',
          shift: getShiftByTime(outData.outTime),
          details: detailsText,
          photo: outData.outPhotos?.[0] || '',
          photos: outData.outPhotos || [],
      });
  }).catch(serverError => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: dataToUpdate,
    }));
    throw serverError;
  });
}

export function addOperationalLog(firestore: Firestore | null, data: Omit<OperationalLog, 'id' | 'timestamp'>) {
  if (!firestore) return;
  const colRef = collection(firestore, 'operational_logs');
  const payload = { ...data, timestamp: serverTimestamp() };
  
  return addDoc(colRef, payload).catch(serverError => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: colRef.path,
      operation: 'create',
      requestResourceData: payload,
    }));
  });
}

export function approveOperationalExit(firestore: Firestore | null, id: string, outData: { outDate: string; outTime: string; outOfficer: string }, logData: OperationalLog) {
  if (!firestore) return;
  const docRef = doc(firestore, 'operational_logs', id);
  const dataToUpdate = { ...outData, status: 'Di Luar' as const };

  return updateDoc(docRef, dataToUpdate).then(() => {
       internalAddSecurityLog(firestore, {
          date: outData.outDate,
          time: outData.outTime,
          officer: outData.outOfficer,
          activity: 'MOBIL OPERASIONAL KELUAR',
          location: 'Main Gate (Pintu Keluar)',
          shift: getShiftByTime(outData.outTime),
          details: `Mobil Operasional ${logData.mobilName} (${logData.driverName}) diizinkan keluar area. Keperluan: ${logData.purpose}.`,
          photo: ''
       });
  }).catch(serverError => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: dataToUpdate,
    }));
  });
}

export function approveOperationalEntry(firestore: Firestore | null, id: string, inData: { inDate: string; inTime: string; inOfficer: string; photoIn?: string }, logData: OperationalLog) {
  if (!firestore) return;
  const docRef = doc(firestore, 'operational_logs', id);
  const dataToUpdate = { ...inData, status: 'Selesai' as const };

  return updateDoc(docRef, dataToUpdate).then(() => {
       internalAddSecurityLog(firestore, {
          date: inData.inDate,
          time: inData.inTime,
          officer: inData.inOfficer,
          activity: 'MOBIL OPERASIONAL MASUK',
          location: 'Main Gate (Pintu Masuk)',
          shift: getShiftByTime(inData.inTime),
          details: `Mobil Operasional ${logData.mobilName} (${logData.driverName}) masuk area kembali setelah ${logData.purpose}.`,
          photo: inData.photoIn || ''
       });
  }).catch(serverError => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: dataToUpdate,
    }));
  });
}
