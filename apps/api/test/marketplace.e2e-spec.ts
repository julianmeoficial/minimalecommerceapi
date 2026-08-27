import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/shared/prisma/prisma.service';

describe('Marketplace flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const buyer = {
    name: 'Buyer E2E',
    email: `buyer-${Date.now()}@test.com`,
    password: 'password12345',
    role: 'COMPRADOR',
  };
  const seller = {
    name: 'Seller E2E',
    email: `seller-${Date.now()}@test.com`,
    password: 'password12345',
    role: 'VENDEDOR',
  };

  let buyerToken: string;
  let sellerToken: string;
  let productId: string;
  let categoryId: string;
  let couponCode: string;

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
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers buyer and seller', async () => {
    const b = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(buyer)
      .expect(201);
    buyerToken = b.body.token;

    const s = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(seller)
      .expect(201);
    sellerToken = s.body.token;
  });

  it('rejects unauthenticated cart', async () => {
    await request(app.getHttpServer()).get('/api/v1/cart').expect(401);
  });

  it('seller creates category + product', async () => {
    const cat = await request(app.getHttpServer())
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ name: `Cat-${Date.now()}`, description: 'e2e' })
      .expect(201);
    categoryId = cat.body.id;

    const prod = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        name: 'Producto E2E',
        description: 'desc',
        price: 100,
        stock: 2,
        categoryId,
      })
      .expect(201);
    productId = prod.body.id;
  });

  it('buyer cannot create products (403)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        name: 'Hack',
        price: 1,
        stock: 1,
        categoryId,
      })
      .expect(403);
  });

  it('seller creates coupon', async () => {
    couponCode = `SAVE10${Date.now().toString().slice(-4)}`;
    const startsAt = new Date(Date.now() - 86_400_000).toISOString();
    const expiresAt = new Date(Date.now() + 86_400_000 * 30).toISOString();
    await request(app.getHttpServer())
      .post('/api/v1/coupons')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        code: couponCode,
        type: 'PORCENTAJE',
        value: 10,
        startsAt,
        expiresAt,
        maxUses: 10,
      })
      .expect(201);
  });

  it('checkout with coupon succeeds and decrements stock', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId, quantity: 1 })
      .expect(201);

    const order = await request(app.getHttpServer())
      .post('/api/v1/cart/checkout')
      .set('Authorization', `Bearer ${buyerToken}`)
      .set('Idempotency-Key', `idem-${Date.now()}`)
      .send({ shippingAddress: 'Calle Test 1, Madrid' , couponCode })
      .expect(201);

    expect(order.body.discount).toBe(10);
    expect(order.body.total).toBe(90);
    expect(order.body.status).toBe('PENDIENTE_PAGO');

    const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    expect(product.stock).toBe(1);
  });

  it('rejects insufficient stock', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId, quantity: 5 })
      .expect(400);

    // force cart with available qty then try overselling via parallel path: set stock low
    await prisma.product.update({ where: { id: productId }, data: { stock: 0 } });
    await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId, quantity: 1 })
      .expect(400);

    await prisma.product.update({ where: { id: productId }, data: { stock: 1 } });
  });

  it('rejects invalid coupon', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId, quantity: 1 })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/v1/cart/checkout')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ shippingAddress: 'Calle Test 1', couponCode: 'NOEXISTE' })
      .expect(404);
  });

  it('payment intent + confirm moves order to PAGADO', async () => {
    await request(app.getHttpServer()).delete('/api/v1/cart').set('Authorization', `Bearer ${buyerToken}`);
    await prisma.product.update({ where: { id: productId }, data: { stock: 5 } });
    await request(app.getHttpServer())
      .post('/api/v1/cart/items')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ productId, quantity: 1 })
      .expect(201);

    const order = await request(app.getHttpServer())
      .post('/api/v1/cart/checkout')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ shippingAddress: 'Calle Pago 1' })
      .expect(201);

    const intent = await request(app.getHttpServer())
      .post(`/api/v1/payments/orders/${order.body.id}/intent`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(201);
    expect(intent.body.externalId).toBeTruthy();

    const confirmed = await request(app.getHttpServer())
      .post(`/api/v1/payments/orders/${order.body.id}/confirm`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(201);
    expect(confirmed.body.status).toBe('SUCCEEDED');

    const paid = await request(app.getHttpServer())
      .get(`/api/v1/orders/${order.body.id}`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .expect(200);
    expect(paid.body.status).toBe('PAGADO');
  });
});
