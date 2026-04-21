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

    const { email, role = 'member', maxUses = 1 } = request.body as { email?: string; role: string; maxUses?: number };

    if (email) {
      // Check if user is already a member of this organization
      const existingMember = await prisma.organizationMember.findFirst({
        where: {
          orgId: currentUser.orgId,
          user: { email }
        }
      });

      if (existingMember) {
        return reply.status(400).send({ error: 'Người dùng đã là thành viên của tổ chức này' });
      }

      // Check for pending specific invites
      const existingInvite = await prisma.userInvitation.findFirst({
        where: { 
          orgId: currentUser.orgId,
          email, 
          status: 'pending', 
          expiresAt: { gt: new Date() } 
        }
      });
      if (existingInvite) {
        return reply.status(400).send({ error: 'Đã có một lời mời đang chờ cho email này' });
      }
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    await prisma.userInvitation.create({
      data: {
        id: randomUUID(),
        orgId: currentUser.orgId,
        email: email || null,
        role,
        token,
        expiresAt,
        maxUses: email ? 1 : maxUses,
      }
    });

    const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invite?token=${token}`;
    
    return { 
      message: 'Lời mời đã được tạo', 
      token,
      inviteLink
    };
  });

  // GET /api/v1/invitations — List invitations
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

  // POST /api/v1/invitations/accept — Accept invite (joins user to org)
  app.post('/api/v1/invitations/accept', async (request: FastifyRequest, reply: FastifyReply) => {
    const { token, fullName, password, email: userEmail } = request.body as any;

    if (!token) {
      return reply.status(400).send({ error: 'Thiếu token mời' });
    }

    const invitation = await prisma.userInvitation.findUnique({
      where: { token }
    });

    if (!invitation || invitation.status !== 'pending' || invitation.expiresAt < new Date()) {
      return reply.status(400).send({ error: 'Lời mời không hợp lệ hoặc đã hết hạn' });
    }

    const finalEmail = (invitation.email || userEmail)?.toLowerCase().trim();
    if (!finalEmail) {
      return reply.status(400).send({ error: 'Vui lòng cung cấp email' });
    }

    let user = await prisma.user.findUnique({ where: { email: finalEmail } });

    await prisma.$transaction(async (tx) => {
      let activeUserId: string;

      if (user) {
        // User already exists. Verify password to join.
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          throw new Error('Mật khẩu không chính xác để xác nhận danh tính');
        }
        activeUserId = user.id;
        
        // Already a member?
        const member = await tx.organizationMember.findUnique({
          where: { orgId_userId: { orgId: invitation.orgId, userId: user.id } }
        });
        if (member) {
          throw new Error('Bạn đã là thành viên của tổ chức này');
        }
      } else {
        // New user. Create identity.
        const passwordHash = await bcrypt.hash(password, 12);
        const newUser = await tx.user.create({
          data: {
            id: randomUUID(),
            email: finalEmail,
            fullName,
            passwordHash,
          }
        });
        activeUserId = newUser.id;
      }

      // Create Membership
      await tx.organizationMember.create({
        data: {
          orgId: invitation.orgId,
          userId: activeUserId,
          role: invitation.role,
        }
      });

      // Update invitation
      const newUseCount = invitation.useCount + 1;
      const isFulfilled = newUseCount >= invitation.maxUses;

      await tx.userInvitation.update({
        where: { id: invitation.id },
        data: { 
          useCount: newUseCount,
          status: isFulfilled ? 'accepted' : 'pending' 
        }
      });
    }).catch(err => {
      return reply.status(400).send({ error: err.message });
    });

    return { success: true, message: 'Tham gia tổ chức thành công' };
  });

  // GET /api/v1/invitations/verify/:token
  app.get('/api/v1/invitations/verify/:token', async (request: FastifyRequest, reply: FastifyReply) => {
    const { token } = request.params as { token: string };
    const invitation = await prisma.userInvitation.findUnique({
      where: { token },
      select: { 
        email: true, 
        role: true, 
        status: true, 
        expiresAt: true, 
        useCount: true, 
        maxUses: true,
        org: { select: { name: true } }
      }
    });

    if (!invitation || (invitation.status !== 'pending' && invitation.useCount >= invitation.maxUses) || invitation.expiresAt < new Date()) {
      return reply.status(400).send({ error: 'Lời mời không hợp lệ' });
    }

    return invitation;
  });
}
