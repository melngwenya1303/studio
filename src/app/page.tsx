
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/contexts/AppContext';
import Icon from '@/components/shared/icon';

export default function Home() {
  const router = useRouter();
  const { user } = useApp();

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Icon name="Wand2" className="h-12 w-12 animate-pulse text-primary" />
        <p className="text-muted-foreground">Loading Your Creative Space...</p>
      </div>
    </div>
  );
}
