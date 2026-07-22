const fs = require('fs');
const path = 'd:/aftdeo-app/src/components/safety-briefing/SafetyBriefingClient.tsx';
let code = fs.readFileSync(path, 'utf8');

const targetRegex = /addSafetyBriefing\(\s*firestore,\s*\{\s*\.\.\.values,\s*photos:\s*photoUrls,\s*photo:\s*photoUrls\.length\s*>\s*0\s*\?\s*photoUrls\[0\]\s*:\s*''\s*\}\s*\);/g;

const replacementStr = `const signatureData = signatureRef.current && !signatureRef.current.isEmpty() ? signatureRef.current.toDataURL() : '';
      if (!signatureData) {
        toast({ variant: 'destructive', title: 'Tanda tangan Pengawas wajib diisi' });
        setIsUploading(false);
        return;
      }
      
      addSafetyBriefing(firestore, { 
        ...values, 
        photos: photoUrls,
        photo: photoUrls.length > 0 ? photoUrls[0] : '',
        pengawasSignature: signatureData,
        isSignedByPengawas: true,
        isSignedByAFTM: false
      });`;

if (targetRegex.test(code)) {
  code = code.replace(targetRegex, replacementStr);
  fs.writeFileSync(path, code);
  console.log("Successfully fixed onSubmit logic.");
} else {
  console.error("Could not find the target string with regex!");
}
