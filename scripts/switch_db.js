const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const target = process.argv[2];

if (!target || !['local', 'cloud'].includes(target)) {
  console.log('Usage: node scripts/switch_db.js [local|cloud]');
  process.exit(1);
}

const rootDir = path.resolve(__dirname, '..');
const schemaPrisma = path.join(rootDir, 'prisma', 'schema.prisma');
const schemaLocal = path.join(rootDir, 'prisma', 'schema.local.prisma');
const schemaNeon = path.join(rootDir, 'prisma', 'schema.neon.prisma');
const envFile = path.join(rootDir, '.env');
const envLocal = path.join(rootDir, '.env.local');

const NEON_URL = 'postgresql://neondb_owner:npg_vZBDN9hqdO5y@ep-fragrant-flower-ay1mya4a-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require';
const LOCAL_URL = 'file:./dev.db';

function setEnvDatabaseUrl(filePath, url) {
  let envContent = '';
  if (fs.existsSync(filePath)) {
    envContent = fs.readFileSync(filePath, 'utf8');
  }
  if (envContent.includes('DATABASE_URL=')) {
    envContent = envContent.replace(/DATABASE_URL=["'][^"']+["']/, `DATABASE_URL="${url}"`);
  } else {
    envContent = `DATABASE_URL="${url}"\n` + envContent;
  }
  fs.writeFileSync(filePath, envContent, 'utf8');
}

if (target === 'local') {
  console.log('--- Switching to LOCAL SQLite Database (Offline) ---');
  if (!fs.existsSync(schemaLocal)) {
    console.error('schema.local.prisma not found!');
    process.exit(1);
  }
  fs.copyFileSync(schemaLocal, schemaPrisma);
  console.log('Copied schema.local.prisma -> schema.prisma');

  setEnvDatabaseUrl(envFile, LOCAL_URL);
  setEnvDatabaseUrl(envLocal, LOCAL_URL);
  console.log('Updated .env and .env.local with DATABASE_URL="file:./dev.db"');

  console.log('Pushing schema to dev.db & generating Prisma Client...');
  execSync('npx prisma db push --skip-generate', { cwd: rootDir, stdio: 'inherit' });
  try {
    execSync('npx prisma generate', { cwd: rootDir, stdio: 'inherit' });
  } catch (genErr) {
    console.warn('Prisma generate notice (engine DLL already loaded):', genErr.message);
  }

  // Run seeding for missing models in dev.db
  console.log('Ensuring default settings, seasons, and posters in dev.db...');
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    async function seed() {
      await prisma.systemSetting.upsert({
        where: { id: 'default' },
        update: {},
        create: {
          id: 'default',
          teamName: 'TEAM',
          teamLogo: '/defaultteam.webp',
          clubType: 'SOCCER CLUB',
          playerDefaultPhoto: '/playertemplate.webp',
          loginWallpaper: '/NYCOMP.webp',
          adminWallpaper: '/stadium_hero2.png',
          posterInterval: 5,
          securityPin: '1234',
          isCommunityEnabled: true,
        },
      });

      const pCount = await prisma.heroPoster.count();
      if (pCount === 0) {
        await prisma.heroPoster.createMany({
          data: [
            { imageUrl: '/NYCOMP.webp', title: 'MARINERS SC', subtitle: 'Official Club Community & Squad', order: 0, isActive: true },
            { imageUrl: '/mainposter.webp', title: 'SEASON 2026', subtitle: 'Rise Together, Play Harder', order: 1, isActive: true },
          ],
        });
      }

      const allPlayers = await prisma.player.findMany({ select: { id: true, isFeatured: true } });
      const featuredIds = allPlayers.filter(p => p.isFeatured).map(p => p.id);
      let s2026 = await prisma.season.findUnique({ where: { name: '2026' } });
      if (!s2026) {
        s2026 = await prisma.season.create({
          data: {
            name: '2026',
            year: 2026,
            isCurrent: true,
            featuredPlayerIds: JSON.stringify(featuredIds),
            players: { connect: allPlayers.map(p => ({ id: p.id })) },
          },
        });
      } else {
        await prisma.season.update({
          where: { id: s2026.id },
          data: {
            players: { connect: allPlayers.map(p => ({ id: p.id })) },
            featuredPlayerIds: JSON.stringify(featuredIds),
          },
        });
      }
      await prisma.footballMatch.updateMany({
        where: { OR: [{ seasonName: '2026' }, { seasonId: null }] },
        data: { seasonId: s2026.id, seasonName: '2026' },
      });
      await prisma.$disconnect();
      console.log('Local SQLite dev.db is ready with full data!');
    }
    seed().catch(console.error);
  } catch (err) {
    console.warn('Post-migration seed note:', err.message);
  }
} else if (target === 'cloud') {
  console.log('--- Switching to NEON CLOUD PostgreSQL Database ---');
  if (!fs.existsSync(schemaNeon)) {
    console.error('schema.neon.prisma not found!');
    process.exit(1);
  }
  fs.copyFileSync(schemaNeon, schemaPrisma);
  console.log('Copied schema.neon.prisma -> schema.prisma');

  setEnvDatabaseUrl(envFile, NEON_URL);
  setEnvDatabaseUrl(envLocal, NEON_URL);
  console.log('Updated .env and .env.local with Neon PostgreSQL URL');

  console.log('Generating Prisma Client for PostgreSQL...');
  try {
    execSync('npx prisma generate', { cwd: rootDir, stdio: 'inherit' });
  } catch (genErr) {
    console.warn('Prisma generate notice (engine DLL already loaded):', genErr.message);
  }
  console.log('Switched back to Neon Cloud PostgreSQL successfully.');
}
