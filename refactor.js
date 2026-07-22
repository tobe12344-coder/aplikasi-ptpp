const fs = require('fs');

const clientFiles = [
  './src/components/absensi/AttendanceClient.tsx',
  './src/components/izin-keluar/LeavePermitClient.tsx',
  './src/components/lemburan/LemburanClient.tsx',
  './src/components/safety-briefing/SafetyBriefingClient.tsx',
  './src/components/sarpras/WorkshopInventoryClient.tsx',
  './src/components/security/GatePassClient.tsx',
  './src/components/security/LogbookClient.tsx',
  './src/components/security/PatrolClient.tsx',
  './src/components/security/PenitipanClient.tsx',
  './src/components/security/SecurityModuleClient.tsx',
  './src/components/security/ShiftHandoverClient.tsx',
];

const pageFiles = [
  './src/app/absensi/page.tsx',
  './src/app/izin-keluar/page.tsx',
  './src/app/lemburan/page.tsx',
  './src/app/safety-briefing/page.tsx',
  './src/app/sarpras/workshop/page.tsx',
  './src/app/security/page.tsx',
  './src/app/security/gate-pass/page.tsx',
  './src/app/security/logbook/page.tsx',
  './src/app/security/patrol/page.tsx',
  './src/app/security/penitipan/page.tsx',
  './src/app/security/shift/page.tsx',
];

const hookCode = `
  // Dynamic employees
  const firestore = useFirestore();
  const employeesQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'employees') as CollectionReference<Employee>) : null, [firestore]);
  const { data: employeesData } = useCollection<Employee>(employeesQuery);
  const employees = employeesData || [];
`;

for (const file of clientFiles) {
  let content = fs.readFileSync(file, 'utf-8');

  // Remove `employees: Employee[];` from props interface
  content = content.replace(/employees:\s*Employee\[\];?\n?/g, '');
  content = content.replace(/employees\s*:\s*Employee\[\]\s*[,;]?/g, '');
  
  // Replace `{ employees }` with `{}`
  content = content.replace(/\{\s*employees\s*(,\s*)?/g, '{ ');
  
  // Inject hook
  // Find where to inject
  if (content.match(/export default function \w+Client\([^)]*\)\s*\{/)) {
      content = content.replace(/(export default function \w+Client\([^)]*\)\s*\{)/, '$1' + hookCode);
  }

  // Ensure imports
  if (!content.includes('useMemoFirebase')) {
      content = content.replace(/import\s*\{([^}]*)\}\s*from\s*['"]@\/firebase['"]/g, "import {$1, useMemoFirebase} from '@/firebase'");
  }
  if (!content.includes('useFirestore')) {
      content = content.replace(/import\s*\{([^}]*)\}\s*from\s*['"]@\/firebase['"]/g, "import {$1, useFirestore} from '@/firebase'");
  }
  if (!content.includes('useCollection')) {
      content = content.replace(/import\s*\{([^}]*)\}\s*from\s*['"]@\/firebase['"]/g, "import {$1, useCollection} from '@/firebase'");
  }
  
  // Need to import query, collection, CollectionReference if not present
  if (!content.includes('firebase/firestore')) {
      content = "import { collection, query, type CollectionReference } from 'firebase/firestore';\n" + content;
  } else {
      if (!content.includes('CollectionReference')) {
          content = content.replace(/from\s*['"]firebase\/firestore['"]/g, ", CollectionReference } from 'firebase/firestore'");
          content = content.replace(/},\s*CollectionReference/g, ", CollectionReference"); // Quick fix for comma
      }
      if (!content.includes('query')) {
          content = content.replace(/import\s*\{([^}]*)\}\s*from\s*['"]firebase\/firestore['"]/g, "import {$1, query} from 'firebase/firestore'");
      }
      if (!content.includes('collection')) {
          content = content.replace(/import\s*\{([^}]*)\}\s*from\s*['"]firebase\/firestore['"]/g, "import {$1, collection} from 'firebase/firestore'");
      }
  }

  // Ensure Employee is imported
  if (!content.includes('Employee')) {
      content = content.replace(/import\s*type\s*\{([^}]*)\}\s*from\s*['"]@\/lib\/types['"]/g, "import type {$1, Employee} from '@/lib/types'");
  }

  // Fix possible syntax errors from regex replacments
  content = content.replace(/,\s*,/g, ',');
  content = content.replace(/{\s*,/g, '{');
  content = content.replace(/,\s*}/g, '}');

  fs.writeFileSync(file, content);
}

for (const file of pageFiles) {
  let content = fs.readFileSync(file, 'utf-8');

  // Remove `employees={employees}`
  content = content.replace(/employees=\{employees\}/g, '');
  
  // Remove `import { employees } from '@/lib/data';`
  content = content.replace(/import\s*\{\s*employees\s*\}\s*from\s*['"]@\/lib\/data['"];?/g, '');

  fs.writeFileSync(file, content);
}

console.log("Done");
