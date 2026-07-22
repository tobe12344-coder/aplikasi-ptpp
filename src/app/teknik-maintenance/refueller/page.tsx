
'use client';

import Link from 'next/link';
import BackButton from '@/components/common/BackButton';
import Header from '@/components/common/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, ArrowRight } from 'lucide-react';

const refuellerUnits = [
  { id: 'DEO-10', name: 'DEO 10', capacity: '16 KL', color: 'bg-blue-100', iconColor: 'text-blue-600' },
  { id: 'DEO-11', name: 'DEO 11', capacity: '16 KL', color: 'bg-blue-100', iconColor: 'text-blue-600' },
  { id: 'DEO-12', name: 'DEO 12', capacity: '16 KL', color: 'bg-blue-100', iconColor: 'text-blue-600' },
  { id: 'DEO-13', name: 'DEO 13', capacity: '12 KL', color: 'bg-indigo-100', iconColor: 'text-indigo-600' },
];

export default function RefuellerMenuPage() {
  return (
    <>
      <Header />
      <div className="p-4 md:p-8">
        <BackButton href="/teknik-maintenance" />
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Monitoring Mobil Refueller</h1>
            <p className="text-muted-foreground mt-2">Pilih unit refueller untuk melihat status dan detail operasional.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {refuellerUnits.map((unit) => (
              <Link key={unit.id} href={`/teknik-maintenance/refueller/${unit.id}`} className="group">
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/30">
                  <CardHeader className="flex flex-col items-center text-center p-6">
                    <div className={`p-4 rounded-full ${unit.color} ${unit.iconColor} mb-4 group-hover:scale-110 transition-transform`}>
                      <Truck className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-2xl font-black">{unit.name}</CardTitle>
                    <CardDescription className="font-bold text-primary">{unit.capacity}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center pb-6">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                      Buka Detail <ArrowRight className="h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
