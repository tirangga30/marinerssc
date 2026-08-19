import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { cleanupUnusedUploads } from '@/lib/cleanup';

export async function POST() {
  try {
    const session = await getAdminSession();
    if (!session && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Tidak sah' }, { status: 401 });
    }

    const result = await cleanupUnusedUploads();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Gagal membersihkan file sampah' },
      { status: 500 }
    );
  }
}
