import { prisma } from '../../../shared/database/prisma-client.js';

export async function assignUserAction(contactId: string, userId: string, orgId: string) {
  const membership = await prisma.organizationMember.findUnique({ 
    where: { orgId_userId: { userId, orgId } } 
  });
  if (!membership || !membership.isActive) return null;

  return prisma.contact.update({
    where: { id: contactId },
    data: { assignedUserId: userId },
  });
}
