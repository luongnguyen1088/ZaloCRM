import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'Baobiclaro@gmail.com';
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    console.log(`User ${email} not found.`);
    return;
  }

  console.log(`Found user: ${user.fullName} (${user.id}). Deleting...`);
  
  await prisma.user.delete({
    where: { id: user.id }
  });

  console.log(`User ${email} deleted successfully.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
