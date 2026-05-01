import { prisma } from '../src/shared/database/prisma-client.js';
import { randomUUID } from 'node:crypto';

async function main() {
  // 1. Find the account and orgId for "Hang Pod Si"
  const account = await prisma.zaloAccount.findFirst({
    where: { displayName: { contains: 'Hang Pod Si' } },
    select: { orgId: true }
  });

  if (!account) {
    console.error('Could not find account "Hang Pod Si"');
    return;
  }

  const orgId = account.orgId;
  console.log(`Found OrgId: ${orgId}`);

  // 2. Check if the AI Reply rule already exists
  const allRules = await prisma.automationRule.findMany({
    where: { orgId, trigger: 'message_received' }
  });

  const existingRule = allRules.find(r => {
    const actions = Array.isArray(r.actions) ? r.actions : [];
    return actions.some((a: any) => a.type === 'ai_reply');
  });

  if (existingRule) {
    console.log('AI Reply rule already exists. Ensuring it is enabled...');
    await prisma.automationRule.update({
      where: { id: existingRule.id },
      data: { enabled: true }
    });
  } else {
    console.log('Creating new AI Reply automation rule...');
    await prisma.automationRule.create({
      data: {
        id: randomUUID(),
        orgId,
        name: 'Tự động phản hồi bằng AI',
        description: 'Tự động gọi AI xử lý khi có tin nhắn mới từ khách hàng',
        trigger: 'message_received',
        enabled: true,
        priority: 10,
        conditions: [], // No conditions = apply to all messages
        actions: [
          { type: 'ai_reply' }
        ]
      }
    });
  }
  
  console.log('SUCCESS: AI automation rule is now ACTIVE for your organization.');
}

main().catch(console.error);
