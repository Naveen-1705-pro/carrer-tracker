import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@resumeiq.app';
  const userEmail = 'demo@resumeiq.app';
  const password = await bcrypt.hash('ResumeIQ2024!', 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: Role.ADMIN },
    create: {
      email: adminEmail,
      password,
      name: 'Admin',
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: userEmail },
    update: {},
    create: {
      email: userEmail,
      password,
      name: 'Demo User',
      role: Role.USER,
    },
  });

  console.log('Seed complete:');
  console.log(`  Admin: ${adminEmail} / ResumeIQ2024!`);
  console.log(`  Demo:  ${userEmail} / ResumeIQ2024!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
