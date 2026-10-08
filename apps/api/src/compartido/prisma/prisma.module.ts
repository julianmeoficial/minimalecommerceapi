import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { UnidadDeTrabajo, UnidadDeTrabajoPrisma } from './persistencia';

@Global()
@Module({
  providers: [PrismaService, { provide: UnidadDeTrabajo, useClass: UnidadDeTrabajoPrisma }],
  exports: [PrismaService, UnidadDeTrabajo],
})
export class PrismaModule {}
