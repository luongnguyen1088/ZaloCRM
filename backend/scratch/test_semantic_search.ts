
import { PrismaClient } from '@prisma/client';
import { searchSemanticKnowledge } from '../src/modules/ai/knowledge/knowledge-service';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testing searchSemanticKnowledge...');
    // Use an existing orgId from the DB
    const orgs = await prisma.organization.findMany({ take: 1 });
    if (orgs.length === 0) {
      console.log('No organizations found');
      return;
    }
    const orgId = orgs[0].id;
    console.log('Using OrgId:', orgId);

    const results = await searchSemanticKnowledge(orgId, 'Giao hàng');
    console.log('Results:', results);
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
