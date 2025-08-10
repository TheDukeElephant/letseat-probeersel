import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findFirst({ where: { email: 'demo@letseat.local' } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email: 'demo@letseat.local',
        name: 'Demo User',
        password: 'CHANGE_ME', // TODO: hash in real seed
        role: 'USER',
        orders: { create: [] }
      }
    });
  }
  // create a sample restaurant
  const restaurant = await prisma.restaurant.upsert({
    where: { slug: 'sample-restaurant' },
    update: {},
    create: {
      name: 'Sample Restaurant',
      slug: 'sample-restaurant',
      email: 'sample@restaurant.local',
      address: '123 Sample Street',
      menus: {
        create: [
          {
            name: 'Main Menu',
            categories: {
              create: [
                {
                  name: 'Burgers',
                  items: {
                    create: [
                      { name: 'Classic Burger', price: 899, description: 'A tasty burger' },
                      { name: 'Veggie Burger', price: 999, description: 'Plant-based goodness' }
                    ]
                  }
                }
              ]
            }
          }
        ]
      }
    }
  });
  // eslint-disable-next-line no-console
  console.log('Seed complete. Restaurant id:', restaurant.id);
}

main().catch(e => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
