const fs = require('fs');
const file = 'src/components/sarpras/MaintenanceHistoryClient.tsx';
let code = fs.readFileSync(file, 'utf-8');

if (!code.includes('PrintHistoryForm')) {
  // Add import
  code = code.replace(
    "import { format, parseISO } from 'date-fns';",
    "import PrintHistoryForm from './PrintHistoryForm';\nimport { format, parseISO } from 'date-fns';"
  );

  // Add state for itemToPrint
  code = code.replace(
    "const [searchTerm, setSearchTerm] = useState('');",
    "const [searchTerm, setSearchTerm] = useState('');\n  const [itemToPrint, setItemToPrint] = useState<MaintenanceHistory | null>(null);"
  );

  // Add print handler
  const printHandler = `
  const handlePrint = (item: MaintenanceHistory) => {
    setItemToPrint(item);
    setTimeout(() => {
      window.print();
      setTimeout(() => setItemToPrint(null), 1000);
    }, 100);
  };
  `;

  code = code.replace(
    "const filteredData = data?.filter",
    printHandler + "\n  const filteredData = data?.filter"
  );

  // Add condition return if printing
  const printReturn = `
  if (itemToPrint) {
    return <PrintHistoryForm item={itemToPrint} />;
  }
  `;

  code = code.replace(
    "return (\n    <div className=\"space-y-6\">",
    printReturn + "\n  return (\n    <div className=\"space-y-6\">"
  );

  // Replace dummy print logic with real handler
  code = code.replace(
    /onClick=\{\(\) => \{\s*\/\/\s*TODO:\s*implement print for history item\s*\}\}/g,
    "onClick={() => handlePrint(row)}"
  );

  fs.writeFileSync(file, code);
  console.log('Updated MaintenanceHistoryClient.tsx');
} else {
  console.log('Already updated');
}
