
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany();
  console.log('Organizations:', JSON.stringify(orgs, null, 2));

  for (const org of orgs) {
    const existing = await prisma.aiKnowledge.findFirst({
      where: {
        orgId: org.id,
        title: { contains: 'thanh toán' }
      }
    });

    if (!existing) {
      await prisma.aiKnowledge.create({
        data: {
          orgId: org.id,
          title: 'Thông tin thanh toán Claro Việt Nam',
          content: 'CÔNG TY TNHH CLARO VIỆT NAM\nMB Bank\nSố tài khoản: 6386365999\nNội dung chuyển khoản: [Họ tên] [SĐT] thanh toán',
          category: 'Thanh toán',
          isActive: true
        }
      });
      console.log(`Added payment info to org: ${org.name}`);
    } else {
      console.log(`Payment info already exists for org: ${org.name}`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
