import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Oswald } from 'next/font/google';
import './globals.css';
import PublicShell from '@/components/PublicShell';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-oswald',
  display: 'swap',
});

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
    <html lang="id" className={`${jakarta.variable} ${oswald.variable}`}>
      <body className="bg-[#060b14] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-blue-600 selection:text-white">
        <PublicShell>{children}</PublicShell>
      </body>
    </html>
  );
}
