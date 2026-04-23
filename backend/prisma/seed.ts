import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding subscription plans...');

  const plans = [
    {
      name: 'Free',
      priceMonth: 0,
      maxZaloAcc: 1,
      maxAiTokens: 50,
      features: JSON.stringify(['CRM cơ bản', '1 tài khoản Zalo', 'AI Assistant cơ bản']),
    },
    {
      name: 'Pro',
      priceMonth: 200000,
      maxZaloAcc: 5,
      maxAiTokens: 500,
      features: JSON.stringify(['Đầy đủ CRM', '5 tài khoản Zalo', 'AI Assistant nâng cao', 'Automation']),
    },
    {
      name: 'Enterprise',
      priceMonth: 1000000,
      maxZaloAcc: 50,
      maxAiTokens: 5000,
      features: JSON.stringify(['Vô hạn CRM', '50 tài khoản Zalo', 'Ưu tiên hỗ trợ', 'Tích hợp API']),
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: {
        priceMonth: plan.priceMonth,
        maxZaloAcc: plan.maxZaloAcc,
        maxAiTokens: plan.maxAiTokens,
        features: plan.features,
      },
      create: plan,
    });
  }

  console.log('Seeding initial admin user...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  // Create an organization
  const org = await prisma.organization.upsert({
    where: { id: 'default-org-id' },
    update: {},
    create: {
      id: 'default-org-id',
      name: 'Claro VN Workspace',
    },
  });

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@claro.vn' },
    update: {},
    create: {
      email: 'admin@claro.vn',
      passwordHash: hashedPassword,
      fullName: 'Admin Claro',
      memberships: {
        create: {
          orgId: org.id,
          role: 'owner',
        }
      },
      isSystemAdmin: true
    },
  });

  console.log('Seeding payment knowledge...');
  await prisma.aiKnowledge.upsert({
    where: { 
      // Using a unique combination or finding by title since there's no unique ID for knowledge in seed
      id: 'claro-payment-info' 
    },
    update: {
      content: 'CÔNG TY TNHH CLARO VIỆT NAM\nMB Bank\nSố tài khoản: 6386365999\nNội dung chuyển khoản: [Họ tên] [SĐT] thanh toán'
    },
    create: {
      id: 'claro-payment-info',
      orgId: org.id,
      title: 'Thông tin thanh toán Claro Việt Nam',
      content: 'CÔNG TY TNHH CLARO VIỆT NAM\nMB Bank\nSố tài khoản: 6386365999\nNội dung chuyển khoản: [Họ tên] [SĐT] thanh toán',
      category: 'Thanh toán',
      isActive: true
    }
  });

  await prisma.user.upsert({
    where: { email: 'luongnguyen1088@gmail.com' },
    update: { isSystemAdmin: true },
    create: {
      email: 'luongnguyen1088@gmail.com',
      fullName: 'Luong Nguyen',
      passwordHash: await bcrypt.hash('Admin@123', 12),
      isSystemAdmin: true,
      memberships: {
        create: {
          orgId: org.id,
          role: 'owner',
        }
      }
    }
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
