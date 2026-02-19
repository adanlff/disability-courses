import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Hash password for admin
  const hashedPassword = await bcrypt.hash('@Admin123', 10);

  // Create or update admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {
      password: hashedPassword,
      full_name: 'Administrator',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      email_verified: true,
      email_verified_at: new Date(),
    },
    create: {
      email: 'admin@gmail.com',
      password: hashedPassword,
      full_name: 'Administrator',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      email_verified: true,
      email_verified_at: new Date(),
    },
  });

  console.log('✅ Admin user created/updated:');
  console.log(`   Email: admin@gmail.com`);
  console.log(`   Password: @Admin123`);
  console.log(`   ID: ${admin.id}`);

  console.log('🌱 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
