import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Publico } from '../../../compartido/auth/decoradores';
import { RequiereModulo } from '../../registro-modulos/exposicion/requiere-modulo';
import { CuponesService } from '../aplicacion/cupones.service';

@ApiTags('cupones')
@Publico()
@RequiereModulo('cupones')
@Controller({ path: 'cupones', version: '1' })
export class CuponesPublicoController {
  constructor(private readonly cupones: CuponesService) {}

  @Get(':codigo')
  @ApiOkResponse({ description: 'Vista limitada del cupón para validación en checkout' })
  async validar(@Param('codigo') codigo: string) {
    const { cupon, descuento } = await this.cupones.validar(codigo, 100);
    return { codigo: cupon.code, tipo: cupon.type, valor: Number(cupon.value), descuentoEjemplo: descuento };
  }
}
