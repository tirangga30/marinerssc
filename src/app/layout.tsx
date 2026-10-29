import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Oswald } from 'next/font/google';
import './globals.css';
import PublicShell from '@/components/PublicShell';
import { prisma } from '@/lib/db';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
});

const oswald = Oswald({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-oswald',
  display: 'swap',
  fallback: ['ui-monospace', 'monospace'],
});

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  let teamName = 'Mariners SC';
  let teamLogo = '/marinerssc.webp';

  try {
    const setting = await (prisma as any).systemSetting.findUnique({
      where: { id: 'default' },
    });
    if (setting) {
      if (setting.teamName) teamName = setting.teamName;
      if (setting.teamLogo) teamLogo = setting.teamLogo;
    }
  } catch (e) {
    // fallback
  }

  return {
    title: `${teamName} - Website Resmi Klub Sepak Bola`,
    description: `Website resmi klub sepak bola ${teamName}. Informasi jadwal pertandingan, hasil laga, skuad pemain, statistik tim, dan berita klub terbaru.`,
    icons: {
      icon: teamLogo,
      shortcut: teamLogo,
      apple: teamLogo,
    },
    verification: {
      google: 'vRkFi6sss2BFLqgmFsbyxGQuT3p4arjTZ631pixiFFQ',
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let initialSettings: any = undefined;
  try {
    const setting = await (prisma as any).systemSetting.findUnique({
      where: { id: 'default' },
    });
    if (setting) {
      initialSettings = {
        teamName: setting.teamName,
        teamLogo: setting.teamLogo,
        loginWallpaper: setting.loginWallpaper,
        adminWallpaper: setting.adminWallpaper,
        isCommunityEnabled: setting.isCommunityEnabled !== false,
      };
    }
  } catch (e) {
    // fallback if db connection fails during build
  }

  return (
    <html lang="id" className={`${jakarta.variable} ${oswald.variable}`}>
      <head>
        <meta name="google-site-verification" content="vRkFi6sss2BFLqgmFsbyxGQuT3p4arjTZ631pixiFFQ" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col antialiased selection:bg-blue-600 selection:text-white">
        <PublicShell initialSettings={initialSettings}>{children}</PublicShell>
      </body>
    </html>
  );
}
