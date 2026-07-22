const fs = require('fs');
const file = 'src/lib/types.ts';
let code = fs.readFileSync(file, 'utf-8');

const newInterface = `
export interface MaintenanceHistory {
  id?: string;
  checklistId: string;
  item: string;
  sf: string;
  period: string;
  inspectionDate: string;
  status: string;
  keterangan: string;
  hasilCeklish?: string;
  formUrl?: string;
  createdAt: Timestamp | string;
  createdBy?: string;
}
`;

if (!code.includes('MaintenanceHistory')) {
  code += newInterface;
  fs.writeFileSync(file, code);
  console.log('Updated types.ts');
} else {
  console.log('MaintenanceHistory already exists');
}
