const { execSync } = require('child_process');
const path = require('path');
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const targetUrl = process.argv[2];

if (!targetUrl || !targetUrl.startsWith('postgresql://')) {
  console.log('\n❌ Silakan sertakan connection string Neon Anda!');
  console.log('Contoh penggunaan:');
  console.log('  npm run db:new-team -- "postgresql://neondb_owner:password@ep-xyz.aws.neon.tech/neondb?sslmode=require"\n');
  process.exit(1);
}

const rootDir = path.resolve(__dirname, '..');
const schemaNeon = path.join(rootDir, 'prisma', 'schema.neon.prisma');

async function main() {
  console.log('===============================================================');
  console.log('🚀 Menyiapkan Database Neon Baru untuk Tim...');
  console.log('===============================================================');

  // 1. Push schema ke database Neon baru
  console.log('\n[1/2] Membuat semua tabel di database baru...');
  execSync(`npx prisma db push --schema="${schemaNeon}" --skip-generate`, {
    cwd: rootDir,
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: targetUrl },
  });

  // 2. Isi data dasar awal (Admin, Setting, Musim 2026, Poster)
  console.log('\n[2/2] Mengisi data dasar awal (Admin, Musim 2026, PIN 1234)...');
  const client = new Client({
    connectionString: targetUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  // Admin user
  const userRes = await client.query('SELECT count(*) FROM "User"');
  if (parseInt(userRes.rows[0].count, 10) === 0) {
    const hashedPassword = await bcrypt.hash('ug45yuTDht6NT67', 12);
    const userId = 'admin-' + Date.now();
    await client.query(
      `INSERT INTO "User" ("id", "name", "email", "password", "isAdmin", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [userId, 'Admin Klub', 'admin@marinersfc.com', hashedPassword, true]
    );
    console.log('✅ Akun Admin berhasil dibuat: admin@marinersfc.com / ug45yuTDht6NT67');
  }

  // SystemSetting
  const settingRes = await client.query('SELECT count(*) FROM "SystemSetting" WHERE id = $1', ['default']);
  if (parseInt(settingRes.rows[0].count, 10) === 0) {
    await client.query(
      `INSERT INTO "SystemSetting" ("id", "teamName", "teamLogo", "loginWallpaper", "adminWallpaper", "posterInterval", "securityPin", "isCommunityEnabled", "playerCardBg", "showHeroOverlay", "heroTagline", "heroSubtitle", "heroCtaText", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())`,
      ['default', 'Klub Sepak Bola Baru', '/marinerssc.webp', '/newposter.webp', '/stadium_hero2.png', 7, '1234', true, '/bgprofil2.jpeg', false, 'SOCCER CLUB', 'Lebih dari sekadar sepak bola.', 'LIHAT TIM']
    );
    console.log('✅ Pengaturan Identitas Tim default dibuat (PIN: 1234)');
  }

  // Season 2026
  const seasonRes = await client.query('SELECT count(*) FROM "Season" WHERE name = $1', ['2026']);
  if (parseInt(seasonRes.rows[0].count, 10) === 0) {
    const seasonId = 'season-2026-' + Date.now();
    await client.query(
      `INSERT INTO "Season" ("id", "name", "year", "isCurrent", "featuredPlayerIds", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [seasonId, '2026', 2026, true, []]
    );
    console.log('✅ Musim 2026 aktif dibuat');
  }

  // HeroPoster
  const posterRes = await client.query('SELECT count(*) FROM "HeroPoster"');
  if (parseInt(posterRes.rows[0].count, 10) === 0) {
    const posterId = 'poster-' + Date.now();
    await client.query(
      `INSERT INTO "HeroPoster" ("id", "imageUrl", "title", "subtitle", "order", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [posterId, '/NYCOMP.webp', 'OFFICIAL CLUB', 'Official Club Community & Squad', 0, true]
    );
    console.log('✅ Poster slide beranda default dibuat');
  }

  // Competition
  const compRes = await client.query('SELECT count(*) FROM "Competition"');
  if (parseInt(compRes.rows[0].count, 10) === 0) {
    const compId = 'comp-' + Date.now();
    await client.query(
      `INSERT INTO "Competition" ("id", "name", "slug", "season", "type", "isPrimary", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [compId, 'Friendly Match', 'friendly-match', '2026', 'Friendly', true]
    );
    console.log('✅ Kompetisi default dibuat');
  }

  await client.end();
  console.log('\n🎉 SUKSES! Database tim baru sudah siap 100%.');
  console.log('Langkah selanjutnya: Buat project baru di Vercel dengan URL database ini!');
}

main().catch(err => {
  console.error('❌ Gagal menyiapkan database tim baru:', err);
  process.exit(1);
});

