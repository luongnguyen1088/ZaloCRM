/**
 * Auth routes — setup, login, profile, and organization switching.
 * Registered as a Fastify plugin via app.register(authRoutes).
 */
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../shared/database/prisma-client.js';
import { authMiddleware } from './auth-middleware.js';
import {
  checkSetupStatus,
  register,
  login,
  loginWithGoogle,
  getProfile,
  JwtPayload
} from './auth-service.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // GET /api/v1/setup/status — check if first-run setup is needed
  app.get('/api/v1/setup/status', async () => {
    return checkSetupStatus();
  });

  // POST /api/v1/auth/register — create org + owner user, return JWT
  app.post<{
    Body: { orgName: string; fullName: string; email: string; password: string };
  }>('/api/v1/auth/register', async (request, reply) => {
    const { orgName, fullName, email, password } = request.body;
    if (!orgName || !fullName || !email || !password) {
      return reply.status(400).send({ error: 'Missing required fields' });
    }
    const payload = await register(orgName, fullName, email, password);
    const token = app.jwt.sign(payload, { expiresIn: '7d' });
    return { token, user: payload };
  });

  // Alias /setup for backward compatibility
  app.post('/api/v1/setup', async (request) => {
    return app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: request.body as any,
    });
  });

  // POST /api/v1/auth/login — verify credentials, return JWT for active org
  app.post<{
    Body: { email: string; password: string };
  }>('/api/v1/auth/login', async (request, reply) => {
    const { email, password } = request.body;
    if (!email || !password) {
      return reply.status(400).send({ error: 'Missing email or password' });
    }
    const payload = await login(email, password);
    const token = app.jwt.sign(payload, { expiresIn: '7d' });
    return { token, user: payload };
  });

  // GET /api/v1/profile — return current user profile with all organizations
  app.get('/api/v1/profile', { preHandler: authMiddleware }, async (request) => {
    const user = request.user!;
    return getProfile(user.id);
  });

  // POST /api/v1/auth/switch-org/:orgId — Switch active organization
  app.post<{ Params: { orgId: string } }>(
    '/api/v1/auth/switch-org/:orgId',
    { preHandler: [authMiddleware] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const { orgId } = request.params as { orgId: string };

      const membership = await prisma.organizationMember.findUnique({
        where: { orgId_userId: { orgId, userId: user.id } }
      });

      if (!membership || !membership.isActive) {
        return reply.status(403).send({ error: 'Bạn không có quyền truy cập vào tổ chức này' });
      }

      const payload: JwtPayload = {
        id: user.id,
        email: user.email,
        role: membership.role,
        orgId: membership.orgId
      };

      const token = app.jwt.sign(payload, { expiresIn: '7d' });
      return { token, user: payload };
    }
  );

  // POST /api/v1/auth/google — verify Google token
  app.post<{ Body: { idToken: string } }>('/api/v1/auth/google', async (request, reply) => {
    const { idToken } = request.body;
    if (!idToken) {
      return reply.status(400).send({ error: 'Missing idToken' });
    }
    const payload = await loginWithGoogle(idToken);
    const token = app.jwt.sign(payload, { expiresIn: '7d' });
    return { token, user: payload };
  });
}
