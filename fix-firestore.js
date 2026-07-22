const fs = require('fs');

const files = [
  'D:/AFTDEO MANAGER/src/components/security/GatePassClient.tsx',
  'D:/AFTDEO MANAGER/src/components/security/LogbookClient.tsx',
  'D:/AFTDEO MANAGER/src/components/security/PatrolClient.tsx',
  'D:/AFTDEO MANAGER/src/components/security/PenitipanClient.tsx',
  'D:/AFTDEO MANAGER/src/components/security/SecurityModuleClient.tsx',
  'D:/AFTDEO MANAGER/src/components/security/ShiftHandoverClient.tsx',
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');

  let parts = content.split('const firestore = useFirestore();');
  if (parts.length > 2) {
      content = parts[0] + 'const firestore = useFirestore();' + parts[1] + parts.slice(2).join('');
      fs.writeFileSync(file, content);
  }
}

console.log("Done");
