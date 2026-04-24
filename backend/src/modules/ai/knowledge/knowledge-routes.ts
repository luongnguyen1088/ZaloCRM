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
    const { question, zaloAccountId } = request.body as { question: string; zaloAccountId?: string };
    const orgId = request.user!.orgId;

    if (!question) return reply.status(400).send({ error: 'Vui lòng nhập câu hỏi' });

    // Find conversation in this org, optionally filtered by Zalo account
    const recentConv = await prisma.conversation.findFirst({
      where: { 
        orgId,
        zaloAccountId: zaloAccountId || undefined
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true }
    });

    if (!recentConv) {
      const errorMsg = zaloAccountId 
        ? 'Không tìm thấy hội thoại mẫu cho tài khoản Zalo này. Hãy nhắn tin vào Zalo này trước.' 
        : 'Cần ít nhất 1 cuộc hội thoại trong hệ thống để thử nghiệm';
      return reply.status(400).send({ error: errorMsg });
    }

    return generateAiOutput({
      orgId,
      conversationId: recentConv.id,
      type: 'reply_draft',
      history: (request.body as any).history,
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

  // RLHF: Propose knowledge fix based on desired answer
  fastify.post('/propose-fix', async (request: FastifyRequest, reply) => {
    const body = request.body as { question: string; originalAnswer: string; desiredAnswer: string };
    if (!body.desiredAnswer) return reply.status(400).send({ error: 'Vui lòng nhập câu trả lời mong muốn' });
    
    try {
      const orgId = request.user!.orgId;
      const { proposeKnowledgeFix } = await import('../ai-service.js');
      return await proposeKnowledgeFix(orgId, body);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });
}
