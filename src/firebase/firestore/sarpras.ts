
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
import type { SarprasItem, OfficeSupply } from '@/lib/types';

type SarprasInput = Omit<SarprasItem, 'id'>;

export function addSarpras(firestore: Firestore | null, sarprasData: SarprasInput) {
  if (!firestore) {
    console.error('Firestore is not initialized');
    return;
  }
  const sarprasCollection = collection(firestore, 'sarpras');
  
  addDoc(sarprasCollection, sarprasData).catch(serverError => {
    const permissionError = new FirestorePermissionError({
      path: sarprasCollection.path,
      operation: 'create',
      requestResourceData: sarprasData,
    });
    errorEmitter.emit('permission-error', permissionError);
  });
}

export function updateSarpras(firestore: Firestore | null, id: string, data: Partial<SarprasInput>) {
  if (!firestore) return;
  const docRef = doc(firestore, 'sarpras', id);
  updateDoc(docRef, data).catch(serverError => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: data,
    }));
  });
}

export function deleteSarpras(firestore: Firestore | null, id: string) {
  if (!firestore) return;
  const docRef = doc(firestore, 'sarpras', id);
  deleteDoc(docRef).catch(serverError => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: docRef.path,
      operation: 'delete',
    }));
  });
}

// SUPPLY FUNCTIONS
export function addSupply(firestore: Firestore | null, data: Omit<OfficeSupply, 'id' | 'lastUpdated'>) {
  if (!firestore) return;
  const colRef = collection(firestore, 'supplies');
  const payload = { ...data, lastUpdated: serverTimestamp() };
  addDoc(colRef, payload).catch(serverError => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: colRef.path,
      operation: 'create',
      requestResourceData: payload,
    }));
  });
}

export function updateSupply(firestore: Firestore | null, id: string, data: Partial<Omit<OfficeSupply, 'id' | 'lastUpdated'>>) {
  if (!firestore) return;
  const docRef = doc(firestore, 'supplies', id);
  const payload = { ...data, lastUpdated: serverTimestamp() };
  updateDoc(docRef, payload).catch(serverError => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: payload,
    }));
  });
}

export function deleteSupply(firestore: Firestore | null, id: string) {
  if (!firestore) return;
  const docRef = doc(firestore, 'supplies', id);
  deleteDoc(docRef).catch(serverError => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: docRef.path,
      operation: 'delete',
    }));
  });
}

// CALIBRATION FUNCTIONS
export function addCalibration(firestore: Firestore | null, data: Omit<import('@/lib/types').CalibrationRecord, 'id' | 'timestamp'>) {
  if (!firestore) return;
  const colRef = collection(firestore, 'calibrations');
  const payload = { ...data, timestamp: serverTimestamp() };
  addDoc(colRef, payload).catch(serverError => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: colRef.path,
      operation: 'create',
      requestResourceData: payload,
    }));
  });
}

export function updateCalibration(firestore: Firestore | null, id: string, data: Partial<Omit<import('@/lib/types').CalibrationRecord, 'id' | 'timestamp'>>) {
  if (!firestore) return;
  const docRef = doc(firestore, 'calibrations', id);
  const payload = { ...data, timestamp: serverTimestamp() };
  updateDoc(docRef, payload).catch(serverError => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: payload,
    }));
  });
}

export function deleteCalibration(firestore: Firestore | null, id: string) {
  if (!firestore) return;
  const docRef = doc(firestore, 'calibrations', id);
  deleteDoc(docRef).catch(serverError => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: docRef.path,
      operation: 'delete',
    }));
  });
}
