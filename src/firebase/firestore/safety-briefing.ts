'use client';

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';
import type { SafetyBriefing } from '@/lib/types';
import { addSecurityLog } from './security';

export function addSafetyBriefing(firestore: Firestore | null, briefingData: Omit<SafetyBriefing, 'id' | 'timestamp'>) {
  if (!firestore) {
    console.error('Firestore is not initialized');
    return;
  }
  const briefingCollection = collection(firestore, 'safety-briefings');
  const dataWithTimestamp = { ...briefingData, timestamp: serverTimestamp() };
  
  addDoc(briefingCollection, dataWithTimestamp).then(() => {
    addSecurityLog(firestore, {
      date: briefingData.date,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
      officer: briefingData.conductor,
      activity: 'SAFETY BRIEFING',
      details: `Kegiatan Safety Briefing telah dilaksanakan oleh ${briefingData.conductor} dengan topik ${briefingData.topic} dihadiri ${briefingData.attendees.length} peserta`,
      location: 'Area Operasional / Tersendiri',
      shift: '', // Atau hitung berdasarkan jam
    });
  }).catch(serverError => {
    const permissionError = new FirestorePermissionError({
      path: briefingCollection.path,
      operation: 'create',
      requestResourceData: dataWithTimestamp,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

export function updateSafetyBriefing(firestore: Firestore | null, briefingId: string, briefingData: Partial<SafetyBriefing>) {
  if (!firestore) return;
  const docRef = doc(firestore, 'safety-briefings', briefingId);
  updateDoc(docRef, briefingData).catch(serverError => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: briefingData,
    }));
  });
}

export function deleteSafetyBriefing(firestore: Firestore | null, briefingId: string) {
  if (!firestore) return;
  const docRef = doc(firestore, 'safety-briefings', briefingId);
  deleteDoc(docRef).catch(serverError => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: docRef.path,
      operation: 'delete',
    }));
  });
}

export async function signSafetyBriefingAFTM(firestore: Firestore, id: string, userName: string) {
  const docRef = doc(firestore, 'safety-briefings', id);
  await updateDoc(docRef, {
    isSignedByAFTM: true,
    aftmName: userName,
    aftmSignature: 'https://placehold.co/200x100/ffffff/000000.png?text=Signed+by+AFTM',
  });
}
