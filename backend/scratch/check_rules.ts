import { prisma } from '../src/shared/database/prisma-client.js';

async function main() {
  const rules = await prisma.automationRule.findMany({
    where: { 
      trigger: 'message_received',
      isActive: true
    },
    include: { actions: true }
  });

  console.log('--- Current Automation Rules ---');
  console.log(JSON.stringify(rules, null, 2));

  const hasAiReply = rules.some(r => r.actions.some(a => a.type === 'ai_reply'));
  
  if (!hasAiReply) {
    console.log('CRITICAL: No active AI Reply automation rule found!');
  } else {
    console.log('Active AI Reply rule found.');
  }
}

main().catch(console.error);
