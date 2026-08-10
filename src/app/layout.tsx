import type { Metadata } from 'next';
import './globals.css';
import PublicShell from '@/components/PublicShell';

export const metadata: Metadata = {
  title: 'Mariners SC - Website Resmi Klub Sepak Bola',
  description: 'Website resmi klub sepak bola Mariners SC. Informasi jadwal pertandingan, hasil laga, skuad pemain, statistik tim, dan berita klub terbaru.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-[#060b14] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-blue-600 selection:text-white">
        <PublicShell>{children}</PublicShell>
      </body>
    </html>
  );
}
