import { generateAiOutput } from './backend/src/modules/ai/ai-service.js';
import { prisma } from './backend/src/shared/database/prisma-client.js';

async function testAi() {
  try {
    const orgId = 'df757822-3f59-4f3a-871c-6db22ee72c40';
    console.log('Testing AI for org:', orgId);
    
    // We need a real conversation ID from the DB to test
    const conversation = await prisma.conversation.findFirst({
      where: { orgId }
    });
    
    if (!conversation) {
      console.log('No conversation found to test with.');
      return;
    }

    console.log('Using conversation:', conversation.id);
    
    const result = await generateAiOutput({
      type: 'reply_draft',
      orgId,
      conversationId: conversation.id,
    });
    
    console.log('AI Result:', result);
  } catch (err) {
    console.error('AI Test Failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testAi();
