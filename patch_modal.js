const fs = require('fs');
const file = 'src/components/sarpras/CeklishActionModal.tsx';
let code = fs.readFileSync(file, 'utf-8');

// 1. Update imports
if (!code.includes('addDoc') && !code.includes('collection')) {
  code = code.replace(
    "import { getFirestore, doc, updateDoc } from 'firebase/firestore';",
    "import { getFirestore, doc, updateDoc, collection, addDoc } from 'firebase/firestore';"
  );
}

// 2. Add history saving logic
const updateLogic = `      await updateDoc(docRef, {
        status,
        keterangan,
        hasilCeklish: '', // Kosongkan karena sudah digabung
        formUrl: formUrl || null,
        lastInspection,
        nextInspection,
        updatedAt: new Date().toISOString(),
      });`;

const historyLogic = `      // Add history record
      const historyRef = collection(db, 'maintenance_history');
      await addDoc(historyRef, {
        checklistId: item.id,
        item: item.item,
        sf: item.sf,
        period: item.period,
        inspectionDate: lastInspection,
        status: status,
        keterangan: keterangan,
        formUrl: formUrl || null,
        createdAt: new Date().toISOString(),
        // createdBy could be added if user info is available
      });`;

if (!code.includes("const historyRef = collection(db, 'maintenance_history');")) {
  code = code.replace(updateLogic, updateLogic + "\n\n" + historyLogic);
  fs.writeFileSync(file, code);
  console.log('Updated CeklishActionModal.tsx');
} else {
  console.log('Already updated');
}
