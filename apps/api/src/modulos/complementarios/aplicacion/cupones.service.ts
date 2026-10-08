import { Injectable } from '@nestjs/common';
import { Coupon } from '@prisma/client';
import { UsuarioAutenticado } from '../../../compartido/auth/usuario-autenticado';
import { CodigoError } from '../../../compartido/errores/codigos-error';
import { Conflicto, ErrorApi, NoEncontrado } from '../../../compartido/errores/error-api';
import { RegistroModulosService } from '../../registro-modulos/aplicacion/registro-modulos.service';
import { NuevoCupon, RepositorioCupones } from '../datos/repositorio-cupones';
import { calcularDescuento, exigirVigente, normalizarCodigo } from '../dominio/cupon';

export interface CuponCanjeado {
  id: string;
  codigo: string;
  descuento: number;
}

@Injectable()
export class CuponesService {
  constructor(
    private readonly repo: RepositorioCupones,
    private readonly registro: RegistroModulosService,
  ) {}

  async crear(usuario: UsuarioAutenticado, datos: Omit<NuevoCupon, 'creatorId'>): Promise<Coupon> {
    if (datos.expiresAt <= datos.startsAt) {
      throw new ErrorApi(CodigoError.VALIDATION_ERROR, 'La fecha de fin debe ser posterior a la de inicio', 400, ['venceEn']);
    }
    const code = normalizarCodigo(datos.code);
    if (await this.repo.porCodigo(code)) throw new Conflicto(CodigoError.CONFLICT, 'Ya existe un cupón con ese código');
    return this.repo.crear({ ...datos, code, creatorId: usuario.userId });
  }

  misCupones(usuario: UsuarioAutenticado, pagina: number, tamano: number) {
    return this.repo.deCreador(usuario.userId, pagina * tamano, tamano);
  }

  async validar(codigo: string, subtotal: number): Promise<{ cupon: Coupon; descuento: number }> {
    const cupon = await this.repo.porCodigo(normalizarCodigo(codigo));
    if (!cupon) throw new NoEncontrado('cupón', normalizarCodigo(codigo));
    exigirVigente({ ...cupon, value: Number(cupon.value) });
    return { cupon, descuento: calcularDescuento(cupon.type, Number(cupon.value), subtotal) };
  }

  /**
   * Usado por Pedidos dentro de la transacción del checkout. Si el módulo está apagado se
   * rechaza la compra con MODULE_DISABLED y el carrito queda intacto (RI-05): el cupón nunca
   * se guarda en el carrito, así que no hay datos en curso que limpiar.
   */
  async canjear(codigo: string, subtotal: number): Promise<CuponCanjeado> {
    await this.registro.exigirActivo('cupones');
    const { cupon, descuento } = await this.validar(codigo, subtotal);
    if (!(await this.repo.consumirUso(cupon.id))) {
      throw new Conflicto(CodigoError.COUPON_EXHAUSTED, 'El cupón agotó sus usos');
    }
    return { id: cupon.id, codigo: cupon.code, descuento };
  }

  devolverUso(cuponId: string): Promise<void> {
    return this.repo.devolverUso(cuponId);
  }
}
