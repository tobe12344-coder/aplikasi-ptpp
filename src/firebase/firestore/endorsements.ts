'use client';

import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function signLogbookDate(
  firestore: Firestore | null,
  dateString: string, // YYYY-MM-DD
  signedBy: string
) {
  if (!firestore) return;
  const docRef = doc(firestore, 'logbook-endorsements', dateString);
  const payload = {
    id: dateString,
    date: dateString,
    isSignedByAFTM: true,
    signedAt: serverTimestamp(),
    signedBy,
  };
  
  setDoc(docRef, payload, { merge: true }).catch(serverError => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: docRef.path,
      operation: 'update', // or create
      requestResourceData: payload,
    }));
  });
}
