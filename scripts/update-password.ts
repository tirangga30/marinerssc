import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const newPassword = 'ug45yuTDht6NT67';
  const hashed = await bcrypt.hash(newPassword, 12);

  const updated = await prisma.user.updateMany({
    where: { email: 'admin@marinersfc.com' },
    data: { password: hashed },
  });

  if (updated.count > 0) {
    console.log('✅ Password admin berhasil diupdate.');
  } else {
    console.log('⚠️  User admin@marinersfc.com tidak ditemukan di database.');
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
