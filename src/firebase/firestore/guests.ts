
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

type GuestInput = {
  name: string;
  perusahaan: string;
  yangDikunjungi: string;
  maksudKunjungan: string;
  tandaPengenal: string;
  photoID?: string;
  zona: 'Bebas' | 'Terbatas' | 'Terlarang';
  visitorCardNumber: string;
  signature: string;
  photo?: string;
};

export function addGuest(firestore: Firestore | null, guestData: GuestInput) {
  if (!firestore) {
    console.error('Firestore is not initialized');
    return;
  }
  const guestCollection = collection(firestore, 'guests');
  const dataWithTimestamp = { ...guestData, timestamp: serverTimestamp() };
  
  return addDoc(guestCollection, dataWithTimestamp).catch(serverError => {
    const permissionError = new FirestorePermissionError({
      path: guestCollection.path,
      operation: 'create',
      requestResourceData: dataWithTimestamp,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
}

export function updateGuest(firestore: Firestore | null, id: string, guestData: Partial<GuestInput>) {
  if (!firestore) {
    console.error('Firestore is not initialized');
    return;
  }
  const guestDocRef = doc(firestore, 'guests', id);

  return updateDoc(guestDocRef, guestData).catch(serverError => {
    const permissionError = new FirestorePermissionError({
        path: guestDocRef.path,
        operation: 'update',
        requestResourceData: guestData,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
}

export function deleteGuest(firestore: Firestore | null, id: string) {
  if (!firestore) {
    console.error('Firestore is not initialized');
    return;
  }
  const guestDocRef = doc(firestore, 'guests', id);

  return deleteDoc(guestDocRef).catch(serverError => {
    const permissionError = new FirestorePermissionError({
        path: guestDocRef.path,
        operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
}
