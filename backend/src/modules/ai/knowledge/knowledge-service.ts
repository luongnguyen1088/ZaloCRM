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
  return prisma.aiKnowledge.findMany({
    where: { orgId, isActive: true },
    select: { title: true, content: true },
    take: 10, // Limit to top 10 items for now to avoid prompt token explosion
  });
}
