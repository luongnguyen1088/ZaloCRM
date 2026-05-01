import { prisma } from '../src/shared/database/prisma-client.js';

async function main() {
  const account = await prisma.zaloAccount.findFirst({ 
    where: { displayName: { contains: 'Hang Pod Si' } } 
  });
  
  if (!account) {
    console.error('Account not found');
    return;
  }

  console.log(`Found account ${account.displayName} in Org ${account.orgId}`);

  // Delete old rules to avoid duplication
  await prisma.automationRule.deleteMany({
    where: { 
      orgId: account.orgId,
      name: 'Tự động phản hồi bằng AI'
    }
  });

  // Create clean rule
  await prisma.automationRule.create({
    data: {
      orgId: account.orgId,
      name: 'Tự động phản hồi bằng AI',
      trigger: 'message_received',
      enabled: true,
      priority: 10,
      actions: [
        { type: 'ai_reply', confidenceThreshold: 0.1 }
      ],
      conditions: []
    }
  });

  console.log('--- SUCCESS: AI Rule Recreated ---');
}

main().catch(console.error);
