import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../shared/database/prisma-client.js';
import { authMiddleware } from './auth-middleware.js';
import { randomBytes, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { logger } from '../../shared/utils/logger.js';

export async function invitationRoutes(app: FastifyInstance) {
  
  // POST /api/v1/invitations — Create an invitation (Owner/Admin only)
  app.post('/api/v1/invitations', { preHandler: [authMiddleware] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const currentUser = request.user!;
    if (!['owner', 'admin'].includes(currentUser.role)) {
      return reply.status(403).send({ error: 'Không có quyền' });
    }

    const { email, role = 'member' } = request.body as { email: string; role: string };
    if (!email) {
      return reply.status(400).send({ error: 'Email là bắt buộc' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return reply.status(400).send({ error: 'Người dùng đã có tài khoản trong hệ thống' });
    }

    // Check if there is an active invitation
    const existingInvite = await prisma.userInvitation.findFirst({
      where: { email, status: 'pending', expiresAt: { gt: new Date() } }
    });

    if (existingInvite) {
      return reply.status(400).send({ error: 'Đã có một lời mời đang chờ xử lý cho email này' });
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48); // 48 hours expiry

    const invitation = await prisma.userInvitation.create({
      data: {
        id: randomUUID(),
        orgId: currentUser.orgId,
        email,
        role,
        token,
        expiresAt,
      }
    });

    // Mock Email sending
    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invite?token=${token}`;
    logger.info(`[INVITATION] Internal Link: ${inviteLink}`);
    
    // In a real app, send actual email here.
    // For now we return the token/link so admin can copy if needed (or just for testing)
    return { 
      message: 'Lời mời đã được tạo', 
      invitationId: invitation.id,
      debugLink: inviteLink // Remove this in production if email is working
    };
  });

  // GET /api/v1/invitations — List invitations (Owner/Admin only)
  app.get('/api/v1/invitations', { preHandler: [authMiddleware] }, async (request: FastifyRequest) => {
    const currentUser = request.user!;
    if (!['owner', 'admin'].includes(currentUser.role)) {
      throw new Error('Unauthorized');
    }

    const invitations = await prisma.userInvitation.findMany({
      where: { orgId: currentUser.orgId },
      orderBy: { createdAt: 'desc' },
    });

    return { invitations };
  });

  // POST /api/v1/invitations/accept — Public route to accept invite
  app.post('/api/v1/invitations/accept', async (request: FastifyRequest, reply: FastifyReply) => {
    const { token, fullName, password } = request.body as any;

    if (!token || !fullName || !password) {
      return reply.status(400).send({ error: 'Thiếu thông tin bắt buộc' });
    }

    const invitation = await prisma.userInvitation.findUnique({
      where: { token }
    });

    if (!invitation || invitation.status !== 'pending' || invitation.expiresAt < new Date()) {
      return reply.status(400).send({ error: 'Lời mời không hợp lệ hoặc đã hết hạn' });
    }

    // Create the user
    const passwordHash = await bcrypt.hash(password, 10);
    
    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: randomUUID(),
          orgId: invitation.orgId,
          email: invitation.email,
          fullName,
          passwordHash,
          role: invitation.role,
        }
      });

      await tx.userInvitation.update({
        where: { id: invitation.id },
        data: { status: 'accepted' }
      });
    });

    return { success: true, message: 'Tài khoản đã được kích hoạt thành công' };
  });

  // GET /api/v1/invitations/verify — Verify token before showing form
  app.get('/api/v1/invitations/verify/:token', async (request: FastifyRequest, reply: FastifyReply) => {
    const { token } = request.params as { token: string };
    const invitation = await prisma.userInvitation.findUnique({
      where: { token },
      select: { email: true, role: true, status: true, expiresAt: true }
    });

    if (!invitation || invitation.status !== 'pending' || invitation.expiresAt < new Date()) {
      return reply.status(400).send({ error: 'Lời mời không hợp lệ' });
    }

    return invitation;
  });
}
