
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
import type { WorkshopMaterial, WorkshopTransaction } from '@/lib/types';

// MATERIAL MASTER FUNCTIONS
export function addWorkshopMaterial(firestore: Firestore | null, data: Omit<WorkshopMaterial, 'id'>) {
  if (!firestore) return;
  const colRef = collection(firestore, 'workshop-materials');
  addDoc(colRef, data).catch(serverError => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: colRef.path,
      operation: 'create',
      requestResourceData: data,
    }));
  });
}

export function updateWorkshopMaterial(firestore: Firestore | null, id: string, data: Partial<Omit<WorkshopMaterial, 'id'>>) {
  if (!firestore) return;
  const docRef = doc(firestore, 'workshop-materials', id);
  updateDoc(docRef, data).catch(serverError => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: data,
    }));
  });
}

export function deleteWorkshopMaterial(firestore: Firestore | null, id: string) {
  if (!firestore) return;
  const docRef = doc(firestore, 'workshop-materials', id);
  deleteDoc(docRef).catch(serverError => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: docRef.path,
      operation: 'delete',
    }));
  });
}

// TRANSACTION FUNCTIONS
export function addWorkshopTransaction(firestore: Firestore | null, data: Omit<WorkshopTransaction, 'id' | 'timestamp'>) {
  if (!firestore) return;
  const colRef = collection(firestore, 'workshop-transactions');
  const payload = { ...data, timestamp: serverTimestamp() };
  addDoc(colRef, payload).catch(serverError => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: colRef.path,
      operation: 'create',
      requestResourceData: payload,
    }));
  });
}
