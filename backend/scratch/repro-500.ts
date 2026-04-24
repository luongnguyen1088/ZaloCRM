import { generateAiOutput } from '../src/modules/ai/ai-service.js';
import { prisma } from '../src/shared/database/prisma-client.js';

async function test() {
  const orgId = 'df757822-3f59-4f3a-871c-6db22ee72c40';
  const conversationId = 'b10c1c7d-4941-47d1-bd73-39e2bd1b1ff2'; // Verified valid ID

  try {
    console.log('Testing generateAiOutput...');
    const result = await generateAiOutput({
      orgId,
      conversationId,
      type: 'reply_draft',
    });
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (err: any) {
    console.error('FAILED with error:', err.message);
    if (err.stack) console.error(err.stack);
  } finally {
    await prisma.$disconnect();
  }
}

test();
