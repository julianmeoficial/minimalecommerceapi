import { PrismaClient, CouponType, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

/** URL Unsplash libre de derechos (licencia Unsplash), tamaño catálogo. */
function unsplash(photoId: string): string {
  return `https://images.unsplash.com/${photoId}?w=800&q=80&auto=format&fit=crop`;
}

const CATEGORIAS: { name: string; description: string }[] = [
  { name: 'Ropa', description: 'Prendas y básicos de vestir' },
  { name: 'Calzado', description: 'Zapatos, tenis y sandalias' },
  { name: 'Accesorios', description: 'Bolsos, gafas, relojes y más' },
  { name: 'Hogar', description: 'Decoración y utensilios para el hogar' },
  { name: 'Tecnología', description: 'Gadgets y electrónicos' },
  { name: 'Deportes', description: 'Equipamiento y ropa deportiva' },
];

type ProductoSeed = {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageKey: string;
  preorder?: boolean;
};

/** Precios en COP (pesos colombianos). Fotos: Unsplash. */
const PRODUCTOS: ProductoSeed[] = [
  // Ropa
  {
    name: 'Camiseta Minimal',
    description: 'Camiseta de algodón orgánico, corte regular, color crudo.',
    price: 59900,
    stock: 50,
    category: 'Ropa',
    imageKey: unsplash('photo-1521572163474-6864f9cf17ab'),
  },
  {
    name: 'Hoodie Oversized',
    description: 'Sudadera con capucha, felpa suave, unisex.',
    price: 149900,
    stock: 30,
    category: 'Ropa',
    imageKey: unsplash('photo-1556821840-3a63f95609a7'),
  },
  {
    name: 'Jeans Slim Fit',
    description: 'Denim elástico lavado medio, tiro medio.',
    price: 179900,
    stock: 25,
    category: 'Ropa',
    imageKey: unsplash('photo-1542272604-787c3835535d'),
  },
  {
    name: 'Chaqueta Bomber',
    description: 'Bomber ligera con forro y cierre frontal.',
    price: 249900,
    stock: 15,
    category: 'Ropa',
    imageKey: unsplash('photo-1551028719-00167b16eac5'),
  },
  // Calzado
  {
    name: 'Tenis Urbanos Blancos',
    description: 'Sneakers de lona blanca, suela de goma.',
    price: 189900,
    stock: 40,
    category: 'Calzado',
    imageKey: unsplash('photo-1549298916-b41d501d3772'),
  },
  {
    name: 'Botas Chelsea',
    description: 'Botas de cuero sintético con elásticos laterales.',
    price: 279900,
    stock: 12,
    category: 'Calzado',
    imageKey: unsplash('photo-1605812860427-4024433a70fd'),
  },
  {
    name: 'Sandalias Minimal',
    description: 'Sandalias planas de cuero vegano.',
    price: 89900,
    stock: 35,
    category: 'Calzado',
    imageKey: unsplash('photo-1603487742131-4160ec999306'),
  },
  {
    name: 'Zapatillas Running',
    description: 'Calzado de running con amortiguación ligera.',
    price: 329900,
    stock: 20,
    category: 'Calzado',
    imageKey: unsplash('photo-1542291026-7eec264c27ff'),
  },
  // Accesorios
  {
    name: 'Mochila Canvas',
    description: 'Mochila de lona con compartimento para laptop 15".',
    price: 129900,
    stock: 22,
    category: 'Accesorios',
    imageKey: unsplash('photo-1553062407-98eeb64c6a62'),
  },
  {
    name: 'Gafas de Sol Aviador',
    description: 'Montura metálica, lentes polarizadas UV400.',
    price: 79900,
    stock: 45,
    category: 'Accesorios',
    imageKey: unsplash('photo-1511499767150-a48a237f0083'),
  },
  {
    name: 'Reloj Analógico Minimal',
    description: 'Caja delgada, correa de cuero, esfera blanca.',
    price: 199900,
    stock: 18,
    category: 'Accesorios',
    imageKey: unsplash('photo-1524592094714-0f0654e20314'),
  },
  {
    name: 'Cinturón de Cuero',
    description: 'Cinturón clásico con hebilla plateada.',
    price: 69900,
    stock: 28,
    category: 'Accesorios',
    imageKey: unsplash('photo-1624222247344-550fb60583fd'),
  },
  // Hogar
  {
    name: 'Lámpara de Escritorio',
    description: 'Lámpara LED regulable con brazo articulado.',
    price: 119900,
    stock: 16,
    category: 'Hogar',
    imageKey: unsplash('photo-1507473885765-e6ed057f782c'),
  },
  {
    name: 'Set de Vasos (4)',
    description: 'Cuatro vasos de vidrio soplado, 350 ml.',
    price: 45900,
    stock: 60,
    category: 'Hogar',
    imageKey: unsplash('photo-1514228742587-6b1554078585'),
  },
  {
    name: 'Cojín Lino Natural',
    description: 'Cojín 45×45 cm, funda de lino lavable.',
    price: 54900,
    stock: 40,
    category: 'Hogar',
    imageKey: unsplash('photo-1584100936595-c0654b55a2e2'),
  },
  {
    name: 'Jarrón Cerámica',
    description: 'Jarrón artesanal esmaltado, tono arena.',
    price: 84900,
    stock: 14,
    category: 'Hogar',
    imageKey: unsplash('photo-1578500494198-246f612d3b3d'),
  },
  // Tecnología
  {
    name: 'Auriculares Inalámbricos',
    description: 'Bluetooth 5.3, cancelación pasiva, estuche de carga.',
    price: 249900,
    stock: 32,
    category: 'Tecnología',
    imageKey: unsplash('photo-1505740420928-5e560c06d30e'),
  },
  {
    name: 'Teclado Mecánico Compacto',
    description: 'Layout 75 %, switches táctiles, RGB suave.',
    price: 389900,
    stock: 10,
    category: 'Tecnología',
    imageKey: unsplash('photo-1511467687898-710079714dbd'),
  },
  {
    name: 'Mouse Ergonómico',
    description: 'Mouse vertical inalámbrico, 3 DPI.',
    price: 159900,
    stock: 24,
    category: 'Tecnología',
    imageKey: unsplash('photo-1527864550417-7fd91fc51a46'),
  },
  {
    name: 'Soporte Laptop Aluminio',
    description: 'Soporte plegable, ventilación elevada.',
    price: 99900,
    stock: 3,
    category: 'Tecnología',
    imageKey: unsplash('photo-1525547719533-d2eb5e148e9a'),
    preorder: true,
  },
  // Deportes
  {
    name: 'Esterilla Yoga',
    description: 'Esterilla antideslizante 6 mm, con correa.',
    price: 74900,
    stock: 35,
    category: 'Deportes',
    imageKey: unsplash('photo-1601925260368-ae2f83cf8b7f'),
  },
  {
    name: 'Botella Térmica 750 ml',
    description: 'Acero inoxidable, mantiene frío 24 h / calor 12 h.',
    price: 64900,
    stock: 50,
    category: 'Deportes',
    imageKey: unsplash('photo-1602143407151-7111542de6e8'),
  },
  {
    name: 'Bandas de Resistencia (set)',
    description: 'Set de 5 bandas con anclajes y funda.',
    price: 55900,
    stock: 27,
    category: 'Deportes',
    imageKey: unsplash('photo-1598289431512-b97b0917affc'),
  },
  {
    name: 'Bicicleta Urbana Fixie',
    description: 'Cuadro acero, freno delantero, talla M. Preventa.',
    price: 1199900,
    stock: 5,
    category: 'Deportes',
    imageKey: unsplash('photo-1485965120184-e324fd1dea9f'),
    preorder: true,
  },
];

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
    update: {
      fullAddress: 'Calle 93 # 11-45',
      city: 'Bogotá',
      postalCode: '110221',
    },
    create: {
      id: '00000000-0000-4000-8000-000000000001',
      userId: buyer.id,
      label: 'Casa',
      fullAddress: 'Calle 93 # 11-45',
      city: 'Bogotá',
      postalCode: '110221',
      primaryAddress: true,
    },
  });

  const categoriasPorNombre = new Map<string, string>();
  for (const cat of CATEGORIAS) {
    const row = await prisma.category.upsert({
      where: { name: cat.name },
      update: { description: cat.description },
      create: { name: cat.name, description: cat.description },
    });
    categoriasPorNombre.set(row.name, row.id);
  }

  // Mantener "General" por compatibilidad con entornos ya seedados; sin productos nuevos.
  await prisma.category.upsert({
    where: { name: 'General' },
    update: {},
    create: { name: 'General', description: 'Categoría demo (legacy)' },
  });

  for (const item of PRODUCTOS) {
    const categoryId = categoriasPorNombre.get(item.category);
    if (!categoryId) throw new Error(`Categoría faltante: ${item.category}`);

    const existente = await prisma.product.findFirst({
      where: { name: item.name, sellerId: seller.id },
    });

    if (existente) {
      await prisma.product.update({
        where: { id: existente.id },
        data: {
          description: item.description,
          price: item.price,
          stock: item.stock,
          imageKey: item.imageKey,
          categoryId,
          preorder: item.preorder ?? false,
          active: true,
        },
      });
    } else {
      await prisma.product.create({
        data: {
          name: item.name,
          description: item.description,
          price: item.price,
          stock: item.stock,
          imageKey: item.imageKey,
          categoryId,
          sellerId: seller.id,
          preorder: item.preorder ?? false,
        },
      });
    }
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

  for (const key of ['cupones', 'resenas', 'favoritos', 'contenido', 'notificaciones']) {
    await prisma.featureFlag.upsert({
      where: { key },
      update: { enabled: true },
      create: { key, enabled: true },
    });
  }

  console.log(
    `Seed OK: ${PRODUCTOS.length} productos COP / Unsplash; cuentas comprador@demo.com / vendedor@demo.com / admin@demo.com (demo12345)`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
