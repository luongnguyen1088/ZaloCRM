import { prisma } from '../src/shared/database/prisma-client.js';

async function main() {
  const account = await prisma.zaloAccount.findFirst({ 
    where: { displayName: { contains: 'Hang Pod Si' } } 
  });
  if (account) {
    console.log(JSON.stringify({ 
      id: account.id, 
      status: account.status, 
      hasToken: !!account.accessToken,
      platformConfig: account.platformConfig
    }, null, 2));
  } else {
    console.log('Account not found');
  }
}

main().catch(console.error);
