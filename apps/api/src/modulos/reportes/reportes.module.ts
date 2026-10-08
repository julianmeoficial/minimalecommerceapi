import { Module } from '@nestjs/common';
import { CatalogoModule } from '../catalogo/catalogo.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { ReportesService } from './aplicacion/reportes.service';
import { RepositorioMetricas, RepositorioMetricasPrisma } from './datos/repositorio-metricas';
import { ReportesController } from './exposicion/reportes.controller';

@Module({
  imports: [CatalogoModule, UsuariosModule],
  controllers: [ReportesController],
  providers: [ReportesService, { provide: RepositorioMetricas, useClass: RepositorioMetricasPrisma }],
})
export class ReportesModule {}
