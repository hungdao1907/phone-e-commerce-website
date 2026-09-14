import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const username = 'superadmin';
  const password = '123456';
  
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { username }
  });

  if (existingUser) {
    console.log(`User '${username}' already exists. Skipping...`);
    return;
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      role: 'superadmin'
    }
  });

  console.log(`User created: ${user.username} (ID: ${user.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
