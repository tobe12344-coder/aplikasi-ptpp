import { doc, setDoc, updateDoc, serverTimestamp, type Firestore } from 'firebase/firestore';
import type { SecurityReport } from '@/lib/types';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export async function createSecurityReport(firestore: Firestore | null, data: Omit<SecurityReport, 'createdAt' | 'isSignedByHSSE' | 'isSignedByAFTM'>) {
  if (!firestore) return;
  const docRef = doc(firestore, 'security-reports', data.id!);
  
  const payload = {
    ...data,
    isSignedByHSSE: false,
    isSignedByAFTM: false,
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(docRef, payload);
  } catch (serverError) {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: docRef.path,
      operation: 'create',
      requestResourceData: payload,
    }));
    throw serverError;
  }
}

export async function signSecurityReportHSSE(firestore: Firestore | null, id: string, name: string) {
  if (!firestore) return;
  const docRef = doc(firestore, 'security-reports', id);
  
  const payload = {
    isSignedByHSSE: true,
    hsseName: name,
    hsseSignedAt: serverTimestamp(),
    // Temporary hardcoded signature image per user's request
    hsseSignature: 'https://placehold.co/200x100/ffffff/000000.png?text=Signed+by+HSSE',
  };

  try {
    await updateDoc(docRef, payload);
  } catch (serverError) {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: payload,
    }));
    throw serverError;
  }
}

export async function signSecurityReportAFTM(firestore: Firestore | null, id: string, name: string) {
  if (!firestore) return;
  const docRef = doc(firestore, 'security-reports', id);
  
  const payload = {
    isSignedByAFTM: true,
    aftmName: name,
    aftmSignedAt: serverTimestamp(),
    // Temporary hardcoded signature image per user's request
    aftmSignature: 'https://placehold.co/200x100/ffffff/000000.png?text=Signed+by+AFTM',
  };

  try {
    await updateDoc(docRef, payload);
  } catch (serverError) {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: docRef.path,
      operation: 'update',
      requestResourceData: payload,
    }));
    throw serverError;
  }
}
