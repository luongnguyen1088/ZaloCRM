import { listPaymentOrders } from '../src/modules/billing/payment-order-service.js';
import { prisma } from '../src/shared/database/prisma-client.js';

async function test() {
  try {
    console.log('Testing listPaymentOrders...');
    const result = await listPaymentOrders({
      status: 'all',
      orderType: 'all',
      limit: 100,
    });
    console.log('Result count:', result.length);
    console.log('Sample:', JSON.stringify(result[0], null, 2));
  } catch (err: any) {
    console.error('FAILED with error:', err.message);
    if (err.stack) console.error(err.stack);
  } finally {
    await prisma.$disconnect();
  }
}

test();
