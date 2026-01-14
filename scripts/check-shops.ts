import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { prisma } from '../lib/db/prisma';

async function main() {
  console.log('Checking shops in database...');

  const shops = await prisma.shop.findMany({
    select: {
      id: true,
      shopDomain: true,
      plan: true,
      installedAt: true,
    }
  });

  console.log('Total shops:', shops.length);
  console.log('Shops:', JSON.stringify(shops, null, 2));

  // Check specifically for the problematic shop
  const targetShop = await prisma.shop.findUnique({
    where: { shopDomain: 'locateus-2.myshopify.com' }
  });

  if (targetShop) {
    console.log('\nTarget shop found:', targetShop.id);
  } else {
    console.log('\nTarget shop NOT FOUND: locateus-2.myshopify.com');
  }
}

main()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
