/**
 * Auth service — handles setup, login, and profile operations.
 * Uses bcryptjs for password hashing and Fastify JWT for token signing.
 */
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../../shared/database/prisma-client.js';
import { logger } from '../../shared/utils/logger.js';
import { config } from '../../config/index.js';

export interface JwtPayload {
  id: string;      // User ID
  email: string;
  role: string;    // Role in current Org
  orgId: string;   // Current active Org ID
  isSystemAdmin: boolean;
}

// Check if any users exist — true means first-run setup is needed
export async function checkSetupStatus(): Promise<{ needsSetup: boolean }> {
  const count = await prisma.user.count();
  return { needsSetup: count === 0 };
}

// Create a new organization + owner user + default subscription, return JWT payload
export async function register(
  orgName: string,
  fullName: string,
  email: string,
  password: string,
): Promise<JwtPayload> {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  
  if (existing) {
    const err = new Error('Email already in use') as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create User
    const user = await tx.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        fullName,
      },
    });

    // 2. Create Org
    const org = await tx.organization.create({ data: { name: orgName } });
    
    // 3. Create Membership as Owner
    const membership = await tx.organizationMember.create({
      data: {
        orgId: org.id,
        userId: user.id,
        role: 'owner',
      },
    });

    // 4. Find Free Plan
    let freePlan = await tx.subscriptionPlan.findFirst({
      where: { name: 'Free' }
    });

    if (!freePlan) {
      freePlan = await tx.subscriptionPlan.create({
        data: {
          name: 'Free',
          priceMonth: 0,
          maxZaloAcc: 1,
          maxAiTokens: 500,
          features: JSON.stringify(['CRM cơ bản', '1 tài khoản Zalo']),
        }
      });
    }

    // 5. Create Subscription
    const now = new Date();
    const end = new Date();
    end.setFullYear(now.getFullYear() + 10);

    await tx.subscription.create({
      data: {
        orgId: org.id,
        planId: freePlan.id,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: end,
      }
    });

    return { org, user, membership };
  });

  logger.info(`Registration complete — user=${result.user.id}, org=${result.org.id}`);

  return {
    id: result.user.id,
    email: result.user.email,
    role: result.membership.role,
    orgId: result.org.id,
    isSystemAdmin: result.user.isSystemAdmin
  };
}

// Verify credentials, return JWT payload for the first available organization
export async function login(email: string, password: string): Promise<JwtPayload> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: {
      memberships: {
        where: { isActive: true },
        include: { org: true },
        take: 1
      }
    }
  });

  if (!user) {
    const err = new Error('Invalid email or password') as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const err = new Error('Invalid email or password') as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }

  if (user.memberships.length === 0) {
    const err = new Error('Your account is not linked to any active organization') as Error & { statusCode: number };
    err.statusCode = 403;
    throw err;
  }

  const activeMembership = user.memberships[0];

  return { 
    id: user.id, 
    email: user.email, 
    role: activeMembership.role, 
    orgId: activeMembership.orgId,
    isSystemAdmin: user.isSystemAdmin
  };
}

// Return safe user profile with all memberships
export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      avatarUrl: true,
      isSystemAdmin: true,
      createdAt: true,
      memberships: {
        where: { isActive: true },
        include: {
          org: { select: { id: true, name: true } },
          team: { select: { id: true, name: true } }
        }
      }
    },
  });

  if (!user) {
    const err = new Error('User not found') as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  // To maintain backward compatibility with components expecting profile.role and profile.orgId,
  // we add them from the first membership if available.
  const firstMember = user.memberships[0];

  return {
    ...user,
    role: firstMember?.role || 'member',
    orgId: firstMember?.orgId || null,
    org: firstMember?.org || null,
  };
}

const googleClient = new OAuth2Client(config.googleClientId);

export async function loginWithGoogle(idToken: string): Promise<JwtPayload> {
  if (!config.googleClientId) {
    throw new Error('Google Login is not configured on this server');
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: config.googleClientId,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new Error('Invalid Google token');
  }

  const email = payload.email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        where: { isActive: true },
        take: 1
      }
    }
  });

  if (!user) {
    // Automatic registration with Google
    return await register(
      `${payload.name || 'My Org'}'s Workspace`,
      payload.name || 'New User',
      email,
      Math.random().toString(36).slice(-12)
    );
  }

  if (user.memberships.length === 0) {
    throw new Error('Your account is not linked to any active organization');
  }

  const activeMembership = user.memberships[0];

  return { 
    id: user.id, 
    email: user.email, 
    role: activeMembership.role, 
    orgId: activeMembership.orgId,
    isSystemAdmin: user.isSystemAdmin
  };
}

/**
 * Generates a reset token, saves it to the user, and returns it.
 */
export async function forgotPassword(email: string): Promise<{ token: string }> {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    // For security, we don't reveal if the email exists.
    // In a real app, you might still return success but not send an email.
    throw new Error('Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.');
  }

  // Generate a random token
  const token = (await import('node:crypto')).randomBytes(32).toString('hex');
  const expires = new Date();
  expires.setHours(expires.getHours() + 1); // 1 hour expiry

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: token,
      resetPasswordExpires: expires,
    },
  });

  // Here you would normally send an email with the link:
  // const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  // await sendEmail(email, 'Reset Password', `Click here: ${resetLink}`);
  
  logger.info(`Password reset requested for ${email}. Token generated.`);

  return { token };
}

/**
 * Verifies the token and updates the user's password.
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: token,
      resetPasswordExpires: { gt: new Date() },
    },
  });

  if (!user) {
    throw new Error('Mã xác nhận không hợp lệ hoặc đã hết hạn.');
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });

  logger.info(`Password reset successful for user ${user.id}`);
}
