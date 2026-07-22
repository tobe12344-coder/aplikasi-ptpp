import { collection, addDoc, getDocs, query, orderBy, serverTimestamp, deleteDoc, doc, type Firestore } from "firebase/firestore";
import { DailyReport } from "@/lib/types";

const COLLECTION_NAME = "daily_reports";

export const getDailyReports = async (firestore: Firestore): Promise<DailyReport[]> => {
  const q = query(collection(firestore, COLLECTION_NAME), orderBy("date", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as DailyReport[];
};

export const saveDailyReport = async (firestore: Firestore, reportData: Omit<DailyReport, "id" | "createdAt">): Promise<string> => {
  const docRef = await addDoc(collection(firestore, COLLECTION_NAME), {
    ...reportData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const deleteDailyReport = async (firestore: Firestore, id: string): Promise<void> => {
  await deleteDoc(doc(firestore, COLLECTION_NAME, id));
};
