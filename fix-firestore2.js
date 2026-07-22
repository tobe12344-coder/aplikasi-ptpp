const fs = require('fs');

const files = [
  'D:/AFTDEO MANAGER/src/components/absensi/AttendanceClient.tsx',
  'D:/AFTDEO MANAGER/src/components/izin-keluar/LeavePermitClient.tsx',
  'D:/AFTDEO MANAGER/src/components/lemburan/LemburanClient.tsx',
  'D:/AFTDEO MANAGER/src/components/safety-briefing/SafetyBriefingClient.tsx',
  'D:/AFTDEO MANAGER/src/components/sarpras/WorkshopInventoryClient.tsx',
  'D:/AFTDEO MANAGER/src/components/security/GatePassClient.tsx',
  'D:/AFTDEO MANAGER/src/components/security/LogbookClient.tsx',
  'D:/AFTDEO MANAGER/src/components/security/PatrolClient.tsx',
  'D:/AFTDEO MANAGER/src/components/security/PenitipanClient.tsx',
  'D:/AFTDEO MANAGER/src/components/security/SecurityModuleClient.tsx',
  'D:/AFTDEO MANAGER/src/components/security/ShiftHandoverClient.tsx',
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');

  // Find all matches of `const firestore = useFirestore();` with any leading whitespace
  const pattern = /^\s*const firestore = useFirestore\(\);\s*$/gm;
  
  const matches = content.match(pattern);
  if (matches && matches.length > 1) {
      let firstMatchFound = false;
      content = content.replace(pattern, (match) => {
          if (!firstMatchFound) {
              firstMatchFound = true;
              return match;
          }
          return ''; // Remove subsequent matches
      });
      fs.writeFileSync(file, content);
  }
}

console.log("Done");
