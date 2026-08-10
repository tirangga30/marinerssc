import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning database...');
  await prisma.matchEvent.deleteMany();
  await prisma.matchLineup.deleteMany();
  await prisma.footballMatch.deleteMany();
  await prisma.player.deleteMany();
  await prisma.article.deleteMany();
  await prisma.user.deleteMany();
  await prisma.competition.deleteMany();

  console.log('Creating Admin...');
  const hashedPassword = await bcrypt.hash('ug45yuTDht6NT67', 12);
  await prisma.user.create({
    data: {
      name: 'Mariners SC Admin',
      email: 'admin@marinersfc.com',
      password: hashedPassword,
      isAdmin: true,
    },
  });

  console.log('Creating Competitions...');
  await prisma.competition.createMany({
    data: [
      { name: 'BRI Liga 1 Indonesia', slug: 'bri-liga-1', season: '2025/2026', type: 'Liga Utama', isPrimary: true },
      { name: 'Piala Indonesia 2026', slug: 'piala-indonesia', season: '2025/2026', type: 'Turnamen Domestik', isPrimary: false },
    ],
  });

  console.log('Creating 16+ Players with default /playertemplate.jpeg...');
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
      photoUrl: '/playertemplate.jpeg',
      bio: 'Kiper tembok kokoh Mariners SC dengan refleks kelas dunia dan distribusi bola akurat.',
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
      photoUrl: '/playertemplate.jpeg',
      bio: 'Bek tengah berkarisma tinggi yang memimpin benteng pertahanan Mariners SC dengan kedisiplinan luar biasa.',
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
      photoUrl: '/playertemplate.jpeg',
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
      photoUrl: '/playertemplate.jpeg',
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
      photoUrl: '/playertemplate.jpeg',
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
      photoUrl: '/playertemplate.jpeg',
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
      photoUrl: '/playertemplate.jpeg',
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
      name: 'Ivar Jenner',
      slug: 'ivar-jenner',
      number: 18,
      position: 'MF',
      birthDate: new Date('2004-01-10'),
      nationality: 'Indonesia',
      heightCm: 188,
      weightKg: 76,
      photoUrl: '/playertemplate.jpeg',
      bio: 'Gelandang jangkar elegan pembaca serangan lawan dan pengatur ritme transisi tim.',
      isCaptain: false,
      status: 'Active',
      goals: 1,
      assists: 2,
      appearances: 11,
      yellowCards: 4,
      redCards: 0,
    },
    {
      name: 'Justin Hubner',
      slug: 'justin-hubner',
      number: 23,
      position: 'DF',
      birthDate: new Date('2003-09-14'),
      nationality: 'Indonesia',
      heightCm: 187,
      weightKg: 81,
      photoUrl: '/playertemplate.jpeg',
      bio: 'Bek agresif julukan "Preman" yang lugas memutus ancaman bomber lawan tanpa kompromi.',
      isCaptain: false,
      status: 'Active',
      goals: 1,
      assists: 0,
      appearances: 9,
      yellowCards: 5,
      redCards: 0,
    },
    {
      name: 'Nathan Tjoe-A-On',
      slug: 'nathan-tjoe-a-on',
      number: 22,
      position: 'MF',
      birthDate: new Date('2001-12-22'),
      nationality: 'Indonesia',
      heightCm: 182,
      weightKg: 75,
      photoUrl: '/playertemplate.jpeg',
      bio: 'Pemain serba bisa yang mampu bertransformasi sebagai gelandang pekerja keras maupun wing back.',
      isCaptain: false,
      status: 'Active',
      goals: 0,
      assists: 3,
      appearances: 10,
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
      photoUrl: '/playertemplate.jpeg',
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
      photoUrl: '/playertemplate.jpeg',
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
      photoUrl: '/playertemplate.jpeg',
      bio: 'Winger kreatif "Wak Haji" dengan kontrol bola magis dan naluri mencetak gol dari sudut sulit.',
      isCaptain: false,
      status: 'Active',
      goals: 5,
      assists: 5,
      appearances: 12,
      yellowCards: 0,
      redCards: 0,
    },
    {
      name: 'Asnawi Mangkualam',
      slug: 'asnawi-mangkualam',
      number: 14,
      position: 'DF',
      birthDate: new Date('1999-10-04'),
      nationality: 'Indonesia',
      heightCm: 174,
      weightKg: 72,
      photoUrl: '/playertemplate.jpeg',
      bio: 'Pemain berenergi tanpa habis di sisi kanan pertahanan yang pantang menyerah.',
      isCaptain: false,
      status: 'Active',
      goals: 1,
      assists: 2,
      appearances: 8,
      yellowCards: 3,
      redCards: 0,
    },
    {
      name: 'Witan Sulaeman',
      slug: 'witan-sulaeman',
      number: 8,
      position: 'FW',
      birthDate: new Date('2001-10-08'),
      nationality: 'Indonesia',
      heightCm: 170,
      weightKg: 63,
      photoUrl: '/playertemplate.jpeg',
      bio: 'Winger lincah dengan visi umpan terobosan cerdik yang sering merepotkan bek lawan.',
      isCaptain: false,
      status: 'Active',
      goals: 3,
      assists: 3,
      appearances: 9,
      yellowCards: 0,
      redCards: 0,
    },
    {
      name: 'Ernando Ari',
      slug: 'ernando-ari',
      number: 21,
      position: 'GK',
      birthDate: new Date('2002-02-27'),
      nationality: 'Indonesia',
      heightCm: 178,
      weightKg: 73,
      photoUrl: '/playertemplate.jpeg',
      bio: 'Kiper muda penuh percaya diri spesialis penggagalkan penalti dalam situasi kritis.',
      isCaptain: false,
      status: 'Active',
      goals: 0,
      assists: 0,
      appearances: 4,
      yellowCards: 0,
      redCards: 0,
    },
  ];

  const createdPlayers: Record<string, any> = {};
  for (const p of playersData) {
    const player = await prisma.player.create({ data: p });
    createdPlayers[p.slug] = player;
  }

  console.log('Creating Matches & Lineups & Events...');
  // Match 1: Finished - 3-1 vs Persija
  const match1 = await prisma.footballMatch.create({
    data: {
      opponentName: 'Persija Jakarta',
      opponentLogo: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=150&auto=format&fit=crop&q=80',
      matchDate: new Date('2026-02-01T19:00:00Z'),
      competition: 'BRI Liga 1',
      venue: 'Stadion Gelora Samudra, Jakarta',
      isHome: true,
      status: 'finished',
      homeScore: 3,
      awayScore: 1,
      formation: '4-3-3',
      summary: 'Kemenangan spektakuler Mariners SC dengan dominasi total di lini tengah dan 3 gol menawan.',
    },
  });

  const m1Starters = [
    { player: createdPlayers['maarten-paes'], pitchPosition: 'GK', positionName: 'Goalkeeper' },
    { player: createdPlayers['sandy-walsh'], pitchPosition: 'RB', positionName: 'Right Back' },
    { player: createdPlayers['jay-idzes'], pitchPosition: 'CB1', positionName: 'Center Back (L)' },
    { player: createdPlayers['rizky-ridho'], pitchPosition: 'CB2', positionName: 'Center Back (R)' },
    { player: createdPlayers['pratama-arhan'], pitchPosition: 'LB', positionName: 'Left Back' },
    { player: createdPlayers['ivar-jenner'], pitchPosition: 'CM1', positionName: 'Defensive Midfield' },
    { player: createdPlayers['thom-haye'], pitchPosition: 'CM2', positionName: 'Central Midfield' },
    { player: createdPlayers['marselino-ferdinan'], pitchPosition: 'CAM', positionName: 'Attacking Midfield' },
    { player: createdPlayers['ragnar-oratmangoen'], pitchPosition: 'RW', positionName: 'Right Winger' },
    { player: createdPlayers['ramadhan-sananta'], pitchPosition: 'ST', positionName: 'Center Forward' },
    { player: createdPlayers['rafael-struick'], pitchPosition: 'LW', positionName: 'Left Winger' },
  ];

  for (const s of m1Starters) {
    await prisma.matchLineup.create({
      data: {
        matchId: match1.id,
        playerId: s.player.id,
        isStarter: true,
        pitchPosition: s.pitchPosition,
        positionName: s.positionName,
      },
    });
  }

  // Events Match 1
  await prisma.matchEvent.createMany({
    data: [
      { matchId: match1.id, playerId: createdPlayers['ramadhan-sananta'].id, assistPlayerId: createdPlayers['thom-haye'].id, type: 'goal', minute: 14, description: 'Sundulan tajam memanfaatkan umpan pojok Thom Haye' },
      { matchId: match1.id, playerId: createdPlayers['marselino-ferdinan'].id, assistPlayerId: createdPlayers['ragnar-oratmangoen'].id, type: 'goal', minute: 38, description: 'Tendangan roket dari luar kotak penalti' },
      { matchId: match1.id, playerId: createdPlayers['justin-hubner'].id, type: 'yellow_card', minute: 55, description: 'Pelanggaran taktikal memutus serangan balik lawan' },
      { matchId: match1.id, playerId: createdPlayers['rafael-struick'].id, assistPlayerId: createdPlayers['marselino-ferdinan'].id, type: 'goal', minute: 72, description: 'Penyelesaian dingin dalam situasi 1v1 dengan kiper' },
    ],
  });

  // Match 2: Finished - 4-2 vs Persebaya
  const match2 = await prisma.footballMatch.create({
    data: {
      opponentName: 'Persebaya Surabaya',
      opponentLogo: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=150&auto=format&fit=crop&q=80',
      matchDate: new Date('2026-02-08T15:30:00Z'),
      competition: 'BRI Liga 1',
      venue: 'Stadion Gelora Bung Tomo, Surabaya',
      isHome: false,
      status: 'finished',
      homeScore: 2,
      awayScore: 4,
      formation: '4-3-3',
      summary: 'Hujan gol sengit di Surabaya di mana serangan cepat Mariners SC membawa pulang 3 poin penuh.',
    },
  });

  for (const s of m1Starters) {
    await prisma.matchLineup.create({
      data: {
        matchId: match2.id,
        playerId: s.player.id,
        isStarter: true,
        pitchPosition: s.pitchPosition,
        positionName: s.positionName,
      },
    });
  }

  // Match 3: Finished - 2-0 vs Bali United
  const match3 = await prisma.footballMatch.create({
    data: {
      opponentName: 'Bali United',
      opponentLogo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=150&auto=format&fit=crop&q=80',
      matchDate: new Date('2026-02-15T19:00:00Z'),
      competition: 'BRI Liga 1',
      venue: 'Stadion Gelora Samudra, Jakarta',
      isHome: true,
      status: 'finished',
      homeScore: 2,
      awayScore: 0,
      formation: '4-3-3',
      summary: 'Performa taktis disiplin tinggi menghasilkan clean sheet dan kemenangan meyakinkan.',
    },
  });

  for (const s of m1Starters) {
    await prisma.matchLineup.create({
      data: {
        matchId: match3.id,
        playerId: s.player.id,
        isStarter: true,
        pitchPosition: s.pitchPosition,
        positionName: s.positionName,
      },
    });
  }

  // Match 4: Scheduled - Upcoming vs PSM Makassar
  const match4 = await prisma.footballMatch.create({
    data: {
      opponentName: 'PSM Makassar',
      opponentLogo: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=150&auto=format&fit=crop&q=80',
      matchDate: new Date('2026-02-22T19:00:00Z'),
      competition: 'BRI Liga 1',
      venue: 'Stadion Gelora Samudra, Jakarta',
      isHome: true,
      status: 'scheduled',
      homeScore: null,
      awayScore: null,
      formation: '4-3-3',
      summary: 'Laga krusial perebutan puncak klasemen Liga 1 pekan ke-24.',
    },
  });

  for (const s of m1Starters) {
    await prisma.matchLineup.create({
      data: {
        matchId: match4.id,
        playerId: s.player.id,
        isStarter: true,
        pitchPosition: s.pitchPosition,
        positionName: s.positionName,
      },
    });
  }

  console.log('Creating Articles...');
  await prisma.article.createMany({
    data: [
      {
        title: 'Mariners SC Tundukkan Persija 3-1 di Stadion Samudra',
        slug: 'mariners-sc-tundukkan-persija-3-1',
        category: 'Laporan Pertandingan',
        thumbnail: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=80',
        content: `
### Kemenangan Gemilang di Laga Derby

Pertandingan sengit BRI Liga 1 di Stadion Gelora Samudra berakhir dengan sorak-sorai ribuan pendukung **Mariners SC**. Tuan rumah berhasil menaklukkan Persija Jakarta dengan skor meyakinkan **3-1**.

Gol pembuka dicetak oleh striker **Ramadhan Sananta** pada menit ke-14 lewat sundulan terukur hasil sepakan pojok ciamik dari **Thom Haye**. Jelang akhir babak pertama, **Marselino Ferdinan** menggandakan keunggulan melalui tembakan spektakuler dari luar kotak penalti.

#### Jalannya Babak Kedua
Persija sempat memperkecil kedudukan di menit ke-52. Namun babak kedua seolah menjadi panggung pertunjukan pertahanan kokoh yang digalang oleh kapten **Jay Idzes** dan **Rizky Ridho**. Gol pengunci kemenangan akhirnya lahir di menit 72 via akselerasi **Rafael Struick**.

> *"Anak-anak bermain dengan hati dan taktik yang berjalan 100%. Fokus kita sekarang langsung tertuju pada laga berikutnya,"* ujar pelatih kepala pasca pertandingan.
        `,
        publishedAt: new Date('2026-02-02T10:00:00Z'),
      },
      {
        title: 'Kondisi Skuad Jelang Menghadapi Duel Panas vs PSM Makassar',
        slug: 'kondisi-skuad-jelang-duel-vs-psm',
        category: 'Kabar Tim',
        thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop&q=80',
        content: `
### Persiapan Matang Lini Depan & Belakang

Jelang laga panas pekan ke-24 melawan PSM Makassar, skuad **Mariners SC** menggelar latihan intensif di Kompleks Pelatihan Samudra, Jakarta.

Dokter tim mengonfirmasi bahwa seluruh pilar utama berada dalam kondisi prima tanpa kendala cedera berarti. Kiper utama **Maarten Paes** dan jenderal lapangan tengah **Thom Haye** siap diturunkan sejak menit pertama.
        `,
        publishedAt: new Date('2026-02-12T14:30:00Z'),
      },
    ],
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
