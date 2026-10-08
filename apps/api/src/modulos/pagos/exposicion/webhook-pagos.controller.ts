import { Controller, Headers, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { Publico } from '../../../compartido/auth/decoradores';
import { CobrosService } from '../aplicacion/cobros.service';

@ApiTags('pagos')
@Publico()
@SkipThrottle()
@Controller({ path: 'pagos/webhook', version: '1' })
export class WebhookPagosController {
  constructor(private readonly cobros: CobrosService) {}

  @Post()
  webhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') firma?: string) {
    const cuerpo = req.rawBody ?? Buffer.from('');
    return this.cobros.procesarWebhook(cuerpo, firma);
  }
}
