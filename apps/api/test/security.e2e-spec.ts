import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/shared/prisma/prisma.service';

/**
 * Tests defensivos: comprueban que la API rechaza abusos esperados
 * (401, 403, validación, IDOR). No envían payloads de exploit.
 */
describe('Security posture (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const suffix = Date.now();

  const buyerA = {
    name: 'Buyer A',
    email: `sec-a-${suffix}@test.com`,
    password: 'password12345',
    role: 'COMPRADOR',
  };
  const buyerB = {
    name: 'Buyer B',
    email: `sec-b-${suffix}@test.com`,
    password: 'password12345',
    role: 'COMPRADOR',
  };
  const seller = {
    name: 'Seller Sec',
    email: `sec-s-${suffix}@test.com`,
    password: 'password12345',
    role: 'VENDEDOR',
  };

  let tokenA: string;
  let tokenB: string;
  let tokenSeller: string;
  let productId: string;
  let orderIdA: string;
  let addressIdA: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);

    const a = await request(app.getHttpServer()).post('/api/v1/auth/register').send(buyerA);
    const b = await request(app.getHttpServer()).post('/api/v1/auth/register').send(buyerB);
    const s = await request(app.getHttpServer()).post('/api/v1/auth/register').send(seller);
    tokenA = a.body.token;
    tokenB = b.body.token;
    tokenSeller = s.body.token;

    const cat = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${tokenSeller}`)
      .send({ name: `SecCat-${suffix}` });
    const prod = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${tokenSeller}`)
      .send({
        name: 'Producto Sec',
        description: 'sec',
        price: 50,
        stock: 10,
        categoryId: cat.body.id,
      });
    productId = prod.body.id;
  }, 60_000);

  afterAll(async () => {
    await app.close();
  });

  it('rechaza JWT malformado o vacío en rutas protegidas', async () => {
    await request(app.getHttpServer()).get('/api/v1/me').expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/me')
      .set('Authorization', 'Bearer not-a-jwt')
      .expect(401);
  });

  it('rechaza auto-registro como SUPERADMIN', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Evil',
        email: `sec-admin-${suffix}@test.com`,
        password: 'password12345',
        role: 'SUPERADMIN',
      })
      .expect(400);
    expect(res.body.code).toBe('INVALID_ROLE');
  });

  it('asigna COMPRADOR si el registro no envía role', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Default Role',
        email: `sec-default-${suffix}@test.com`,
        password: 'password12345',
      })
      .expect(201);
    expect(res.body.user.role).toBe('COMPRADOR');
  });

  it('rechaza campos no permitidos (mass assignment)', async () => {
    await request(app.getHttpServer())
      .put('/api/v1/me')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Ok', role: 'SUPERADMIN', passwordHash: 'x' })
      .expect(400);
  });

  it('comprador no puede mutar catálogo (403)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'HackCat' })
      .expect(403);

    await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'Hack', price: 1, stock: 1, categoryId: '00000000-0000-0000-0000-000000000001' })
      .expect(403);
  });

  it('feature-flags exige SUPERADMIN', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/feature-flags')
      .set('Authorization', `Bearer ${tokenSeller}`)
      .expect(403);
    await request(app.getHttpServer()).get('/api/v1/feature-flags').expect(401);
  });

  it('rechaza upload que no es imagen', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/products/${productId}/image`)
      .set('Authorization', `Bearer ${tokenSeller}`)
      .attach('file', Buffer.from('not-an-image'), { filename: 'note.txt', contentType: 'text/plain' })
      .expect(400);
  });

  it('media no resuelve path traversal (basename)', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/media/..%2F..%2Fetc%2Fpasswd')
      .expect(404);
  });

  it('no filtra stack ni SQL en errores de validación', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'no-es-email', password: 'x' })
      .expect(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(JSON.stringify(res.body)).not.toMatch(/prisma|at Object\.|node_modules/i);
  });

  it('IDOR: comprador B no ve ni paga el pedido de A', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ productId, quantity: 1 })
      .expect(201);
    const order = await request(app.getHttpServer())
      .post('/api/v1/cart/checkout')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ shippingAddress: 'Calle A 1' })
      .expect(201);
    orderIdA = order.body.id;

    await request(app.getHttpServer())
      .get(`/api/v1/orders/${orderIdA}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(403);

    await request(app.getHttpServer())
      .post(`/api/v1/payments/orders/${orderIdA}/intent`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(403);
  }, 30_000);

  it('IDOR: comprador B no borra la dirección de A', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/me/addresses')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ label: 'Casa', fullAddress: 'Calle A 1' })
      .expect(201);
    addressIdA = created.body.id;

    await request(app.getHttpServer())
      .delete(`/api/v1/me/addresses/${addressIdA}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);

    const stillThere = await prisma.address.findUniqueOrThrow({ where: { id: addressIdA } });
    expect(stillThere.active).toBe(true);
  }, 15_000);

  it('comprador no puede cambiar estado de pedido (403)', async () => {
    await request(app.getHttpServer())
      .put(`/api/v1/orders/${orderIdA}/status`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: 'ENTREGADO' })
      .expect(403);
  });
});
