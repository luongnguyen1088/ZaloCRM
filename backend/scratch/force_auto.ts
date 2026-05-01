import { prisma } from '../src/shared/database/prisma-client.js';

async function main() {
  const account = await prisma.zaloAccount.findFirst({ 
    where: { displayName: { contains: 'Hang Pod Si' } } 
  });
  
  if (!account) {
    console.error('Account not found');
    return;
  }

  // Force Update AI Config for this channel
  await prisma.aiChannelConfig.upsert({
    where: { zaloAccountId: account.id },
    update: { 
      aiResponseMode: 'auto', 
      enabled: true, 
      confidenceThreshold: 0.1, 
      autoReplyDelay: 0 
    },
    create: { 
      orgId: account.orgId, 
      zaloAccountId: account.id, 
      aiResponseMode: 'auto', 
      enabled: true, 
      confidenceThreshold: 0.1, 
      autoReplyDelay: 0 
    }
  });

  // Also ensure Global AI is enabled
  await prisma.aiConfig.upsert({
    where: { orgId: account.orgId },
    update: { enabled: true },
    create: { 
      orgId: account.orgId, 
      enabled: true,
      provider: 'openrouter',
      model: 'google/gemini-2.0-flash-001'
    }
  });

  console.log('--- FORCE AUTO MODE SUCCESS ---');
}

main().catch(console.error);
