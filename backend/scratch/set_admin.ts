import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'luongnguyen1088@gmail.com';
  
  const user = await prisma.user.update({
    where: { email },
    data: { isSystemAdmin: true }
  });

  console.log(`✅ Success: User ${user.email} is now a System Admin.`);
}

main()
  .catch((e) => {
    console.error('❌ Error setting admin:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
