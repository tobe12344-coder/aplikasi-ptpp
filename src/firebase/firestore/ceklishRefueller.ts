import { collection, addDoc, Timestamp, type Firestore } from 'firebase/firestore';
import type { CeklishRefuellerSession } from '@/lib/types';

export const addCeklishRefuellerSession = async (
  db: Firestore,
  data: Omit<CeklishRefuellerSession, 'id' | 'timestamp'>
) => {
  try {
    const docRef = await addDoc(collection(db, 'ceklish-refueller-records'), {
      ...data,
      timestamp: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding ceklish refueller session: ', error);
    throw error;
  }
};
