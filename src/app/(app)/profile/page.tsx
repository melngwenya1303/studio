
'use client';

import { useApp } from '@/contexts/AppContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Icon from '@/components/shared/icon';

export default function ProfileRedirectPage() {
  const { user } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace(`/profile/${user.uid}`);
    } else {
      router.replace('/login');
    }
  }, [user, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Icon name="UserCircle" className="h-12 w-12 animate-pulse text-primary" />
        <p className="text-muted-foreground">Loading Your Profile...</p>
      </div>
    </div>
  );
}
