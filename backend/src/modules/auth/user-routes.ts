/**
 * User management routes — CRUD for users within an org.
 * All routes require authentication via authMiddleware.
 * Role-based access: owner > admin > member.
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../shared/database/prisma-client.js';
import { authMiddleware } from './auth-middleware.js';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { logger } from '../../shared/utils/logger.js';

export async function userRoutes(app: FastifyInstance) {
  // GET /api/v1/users/check — Check if email exists (Public)
  app.get('/api/v1/users/check', async (request: FastifyRequest) => {
    const { email } = request.query as { email: string };
    if (!email) return { exists: false };
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    return { exists: !!user };
  });

  app.addHook('preHandler', authMiddleware);

  // GET /api/v1/users — list all users in the current org
  app.get('/api/v1/users', async (request: FastifyRequest) => {
    const currentUser = request.user!;
    const members = await prisma.organizationMember.findMany({
      where: { orgId: currentUser.orgId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            avatarUrl: true,
          }
        },
        team: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Flatten for frontend compatibility
    const users = members.map(m => ({
      membershipId: m.id,
      id: m.userId,
      email: m.user.email,
      fullName: m.user.fullName,
      role: m.role,
      isActive: m.isActive,
      teamId: m.teamId,
      createdAt: m.createdAt,
      team: m.team,
    }));

    return { users };
  });

  // POST /api/v1/users — create user (owner/admin only)
  app.post('/api/v1/users', async (request: FastifyRequest, reply: FastifyReply) => {
    const currentUser = request.user!;
    if (!['owner', 'admin'].includes(currentUser.role)) {
      return reply.status(403).send({ error: 'Không có quyền' });
    }

    const { email, fullName, password, role = 'member', teamId } = request.body as any;
    if (!email || !fullName || !password) {
      return reply.status(400).send({ error: 'Email, họ tên, mật khẩu là bắt buộc' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const result = await prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { email: normalizedEmail } });
      
      if (!user) {
        const passwordHash = await bcrypt.hash(password, 12);
        user = await tx.user.create({
          data: {
            id: randomUUID(),
            email: normalizedEmail,
            fullName,
            passwordHash,
          }
        });
      }

      const existingMember = await tx.organizationMember.findUnique({
        where: { orgId_userId: { orgId: currentUser.orgId, userId: user.id } }
      });

      if (existingMember) {
        throw new Error('Người dùng này đã là thành viên của tổ chức này');
      }

      const membership = await tx.organizationMember.create({
        data: {
          orgId: currentUser.orgId,
          userId: user.id,
          role,
          teamId: teamId || null,
        },
        include: { user: true }
      });

      return membership;
    }).catch(err => {
      return reply.status(400).send({ error: err.message });
    });

    if ('error' in result) return result;

    logger.info(`User ${normalizedEmail} added to org ${currentUser.orgId} by ${currentUser.email}`);
    
    return {
      id: result.userId,
      email: result.user.email,
      fullName: result.user.fullName,
      role: result.role,
      isActive: result.isActive,
      createdAt: result.createdAt,
    };
  });

  // PUT /api/v1/users/:id — update user info (id is userId)
  app.put('/api/v1/users/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const currentUser = request.user!;
    const { id: targetUserId } = request.params as { id: string };

    const membership = await prisma.organizationMember.findUnique({
      where: { orgId_userId: { orgId: currentUser.orgId, userId: targetUserId } }
    });

    if (!membership) {
      return reply.status(404).send({ error: 'Không tìm thấy nhân viên trong tổ chức này' });
    }

    if (!['owner', 'admin'].includes(currentUser.role) && currentUser.id !== targetUserId) {
      return reply.status(403).send({ error: 'Không có quyền' });
    }

    const { fullName, email, role, teamId, isActive } = request.body as any;

    if (targetUserId === currentUser.id && role && role !== currentUser.role) {
      return reply.status(400).send({ error: 'Không thể thay đổi vai trò của chính mình' });
    }

    const membershipUpdate: any = {};
    if (role !== undefined && currentUser.role === 'owner') membershipUpdate.role = role;
    if (teamId !== undefined) membershipUpdate.teamId = teamId || null;
    if (isActive !== undefined && currentUser.role === 'owner') membershipUpdate.isActive = isActive;

    const userUpdate: any = {};
    if (fullName !== undefined) userUpdate.fullName = fullName;
    if (email !== undefined) userUpdate.email = email.toLowerCase().trim();

    const result = await prisma.$transaction([
      prisma.organizationMember.update({
        where: { id: membership.id },
        data: membershipUpdate,
        include: { user: true }
      }),
      ...(Object.keys(userUpdate).length > 0 ? [
        prisma.user.update({
          where: { id: targetUserId },
          data: userUpdate
        })
      ] : [])
    ]);

    const updatedMember = result[0] as any;

    return {
      id: updatedMember.userId,
      email: updatedMember.user.email,
      fullName: updatedMember.user.fullName,
      role: updatedMember.role,
      isActive: updatedMember.isActive,
      teamId: updatedMember.teamId,
    };
  });

  // PUT /api/v1/users/:id/password — reset password (owner/admin only)
  app.put('/api/v1/users/:id/password', async (request: FastifyRequest, reply: FastifyReply) => {
    const currentUser = request.user!;
    if (!['owner', 'admin'].includes(currentUser.role)) {
      return reply.status(403).send({ error: 'Không có quyền' });
    }

    const { id: targetUserId } = request.params as { id: string };
    const { password } = request.body as { password: string };
    
    if (!password || password.length < 6) {
      return reply.status(400).send({ error: 'Mật khẩu tối thiểu 6 ký tự' });
    }

    // Verify user belongs to this org
    const membership = await prisma.organizationMember.findUnique({
      where: { orgId_userId: { orgId: currentUser.orgId, userId: targetUserId } }
    });

    if (!membership) {
      return reply.status(404).send({ error: 'Nhân viên không thuộc tổ chức này' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: targetUserId },
      data: { passwordHash },
    });

    return { success: true };
  });

  // DELETE /api/v1/users/:id — remove user from org (owner only)
  app.delete('/api/v1/users/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const currentUser = request.user!;
    if (currentUser.role !== 'owner') {
      return reply.status(403).send({ error: 'Chỉ owner có quyền gỡ nhân viên khỏi tổ chức' });
    }

    const { id: targetUserId } = request.params as { id: string };
    if (targetUserId === currentUser.id) {
      return reply.status(400).send({ error: 'Không thể tự gỡ chính mình' });
    }

    // Find and deactivate membership (safer than hard delete)
    await prisma.organizationMember.update({
      where: { orgId_userId: { orgId: currentUser.orgId, userId: targetUserId } },
      data: { isActive: false },
    });

    return { success: true };
  });
}
