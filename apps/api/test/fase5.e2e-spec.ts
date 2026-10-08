import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { OrderStatus, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configurarApp } from '../src/compartido/config/configurar-app';
import { PrismaService } from '../src/compartido/prisma/prisma.service';

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

describe('MinimalShop API — Fase 5 (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let buyerToken: string;
  let sellerToken: string;
  let adminToken: string;
  let sellerEmail: string;
  let categoryId: string;
  let productId: string;
  let orderId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication({ rawBody: true });
    configurarApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    const suffix = uid();
    sellerEmail = `vendedor-${suffix}@e2e.test`;
    const sellerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/registro')
      .send({
        nombre: 'Vendedor E2E',
        email: sellerEmail,
        password: 'password12345',
        rol: 'VENDEDOR',
      })
      .expect(201);
    sellerToken = sellerRes.body.accessToken;

    const buyerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/registro')
      .send({
        nombre: 'Comprador E2E',
        email: `comprador-${suffix}@e2e.test`,
        password: 'password12345',
        rol: 'COMPRADOR',
      })
      .expect(201);
    buyerToken = buyerRes.body.accessToken;

    const adminEmail = `admin-${suffix}@e2e.test`;
    await prisma.user.create({
      data: {
        name: 'Admin E2E',
        email: adminEmail,
        passwordHash: await argon2.hash('password12345'),
        role: UserRole.SUPERADMIN,
      },
    });
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/ingreso')
      .send({ email: adminEmail, password: 'password12345' })
      .expect(200);
    adminToken = adminLogin.body.accessToken;

    const cat = await prisma.category.create({
      data: { name: `E2E-${suffix}`, description: 'Categoría de prueba' },
    });
    categoryId = cat.id;

    const product = await request(app.getHttpServer())
      .post('/api/v1/vendedor/productos')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        nombre: 'Producto E2E',
        descripcion: 'Para checkout',
        precio: 25,
        existencias: 20,
        categoriaId: categoryId,
      })
      .expect(201);
    productId = product.body.id;

    await request(app.getHttpServer())
      .post(`/api/v1/vendedor/productos/${productId}/publicar`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('CU-01 Catálogo', () => {
    it('lista productos paginados', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/catalogo/productos?pagina=0&tamano=10')
        .expect(200);
      expect(Array.isArray(res.body.contenido)).toBe(true);
      expect(res.body).toHaveProperty('totalElementos');
    });

    it('detalle de producto público', async () => {
      const res = await request(app.getHttpServer()).get(`/api/v1/catalogo/productos/${productId}`).expect(200);
      expect(res.body.id).toBe(productId);
    });
  });

  describe('EAC-03 Autorización', () => {
    it('ruta de vendedor sin token → 401', async () => {
      await request(app.getHttpServer()).get('/api/v1/vendedor/productos').expect(401);
    });

    it('comprador no puede crear productos → 403', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/vendedor/productos')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ nombre: 'X', precio: 1, existencias: 1, categoriaId: categoryId })
        .expect(403);
    });
  });

  describe('CU-03 Checkout y CU-04 Pago (simulador mock)', () => {
    it('carrito → pedido con Idempotency-Key → pago → aprobación simulada', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/carrito/items')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({ productoId: productId, cantidad: 2 })
        .expect(200);

      const clave = `checkout-${uid()}`;
      const pedido = await request(app.getHttpServer())
        .post('/api/v1/pedidos')
        .set('Authorization', `Bearer ${buyerToken}`)
        .set('Idempotency-Key', clave)
        .send({ direccionEnvio: 'Calle E2E 1, Bogotá' })
        .expect(201);
      orderId = pedido.body.id;
      expect(pedido.body.estado).toBe('CREADO');

      const repetido = await request(app.getHttpServer())
        .post('/api/v1/pedidos')
        .set('Authorization', `Bearer ${buyerToken}`)
        .set('Idempotency-Key', clave)
        .send({ direccionEnvio: 'Calle E2E 1, Bogotá' })
        .expect(201);
      expect(repetido.body.id).toBe(orderId);

      await request(app.getHttpServer())
        .post(`/api/v1/pagos/pedidos/${orderId}/intento`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/v1/pagos/simulador/pedidos/${orderId}/aprobar`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(201);

      const pago = await request(app.getHttpServer())
        .get(`/api/v1/pagos/pedidos/${orderId}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);
      expect(pago.body.estado).toBe('SUCCEEDED');

      const row = await prisma.order.findUnique({ where: { id: orderId } });
      expect(row?.status).toBe(OrderStatus.PAGADO);
    });
  });

  describe('CU-09 Gestión del vendedor', () => {
    it('avanza el pedido pagado a EN_PREPARACION y ENVIADO', async () => {
      expect(orderId).toBeDefined();

      const login = await request(app.getHttpServer())
        .post('/api/v1/auth/ingreso')
        .send({ email: sellerEmail, password: 'password12345' })
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/api/v1/vendedor/pedidos/${orderId}/estado`)
        .set('Authorization', `Bearer ${login.body.accessToken}`)
        .send({ estado: 'EN_PREPARACION' })
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/api/v1/vendedor/pedidos/${orderId}/estado`)
        .set('Authorization', `Bearer ${login.body.accessToken}`)
        .send({ estado: 'ENVIADO' })
        .expect(200);

      const det = await prisma.order.findUnique({ where: { id: orderId } });
      expect(det?.status).toBe(OrderStatus.ENVIADO);
    });
  });

  it('salud: GET /api/salud/vida', async () => {
    await request(app.getHttpServer()).get('/api/salud/vida').expect(200);
  });
});
