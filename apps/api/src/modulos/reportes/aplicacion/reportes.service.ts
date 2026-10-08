import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserRole } from '@prisma/client';
import { UsuarioAutenticado } from '../../../compartido/auth/usuario-autenticado';
import { Prohibido } from '../../../compartido/errores/error-api';
import { EVENTOS } from '../../../compartido/eventos/eventos-pedido';
import type { PedidoPagado } from '../../../compartido/eventos/eventos-pedido';
import { ConsultaProductosService } from '../../catalogo/aplicacion/consulta-productos.service';
import { ConsultaUsuariosService } from '../../usuarios/aplicacion/consulta-usuarios.service';
import { RepositorioMetricas } from '../datos/repositorio-metricas';

@Injectable()
export class ReportesService {
  private readonly logger = new Logger(ReportesService.name);

  constructor(
    private readonly metricas: RepositorioMetricas,
    private readonly usuarios: ConsultaUsuariosService,
    private readonly productos: ConsultaProductosService,
  ) {}

  @OnEvent(EVENTOS.PEDIDO_PAGADO)
  async onPedidoPagado(evento: PedidoPagado) {
    const fecha = new Date(evento.ocurridoEn);
    const porVendedor = new Map<string, { unidades: number; total: number }>();
    for (const linea of evento.lines) {
      const agg = porVendedor.get(linea.sellerId) ?? { unidades: 0, total: 0 };
      agg.unidades += linea.quantity;
      agg.total += linea.quantity * linea.unitPrice;
      porVendedor.set(linea.sellerId, agg);
    }
    for (const [sellerId, agg] of porVendedor) {
      await this.metricas.upsertVenta(sellerId, fecha, agg.unidades, agg.total);
    }
  }

  metricasVendedor(usuario: UsuarioAutenticado, dias = 30) {
    if (usuario.role !== UserRole.VENDEDOR && usuario.role !== UserRole.SUPERADMIN) {
      throw new Prohibido('Solo vendedores consultan métricas propias');
    }
    const hasta = new Date();
    const desde = new Date();
    desde.setDate(desde.getDate() - dias);
    return this.metricas.deVendedor(usuario.userId, desde, hasta);
  }

  async plataforma(usuario: UsuarioAutenticado) {
    if (usuario.role !== UserRole.SUPERADMIN) throw new Prohibido();
    const resumen = await this.metricas.resumenPlataforma();
    const porRol = await this.usuarios.contarPorRol();
    const activos = await this.productos.contarActivos();
    return { ...resumen, productosActivos: activos, usuariosPorRol: porRol };
  }

  ventas(usuario: UsuarioAutenticado, dias = 30) {
    if (usuario.role !== UserRole.SUPERADMIN) throw new Prohibido();
    const hasta = new Date();
    const desde = new Date();
    desde.setDate(desde.getDate() - dias);
    this.logger.log(`Reporte de ventas últimos ${dias} días solicitado por ${usuario.userId}`);
    return this.metricas.deVendedor(usuario.userId, desde, hasta);
  }
}
