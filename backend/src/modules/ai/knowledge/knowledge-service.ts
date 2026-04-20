import { prisma } from '../../../shared/database/prisma-client.js';

export async function getAiKnowledgeList(orgId: string) {
  return prisma.aiKnowledge.findMany({
    where: { orgId },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function createAiKnowledge(orgId: string, data: { title: string; content: string; category?: string }) {
  return prisma.aiKnowledge.create({
    data: {
      orgId,
      title: data.title,
      content: data.content,
      category: data.category || 'general',
    },
  });
}

export async function updateAiKnowledge(orgId: string, id: string, data: { title?: string; content?: string; category?: string; isActive?: boolean }) {
  return prisma.aiKnowledge.update({
    where: { id, orgId },
    data: {
      title: data.title,
      content: data.content,
      category: data.category,
      isActive: data.isActive,
    },
  });
}

export async function deleteAiKnowledge(orgId: string, id: string) {
  return prisma.aiKnowledge.delete({
    where: { id, orgId },
  });
}

/**
 * Fetches relevant knowledge for a prompt context.
 * For now, we fetch all active knowledge for simplicity.
 * Later we can implement vector search or keyword-based filtering.
 */
export async function getRelevantKnowledge(orgId: string, query?: string) {
  const items = await prisma.aiKnowledge.findMany({
    where: { orgId, isActive: true },
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
