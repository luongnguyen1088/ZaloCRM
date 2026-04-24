import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve('.env') });

import { prisma } from '../src/shared/database/prisma-client.js';
import { config } from '../src/config/index.js';
import { embedTextWithGemini } from '../src/modules/ai/providers/gemini.js';

async function backfillEmbeddings() {
  console.log('Starting backfill of embeddings...');
  
  const items = await prisma.$queryRaw<any[]>`
    SELECT id, title, content FROM "zalocrm"."ai_knowledge" WHERE embedding IS NULL AND is_active = true
  `;

  console.log(`Found ${items.length} items to process.`);

  for (const item of items) {
    try {
      console.log(`Processing item: ${item.title} (${item.id})`);
      const embedding = await embedTextWithGemini(config.geminiBaseUrl, config.geminiAuthToken, item.content);
      
      const vectorStr = `[${embedding.join(',')}]`;
      await prisma.$executeRawUnsafe(
        `UPDATE "zalocrm"."ai_knowledge" SET embedding = $1::vector WHERE id = $2`,
        vectorStr,
        item.id
      );
      
      console.log(`Successfully updated embedding for: ${item.title}`);
      // Sleep slightly to avoid rate limits
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`Failed to process item ${item.id}:`, err);
    }
  }

  console.log('Backfill completed.');
}

backfillEmbeddings()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
