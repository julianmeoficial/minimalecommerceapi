import { Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { Roles } from '../../../compartido/auth/decoradores';
import { CobrosService } from '../aplicacion/cobros.service';

/** Solo disponible con PAYMENT_PROVIDER=mock y fuera de producción. */
@ApiTags('pagos / simulador')
@ApiBearerAuth()
@Roles(UserRole.SUPERADMIN)
@Controller({ path: 'pagos/simulador/pedidos', version: '1' })
export class SimuladorPagosController {
  private readonly activo: boolean;

  constructor(
    private readonly cobros: CobrosService,
    config: ConfigService,
  ) {
    this.activo = config.get<string>('PAYMENT_PROVIDER') === 'mock' && config.get<string>('NODE_ENV') !== 'production';
  }

  @Post(':id/aprobar')
  aprobar(@Param('id', ParseUUIDPipe) id: string) {
    if (!this.activo) return { omitido: true };
    return this.cobros.simularResultado(id, true);
  }

  @Post(':id/rechazar')
  rechazar(@Param('id', ParseUUIDPipe) id: string) {
    if (!this.activo) return { omitido: true };
    return this.cobros.simularResultado(id, false);
  }
}
