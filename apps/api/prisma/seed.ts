import { PrismaClient, CouponType, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash('demo12345');

  const buyer = await prisma.user.upsert({
    where: { email: 'comprador@demo.com' },
    update: {},
    create: {
      name: 'Comprador Demo',
      email: 'comprador@demo.com',
      passwordHash,
      role: UserRole.COMPRADOR,
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: 'vendedor@demo.com' },
    update: {},
    create: {
      name: 'Vendedor Demo',
      email: 'vendedor@demo.com',
      passwordHash,
      role: UserRole.VENDEDOR,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      name: 'Admin Demo',
      email: 'admin@demo.com',
      passwordHash,
      role: UserRole.SUPERADMIN,
    },
  });

  await prisma.address.upsert({
    where: { id: '00000000-0000-4000-8000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      userId: buyer.id,
      label: 'Casa',
      fullAddress: 'Calle Demo 123',
      city: 'Madrid',
      postalCode: '28001',
      primaryAddress: true,
    },
  });

  const category = await prisma.category.upsert({
    where: { name: 'General' },
    update: {},
    create: { name: 'General', description: 'Categoría demo' },
  });

  const product = await prisma.product.findFirst({
    where: { name: 'Camiseta Minimal', sellerId: seller.id },
  });
  if (!product) {
    await prisma.product.create({
      data: {
        name: 'Camiseta Minimal',
        description: 'Producto de demostración',
        price: 29.99,
        stock: 50,
        categoryId: category.id,
        sellerId: seller.id,
      },
    });
  }

  const startsAt = new Date();
  startsAt.setDate(startsAt.getDate() - 1);
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: { active: true, currentUses: 0 },
    create: {
      code: 'WELCOME10',
      type: CouponType.PORCENTAJE,
      value: 10,
      description: '10% de bienvenida',
      startsAt,
      expiresAt,
      maxUses: 1000,
      creatorId: seller.id,
    },
  });

  for (const key of ['reviews', 'favorites', 'blog', 'events']) {
    await prisma.featureFlag.upsert({
      where: { key },
      update: { enabled: true },
      create: { key, enabled: true },
    });
  }

  console.log('Seed OK: comprador@demo.com / vendedor@demo.com / admin@demo.com (demo12345)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
