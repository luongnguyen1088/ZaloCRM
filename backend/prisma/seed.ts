import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding subscription plans...');

  const plans = [
    {
      name: 'Free',
      priceMonth: 0,
      maxZaloAcc: 1,
      maxAiTokens: 500,
      features: JSON.stringify(['CRM cơ bản', '1 tài khoản Zalo', 'AI Assistant cơ bản']),
    },
    {
      name: 'Pro',
      priceMonth: 200000,
      maxZaloAcc: 5,
      maxAiTokens: 5000,
      features: JSON.stringify(['Đầy đủ CRM', '5 tài khoản Zalo', 'AI Assistant nâng cao', 'Automation']),
    },
    {
      name: 'Enterprise',
      priceMonth: 1000000,
      maxZaloAcc: 50,
      maxAiTokens: 50000,
      features: JSON.stringify(['Vô hạn CRM', '50 tài khoản Zalo', 'Ưu tiên hỗ trợ', 'Tích hợp API']),
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { id: plan.name }, // This is a bit hacky since id is UUID, normally use name as unique or find first
      // Better way for seeding:
      update: {
        priceMonth: plan.priceMonth,
        maxZaloAcc: plan.maxZaloAcc,
        maxAiTokens: plan.maxAiTokens,
        features: plan.features,
      },
      create: plan as any,
    });
  }

  // Refined seeding to avoid ID issues
  for (const planData of plans) {
    const existing = await prisma.subscriptionPlan.findFirst({
      where: { name: planData.name }
    });

    if (existing) {
      await prisma.subscriptionPlan.update({
        where: { id: existing.id },
        data: planData
      });
    } else {
      await prisma.subscriptionPlan.create({
        data: planData
      });
    }
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
