import { prisma } from '../../../shared/database/prisma-client.js';
import { config } from '../../../config/index.js';
import { embedWithOpenaiCompat } from '../providers/openai-compat.js';

export async function getAiKnowledgeList(orgId: string) {
  return prisma.aiKnowledge.findMany({
    where: { orgId },
    orderBy: { updatedAt: 'desc' },
    include: {
      zaloAccount: {
        select: { displayName: true }
      }
    }
  });
}

export async function createAiKnowledge(orgId: string, data: { title: string; content: string; category?: string; zaloAccountId?: string }) {
  const embedding = await generateEmbedding(data.content);
  
  return (prisma.aiKnowledge as any).create({
    data: {
      orgId,
      zaloAccountId: data.zaloAccountId || null,
      title: data.title,
      content: data.content,
      category: data.category || 'general',
      embedding: embedding || undefined,
    },
  });
}

export async function updateAiKnowledge(orgId: string, id: string, data: { 
  title?: string; 
  content?: string; 
  category?: string; 
  isActive?: boolean;
  zaloAccountId?: string | null;
}) {
  const updateData: any = {
    title: data.title,
    content: data.content,
    category: data.category,
    isActive: data.isActive,
    zaloAccountId: data.zaloAccountId !== undefined ? data.zaloAccountId : undefined,
  };

  if (data.content) {
    const embedding = await generateEmbedding(data.content);
    if (embedding) {
      updateData.embedding = embedding;
    }
  }

  return (prisma.aiKnowledge as any).update({
    where: { id, orgId },
    data: updateData,
  });
}

export async function deleteAiKnowledge(orgId: string, id: string) {
  return prisma.aiKnowledge.delete({
    where: { id, orgId },
  });
}

/**
 * Fetches relevant knowledge for a prompt context.
 */
export async function getRelevantKnowledge(orgId: string, zaloAccountId?: string) {
  const items = await prisma.aiKnowledge.findMany({
    where: { 
      orgId, 
      isActive: true,
      OR: [
        { zaloAccountId: null },
        { zaloAccountId: zaloAccountId || undefined }
      ]
    },
    select: { id: true, title: true, content: true },
    take: 10,
  });

  // Increment use count asynchronously
  if (items.length > 0) {
    prisma.aiKnowledge.updateMany({
      where: { id: { in: items.map(i => i.id) } },
      data: { useCount: { increment: 1 } }
    }).catch(err => console.error('[Knowledge Service] Failed to increment usage:', err));
  }

  return items;
}

/**
 * Performs semantic search using pgvector cosine similarity.
 */
export async function searchSemanticKnowledge(orgId: string, query: string, zaloAccountId?: string, limit = 5) {
  const embedding = await generateEmbedding(query);
  
  // Even if embedding fails, we can still do keyword search now!
  try {
    const vectorStr = embedding ? `[${embedding.join(',')}]` : null;
    
    // Hybrid Search using Reciprocal Rank Fusion (RRF)
    // We search Vector (if embedding exists) and Full-Text (Keyword)
    const results = await prisma.$queryRawUnsafe<any[]>(`
      WITH vector_search AS (
        SELECT id, title, content,
               ROW_NUMBER() OVER (ORDER BY embedding <=> $3::vector) as rank
        FROM "zalocrm"."ai_knowledge"
        WHERE org_id = $1::uuid AND is_active = true
        AND (zalo_account_id IS NULL OR zalo_account_id = $2::uuid)
        AND $3 IS NOT NULL -- Only run if we have a vector
        LIMIT 20
      ),
      keyword_search AS (
        SELECT id, title, content,
               ROW_NUMBER() OVER (ORDER BY ts_rank_cd(fts_tokens, websearch_to_tsquery('simple', $4)) DESC) as rank
        FROM "zalocrm"."ai_knowledge"
        WHERE org_id = $1::uuid AND is_active = true
        AND (zalo_account_id IS NULL OR zalo_account_id = $2::uuid)
        AND fts_tokens @@ websearch_to_tsquery('simple', $4)
        LIMIT 20
      )
      SELECT 
        COALESCE(vs.id, ks.id) as id,
        COALESCE(vs.title, ks.title) as title,
        COALESCE(vs.content, ks.content) as content,
        (COALESCE(1.0 / (60 + vs.rank), 0.0) + COALESCE(1.0 / (60 + ks.rank), 0.0)) as score
      FROM vector_search vs
      FULL OUTER JOIN keyword_search ks ON vs.id = ks.id
      ORDER BY score DESC
      LIMIT $5
    `, orgId, zaloAccountId || null, vectorStr, query, limit);

    if (results.length > 0) {
      prisma.aiKnowledge.updateMany({
        where: { id: { in: results.map(r => r.id) } },
        data: { useCount: { increment: 1 } }
      }).catch(() => {});
    }

    return results.map(r => ({
      id: r.id,
      title: r.title,
      content: r.content,
      score: r.score
    }));
  } catch (err: any) {
    console.error('[Knowledge Service] Hybrid search failed:', err.message || err);
    return getRelevantKnowledge(orgId, zaloAccountId);
  }
}

/**
 * Generate embedding for a given text using OpenRouter (OpenAI text-embedding-3-small)
 */
async function generateEmbedding(text: string) {
  if (!text) return null;
  try {
    return await embedWithOpenaiCompat(
      config.openrouterBaseUrl,
      config.openrouterAuthToken,
      'openai/text-embedding-3-small',
      text
    );
  } catch (err) {
    console.error('[Knowledge Service] Embedding failed:', err);
    return null;
  }
}
