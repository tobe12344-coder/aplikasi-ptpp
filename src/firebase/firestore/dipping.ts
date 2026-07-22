import { collection, addDoc, serverTimestamp, type Firestore } from 'firebase/firestore';
import type { DippingSession } from '@/lib/types';

export async function addDippingSession(
  firestore: Firestore | null,
  data: Omit<DippingSession, 'id' | 'timestamp'>
) {
  if (!firestore) throw new Error('Firestore is not initialized');

  const docRef = await addDoc(collection(firestore, 'dipping-records'), {
    ...data,
    timestamp: serverTimestamp(),
  });

  return docRef.id;
}

