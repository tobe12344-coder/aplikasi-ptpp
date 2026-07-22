const fs = require('fs');
const path = 'd:/aftdeo-app/src/components/safety-briefing/SafetyBriefingClient.tsx';
let code = fs.readFileSync(path, 'utf8');

const helperCode = `const getBriefingDate = (ts: any) => {
  if (!ts) return new Date();
  if (typeof ts.toDate === 'function') return ts.toDate();
  return new Date(ts);
};
`;

code = code.replace(
  "const [isUploading, setIsUploading] = useState(false);",
  helperCode + "\n  const [isUploading, setIsUploading] = useState(false);"
);

code = code.replace(/b\.timestamp\.toDate\(\)/g, "getBriefingDate(b.timestamp)");
code = code.replace(/briefing\.timestamp\.toDate\(\)/g, "getBriefingDate(briefing.timestamp)");

fs.writeFileSync(path, code);
