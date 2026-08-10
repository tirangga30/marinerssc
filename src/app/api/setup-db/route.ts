import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    // 1. Ensure Admin User exists
    const hashedPassword = await bcrypt.hash('password123', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@marinersfc.com' },
      update: { password: hashedPassword, isAdmin: true },
      create: {
        name: 'Mariners FC Admin',
        email: 'admin@marinersfc.com',
        password: hashedPassword,
        isAdmin: true,
      },
    });

    // 2. Seed Players if empty
    const playerCount = await prisma.player.count();
    if (playerCount === 0) {
      const playersData = [
        {
          name: 'Maarten Paes',
          slug: 'maarten-paes',
          number: 1,
          position: 'GK',
          birthDate: new Date('1998-05-14'),
          nationality: 'Indonesia',
          heightCm: 191,
          weightKg: 84,
          photoUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=600&auto=format&fit=crop&q=80',
          bio: 'Kiper tembok kokoh Mariners FC dengan refleks kelas dunia dan distribusi bola akurat.',
          isCaptain: false,
          status: 'Active',
          goals: 0,
          assists: 0,
          appearances: 12,
          yellowCards: 1,
          redCards: 0,
        },
        {
          name: 'Jay Idzes',
          slug: 'jay-idzes',
          number: 4,
          position: 'DF',
          birthDate: new Date('2000-06-02'),
          nationality: 'Indonesia',
          heightCm: 190,
          weightKg: 82,
          photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
          bio: 'Bek tengah berkarisma tinggi yang memimpin benteng pertahanan Mariners FC dengan kedisiplinan luar biasa.',
          isCaptain: true,
          status: 'Active',
          goals: 2,
          assists: 1,
          appearances: 12,
          yellowCards: 2,
          redCards: 0,
        },
        {
          name: 'Rizky Ridho',
          slug: 'rizky-ridho',
          number: 5,
          position: 'DF',
          birthDate: new Date('2001-11-21'),
          nationality: 'Indonesia',
          heightCm: 183,
          weightKg: 75,
          photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
          bio: 'Defender serba bisa yang tak kenal kompromi dalam duel udara dan pemotongan umpan berbahaya.',
          isCaptain: false,
          status: 'Active',
          goals: 1,
          assists: 0,
          appearances: 11,
          yellowCards: 3,
          redCards: 0,
        },
        {
          name: 'Pratama Arhan',
          slug: 'pratama-arhan',
          number: 12,
          position: 'DF',
          birthDate: new Date('2001-12-21'),
          nationality: 'Indonesia',
          heightCm: 172,
          weightKg: 64,
          photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop&q=80',
          bio: 'Bek kiri lincah terkenal dengan lemparan dalam jarak jauh spektakuler yang menjadi senjata mematikan.',
          isCaptain: false,
          status: 'Active',
          goals: 1,
          assists: 4,
          appearances: 10,
          yellowCards: 1,
          redCards: 0,
        },
        {
          name: 'Sandy Walsh',
          slug: 'sandy-walsh',
          number: 6,
          position: 'DF',
          birthDate: new Date('1995-03-14'),
          nationality: 'Indonesia',
          heightCm: 185,
          weightKg: 78,
          photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&auto=format&fit=crop&q=80',
          bio: 'Bek kanan berpengalaman Eropa yang disiplin membantu bertahan dan overlap matang ke lini depan.',
          isCaptain: false,
          status: 'Active',
          goals: 1,
          assists: 2,
          appearances: 10,
          yellowCards: 2,
          redCards: 0,
        },
        {
          name: 'Thom Haye',
          slug: 'thom-haye',
          number: 19,
          position: 'MF',
          birthDate: new Date('1995-02-09'),
          nationality: 'Indonesia',
          heightCm: 187,
          weightKg: 80,
          photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
          bio: 'Jenderal lapangan tengah (The Professor) penyaji umpan manja dan visi permainan kelas atas.',
          isCaptain: false,
          status: 'Active',
          goals: 3,
          assists: 6,
          appearances: 12,
          yellowCards: 2,
          redCards: 0,
        },
        {
          name: 'Marselino Ferdinan',
          slug: 'marselino-ferdinan',
          number: 7,
          position: 'MF',
          birthDate: new Date('2004-09-09'),
          nationality: 'Indonesia',
          heightCm: 176,
          weightKg: 67,
          photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80',
          bio: 'Wonderkid dengan kelincahan dribel eksotik dan tendangan spekulasi berbuah gol-gol krusial.',
          isCaptain: false,
          status: 'Active',
          goals: 5,
          assists: 4,
          appearances: 12,
          yellowCards: 1,
          redCards: 0,
        },
        {
          name: 'Rafael Struick',
          slug: 'rafael-struick',
          number: 9,
          position: 'FW',
          birthDate: new Date('2003-03-27'),
          nationality: 'Indonesia',
          heightCm: 187,
          weightKg: 76,
          photoUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=600&auto=format&fit=crop&q=80',
          bio: 'Penyerang tajam dengan pergerakan off-the-ball menawan serta penyelesaian akhir dingin.',
          isCaptain: false,
          status: 'Active',
          goals: 6,
          assists: 2,
          appearances: 12,
          yellowCards: 2,
          redCards: 0,
        },
        {
          name: 'Ramadhan Sananta',
          slug: 'ramadhan-sananta',
          number: 11,
          position: 'FW',
          birthDate: new Date('2002-11-27'),
          nationality: 'Indonesia',
          heightCm: 182,
          weightKg: 77,
          photoUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&auto=format&fit=crop&q=80',
          bio: 'Striker haus gol bertipikal target man dengan fisik bertenaga dan tembakan mematikan.',
          isCaptain: false,
          status: 'Active',
          goals: 7,
          assists: 1,
          appearances: 11,
          yellowCards: 1,
          redCards: 0,
        },
        {
          name: 'Ragnar Oratmangoen',
          slug: 'ragnar-oratmangoen',
          number: 10,
          position: 'FW',
          birthDate: new Date('1998-01-21'),
          nationality: 'Indonesia',
          heightCm: 180,
          weightKg: 74,
          photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
          bio: 'Winger kreatif Wak Haji dengan kontrol bola magis dan naluri mencetak gol dari sudut sulit.',
          isCaptain: false,
          status: 'Active',
          goals: 5,
          assists: 5,
          appearances: 12,
          yellowCards: 0,
          redCards: 0,
        },
      ];

      for (const p of playersData) {
        await prisma.player.upsert({
          where: { slug: p.slug },
          update: p,
          create: p,
        });
      }
    }

    // 3. Seed Articles if empty
    const articleCount = await prisma.article.count();
    if (articleCount === 0) {
      await prisma.article.create({
        data: {
          title: 'Mariners FC Tundukkan Persija 3-1 di Stadion Samudra',
          slug: 'mariners-fc-tundukkan-persija-3-1',
          category: 'Laporan Pertandingan',
          thumbnail: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=80',
          content: 'Pertandingan sengit BRI Liga 1 di Stadion Gelora Samudra berakhir dengan kemenangan Mariners FC 3-1 atas Persija Jakarta.',
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Database Supabase berhasil disinkronisasi & di-seed!',
      admin: admin.email,
    });
  } catch (error: any) {
    console.error('Setup DB error:', error);
    return NextResponse.json(
      { error: error?.message || 'Gagal menyetel database' },
      { status: 500 }
    );
  }
}
