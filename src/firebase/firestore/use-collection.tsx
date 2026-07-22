'use client';

import {useEffect, useState} from 'react';
import {
  onSnapshot,
  type FirestoreError,
  type Query,
  type QuerySnapshot,
} from 'firebase/firestore';

export function useCollection<T>(
  queryObj: Query<T> | null,
) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!queryObj) {
      setLoading(false);
      return;
    }

    // Menggunakan serverTimestamps: 'estimate' agar data baru yang baru saja 
    // disimpan (optimistic update) memiliki estimasi waktu dan tidak bernilai null.
    const unsubscribe = onSnapshot(
      queryObj,
      (snapshot: QuerySnapshot<T>) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data({ serverTimestamps: 'estimate' }),
        })) as T[];
        setData(data);
        setLoading(false);
      },
      (err: FirestoreError) => {
        console.error("Firestore useCollection Error:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [queryObj]); // Dependency langsung pada objek query yang sudah di-memoize

  return {data, loading, error};
}
