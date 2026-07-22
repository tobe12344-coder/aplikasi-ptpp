const fs = require('fs');
const path = 'd:/aftdeo-app/src/components/safety-briefing/SafetyBriefingClient.tsx';
let code = fs.readFileSync(path, 'utf8');

const correctAccordion = `<Accordion type="single" collapsible className="w-full">
                {briefings.map(briefing => (
                  <AccordionItem value={briefing.id} key={briefing.id}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between w-full pr-4 border-b">
                      <AccordionTrigger className="flex-1 hover:no-underline px-4">
                        <div className="flex flex-col text-left">
                          <span className="font-semibold">{briefing.topic}</span>
                          <span className="text-xs text-muted-foreground">{format(getBriefingDate(briefing.timestamp), "eeee, d MMMM yyyy", { locale: indonesiaLocale })}</span>
                        </div>
                      </AccordionTrigger>
                      <div className="flex items-center gap-2 pl-4 pb-2 md:pb-0">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => exportSingleToPDF(briefing)}>
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50">
                              {isDeleting === briefing.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Riwayat?</AlertDialogTitle>
                              <AlertDialogDescription>Data safety briefing ini akan dihapus secara permanen dan tidak dapat dikembalikan.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(briefing.id!)}>Hapus</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <AccordionContent>
                      <div className="flex flex-col md:flex-row gap-6 p-4">
                        {briefing.photos && briefing.photos.length > 0 ? (
                          <div className="w-full md:w-1/3 flex flex-col gap-2">
                            {briefing.photos.map((url, i) => (
                              <img key={i} src={url} alt={\`Foto Briefing \${i + 1}\`} className="rounded-lg object-cover w-full max-h-60" />
                            ))}
                          </div>
                        ) : briefing.photo ? (
                          <div className="w-full md:w-1/3">
                            <img src={briefing.photo} alt="Foto Briefing" className="rounded-lg object-cover w-full max-h-60" />
                          </div>
                        ) : null}
                        <div className={\`prose prose-sm max-w-none text-gray-700 \${(briefing.photos && briefing.photos.length > 0) || briefing.photo ? 'md:w-2/3' : 'w-full'}\`}>
                          <p><strong>Pemateri:</strong> {briefing.conductor}</p>
                          {briefing.notes && <p><strong>Catatan:</strong> {briefing.notes}</p>}
                          <p className="font-semibold mt-4">Peserta ({briefing.attendees.length} orang):</p>
                          <ul className="list-disc list-inside grid grid-cols-2 md:grid-cols-3 gap-x-4">
                            {briefing.attendees.map(name => <li key={name}>{name}</li>)}
                          </ul>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>`;

const startStr = '<Accordion type="single" collapsible className="w-full">';
const endStr = '</Accordion>';
const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr, startIndex) + endStr.length;

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + correctAccordion + code.substring(endIndex);
  fs.writeFileSync(path, code);
  console.log("Successfully replaced Accordion block.");
} else {
  console.error("Could not find Accordion block!");
}
