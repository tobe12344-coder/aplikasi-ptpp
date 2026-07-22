'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';

const profileSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  jobTitle: z.string().min(2, 'Pekerjaan/Jabatan minimal 2 karakter'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function CompleteProfileClient() {
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      jobTitle: '',
    },
  });

  const handleSubmit = async (values: ProfileFormValues) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        toast({ title: 'Gagal', description: 'Gagal menyimpan data, akun tidak ditemukan.', variant: 'destructive'});
        router.push('/login');
        return;
    }

    setLoading(true);
    try {
      const userRef = doc(firestore, 'users', currentUser.uid);
      const userData = {
        uid: currentUser.uid,
        email: currentUser.email,
        role: 'employee',       // Hardcoded — user TIDAK boleh menentukan role sendiri
        status: 'pending',      // Harus menunggu approval admin
        displayName: values.name,
        jobTitle: values.jobTitle,
        photoURL: currentUser.photoURL || '',
        createdAt: new Date().toISOString(),
      };

      await setDoc(userRef, userData);

      toast({
        title: 'Berhasil!',
        description: 'Profil Anda berhasil disimpan. Menunggu persetujuan admin.',
      });
      router.push('/pending-approval');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      toast({
        variant: 'destructive',
        title: 'Gagal Menyimpan',
        description: 'Terjadi kesalahan saat menyimpan profil Anda. Silakan coba lagi.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Tampilkan loading jika user data masih dimuat
  if (userLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>Lengkapi Profil Anda</CardTitle>
        <CardDescription>Sebelum masuk, mohon lengkapi data diri Anda</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nama Lengkap</FormLabel>
                    <FormControl>
                        <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Pekerjaan / Jabatan</FormLabel>
                    <FormControl>
                        <Input placeholder="Contoh: Teknisi / Foreman" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
                >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan & Lanjutkan
                </Button>
            </form>
        </Form>
      </CardContent>
    </Card>
  );
}
