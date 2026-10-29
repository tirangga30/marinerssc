import React from 'react';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';

export default async function CommunityLayout({ children }: { children: React.ReactNode }) {
  try {
    const setting = await (prisma as any).systemSetting.findUnique({
      where: { id: 'default' },
    });
    if (setting && setting.isCommunityEnabled === false) {
      redirect('/');
    }
  } catch (e: any) {
    if (e?.digest?.startsWith('NEXT_REDIRECT')) throw e;
  }

  return <>{children}</>;
}

