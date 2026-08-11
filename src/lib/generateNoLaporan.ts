import { Firestore, doc, runTransaction } from 'firebase/firestore';

export const generateSequentialNoLaporan = async (firestore: Firestore): Promise<string> => {
  const year = new Date().getFullYear();
  const counterRef = doc(firestore, 'counters', `ptpp_${year}`);
  
  try {
    const nextNum = await runTransaction(firestore, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let current = 0;
      if (counterDoc.exists()) {
        current = counterDoc.data().count || 0;
      }
      const next = current + 1;
      transaction.set(counterRef, { count: next }, { merge: true });
      return next;
    });
    
    const paddedNum = nextNum.toString().padStart(3, '0');
    return `PTPP-${paddedNum}/PNDB240000/${year}`;
  } catch (error) {
    console.error("Error generating sequential No Laporan, falling back to random: ", error);
    // Fallback if transaction fails (e.g. offline or rules issue)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PTPP-${random}/PNDB240000/${year}`;
  }
};
