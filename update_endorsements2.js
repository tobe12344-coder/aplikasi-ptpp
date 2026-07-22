const fs = require('fs');
const path = 'd:/aftdeo-app/src/components/admin-endorsements/EndorsementsClient.tsx';

let code = fs.readFileSync(path, 'utf8');

// Add imports
code = code.replace(
  "import type { SecurityReport } from '@/lib/types';",
  "import type { SecurityReport, SafetyBriefing } from '@/lib/types';\nimport { signSafetyBriefingAFTM } from '@/firebase/firestore/safety-briefing';"
);

// Add briefingsQuery inside component
code = code.replace(
  "const { data: reports, loading } = useCollection<SecurityReport>(reportsQuery);",
  "const { data: reports, loading } = useCollection<SecurityReport>(reportsQuery);\n\n  const briefingsQuery = useMemoFirebase(() => {\n    if (!firestore) return null;\n    return query(collection(firestore, 'safety-briefings') as CollectionReference<SafetyBriefing>, orderBy('timestamp', 'desc'), limit(50));\n  }, [firestore]);\n  const { data: briefings, loading: loadingBriefings } = useCollection<SafetyBriefing>(briefingsQuery);"
);

// Add handleSignSafety function
code = code.replace(
  "const handleSign = async (id: string) => {",
  "const handleSignSafety = async (id: string) => {\n    if (!user || !user.displayName) return;\n    setIsSigning(prev => ({ ...prev, [id]: true }));\n    try {\n      await signSafetyBriefingAFTM(firestore, id, user.displayName);\n      toast({ title: 'Berhasil', description: 'Safety Briefing berhasil ditandatangani.' });\n    } catch (error) {\n      toast({ variant: 'destructive', title: 'Gagal menandatangani' });\n    } finally {\n      setIsSigning(prev => ({ ...prev, [id]: false }));\n    }\n  };\n\n  const handleSign = async (id: string) => {"
);

// Append the Safety Briefing card after the Logbook Security Card
const safetyCard = `
      <Card>
        <CardHeader>
          <CardTitle>Daftar Laporan Safety Briefing</CardTitle>
          <CardDescription>Pilih dokumen Safety Briefing untuk ditandatangani.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Topik</TableHead>
                  <TableHead>Pengawas</TableHead>
                  <TableHead>Status AFTM</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingBriefings ? (
                   <TableRow><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                ) : briefings && briefings.length > 0 ? (
                  briefings.map(b => {
                    const isSignedAFTM = b.isSignedByAFTM;
                    const ts = b.timestamp as any;
                    const dateObj = ts?.toDate ? ts.toDate() : new Date(ts);
                    const dateFormatted = format(dateObj, 'EEEE, dd MMM yyyy', { locale: idLocale });
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{dateFormatted}</TableCell>
                        <TableCell>{b.topic}</TableCell>
                        <TableCell>
                          {b.isSignedByPengawas ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Ditandatangani
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <Clock className="w-3 h-3 mr-1" /> Menunggu Pengawas
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isSignedAFTM ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> Ditandatangani
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Belum
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            variant={isSignedAFTM ? "outline" : "default"}
                            className={isSignedAFTM ? "text-green-600 border-green-200" : ""}
                            disabled={isSignedAFTM || isSigning[b.id!]}
                            onClick={() => handleSignSafety(b.id!)}
                          >
                            {isSigning[b.id!] ? <Loader2 className="h-4 w-4 animate-spin" /> : (isSignedAFTM ? 'Selesai' : 'Tanda Tangani')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Tidak ada Safety Briefing.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
`;

code = code.replace("        </CardContent>\n      </Card>\n    </div>\n  );\n}", "        </CardContent>\n      </Card>\n" + safetyCard + "    </div>\n  );\n}");

fs.writeFileSync(path, code);
