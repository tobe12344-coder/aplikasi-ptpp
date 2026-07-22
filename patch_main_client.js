const fs = require('fs');
const file = 'src/components/sarpras/CeklishMaintenanceClient.tsx';
let code = fs.readFileSync(file, 'utf-8');

if (!code.includes('PrintAllChecklists')) {
  // 1. Add import for Link and PrintAllChecklists
  code = code.replace(
    "import PrintBlankForm from './PrintBlankForm';",
    "import PrintBlankForm from './PrintBlankForm';\nimport PrintAllChecklists from './PrintAllChecklists';\nimport Link from 'next/link';\nimport { History } from 'lucide-react';"
  );

  // 2. Add state
  code = code.replace(
    "const [itemToPrint, setItemToPrint] = useState<MaintenanceChecklist | null>(null);",
    "const [itemToPrint, setItemToPrint] = useState<MaintenanceChecklist | null>(null);\n  const [isPrintingAll, setIsPrintingAll] = useState(false);"
  );

  // 3. Add print all handler
  const printAllHandler = `
  const handlePrintAll = () => {
    setIsPrintingAll(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setIsPrintingAll(false), 1000);
    }, 100);
  };
  `;
  code = code.replace(
    "const handlePrint = (item: MaintenanceChecklist) =>",
    printAllHandler + "\n  const handlePrint = (item: MaintenanceChecklist) =>"
  );

  // 4. Update return logic to support printing all
  const returnLogic = `
  if (isPrintingAll && data) {
    return <PrintAllChecklists data={data} />;
  }

  if (itemToPrint) {
`;
  code = code.replace("if (itemToPrint) {", returnLogic);

  // 5. Add Print All & History buttons next to the Search input in the Header
  const buttonsHTML = `
            {data && data.length > 0 && (
              <Button onClick={handlePrintAll} variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                <Printer className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Cetak Rekap</span>
              </Button>
            )}

            <Link href="/sarpras/ceklish-maintenance/history">
              <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                <History className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Riwayat</span>
              </Button>
            </Link>
  `;

  code = code.replace(
    /\{\s*data\s*&&\s*data\.length\s*===\s*0\s*&&\s*\(/g,
    buttonsHTML + "\n            {data && data.length === 0 && ("
  );

  fs.writeFileSync(file, code);
  console.log('Updated CeklishMaintenanceClient.tsx');
} else {
  console.log('Already updated');
}
