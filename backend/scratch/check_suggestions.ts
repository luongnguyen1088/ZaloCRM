import { prisma } from '../src/shared/database/prisma-client.js';

async function main() {
  const suggestions = await prisma.aiSuggestion.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { content: true, confidence: true, createdAt: true }
  });
  console.log(JSON.stringify(suggestions, null, 2));
}

main().catch(console.error);
