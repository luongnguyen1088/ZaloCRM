import type { FastifyInstance, FastifyRequest } from 'fastify';
import { authMiddleware } from '../../auth/auth-middleware.js';
import * as service from './knowledge-service.js';
import { getAiConfig, getAiUsage, updateAiConfig, generateAiOutput, categorizeKnowledge } from '../ai-service.js';
import { prisma } from '../../../shared/database/prisma-client.js';

export async function knowledgeRoutes(fastify: FastifyInstance) {
  fastify.addHook('preHandler', authMiddleware);

  fastify.get('/', async (request) => {
    const orgId = request.user!.orgId;
    return service.getAiKnowledgeList(orgId);
  });

  fastify.post('/', async (request: any) => {
    const orgId = request.user!.orgId;
    return service.createAiKnowledge(orgId, request.body);
  });

  fastify.put('/:id', async (request: any) => {
    const orgId = request.user!.orgId;
    const { id } = request.params;
    return service.updateAiKnowledge(orgId, id, request.body);
  });

  fastify.delete('/:id', async (request: any) => {
    const orgId = request.user!.orgId;
    const { id } = request.params;
    await service.deleteAiKnowledge(orgId, id);
    return { success: true };
  });

  // Simulator: Test knowledge without a real conversation
  fastify.post('/test', async (request: FastifyRequest, reply) => {
    const { question } = request.body as { question: string };
    const orgId = request.user!.orgId;

    if (!question) return reply.status(400).send({ error: 'Vui lòng nhập câu hỏi' });

    // Create a mock conversation context for testing
    // We'll use a temporary mock ID or find a recent one to anchor the LLM
    const recentConv = await prisma.conversation.findFirst({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      select: { id: true }
    });

    if (!recentConv) return reply.status(400).send({ error: 'Cần ít nhất 1 cuộc hội thoại trong hệ thống để thử nghiệm' });

    return generateAiOutput({
      orgId,
      conversationId: recentConv.id,
      type: 'reply_draft',
      customPrompt: `Vào vai trợ lý phản hồi câu hỏi thử nghiệm của người dùng: "${question}". Hãy ưu tiên sử dụng kiến thức doanh nghiệp đã nạp.`
    });
  });

  // AI Smart Add: Analyze and categorize content automatically
  fastify.post('/analyze', async (request: FastifyRequest, reply) => {
    const { content } = request.body as { content: string };
    if (!content) return reply.status(400).send({ error: 'Nội dung không được để trống' });
    
    try {
      return await categorizeKnowledge(request.user!.orgId, content);
    } catch (err) {
      return { title: 'Kiến thức mới', category: 'Chung' };
    }
  });
}
