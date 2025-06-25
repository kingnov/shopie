import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Delete all existing users
  await prisma.user.deleteMany();

  // Create new admin user
  const hashedPassword = await bcrypt.hash('novikmuliro5@gmail.com', 10);

  await prisma.user.create({
    data: {
      email: 'novikmuliro5@gmail.com',
      password: hashedPassword,
      role: 'ADMIN', // Make sure your schema has this field
    },
  });

  console.log('Seed complete: Admin user created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
