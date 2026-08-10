import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Mariners FC - Website Resmi Klub Sepak Bola Profesional',
  description: 'Website resmi klub sepak bola Mariners FC. Informasi jadwal pertandingan, hasil laga, skuad pemain, statistik tim, dan berita klub terbaru.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-[#090d16] text-slate-100 min-h-screen flex flex-col antialiased selection:bg-amber-500 selection:text-slate-950">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
