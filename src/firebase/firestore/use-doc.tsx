'use client';

import {useEffect, useState} from 'react';
import {
  onSnapshot,
  type DocumentReference,
  type DocumentSnapshot,
  type FirestoreError,
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useDoc<T>(
  docRef: DocumentReference<T> | null,
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!docRef) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot: DocumentSnapshot<T>) => {
        if (snapshot.exists()) {
          // Menggunakan serverTimestamps: 'estimate' untuk konsistensi real-time
          const docData = {id: snapshot.id, ...snapshot.data({ serverTimestamps: 'estimate' })} as T;
          setData(docData);
        } else {
          setData(null);
        }
        setLoading(false);
      },
      async (err: FirestoreError) => {
        const permissionError = new FirestorePermissionError({
            path: docRef.path || 'unknown',
            operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [docRef?.path]); 

  return {data, loading, error};
}
