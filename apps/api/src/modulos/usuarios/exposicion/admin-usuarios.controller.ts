import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles, UsuarioActual } from '../../../compartido/auth/decoradores';
import { UsuarioAutenticado } from '../../../compartido/auth/usuario-autenticado';
import { construirPagina, PaginaDto } from '../../../compartido/paginacion/paginacion';
import { AdminUsuariosService } from '../aplicacion/admin-usuarios.service';
import { UsuarioDto } from './dto/auth.dto';
import { AdministrarUsuarioDto, ListarUsuariosDto } from './dto/perfil.dto';
import { aUsuarioDto } from './mapeo';

class PaginaUsuariosDto extends PaginaDto {
  @ApiProperty({ type: [UsuarioDto] }) contenido!: UsuarioDto[];
}

/** CU-11 Administrar usuarios. */
@ApiTags('admin / usuarios')
@ApiBearerAuth()
@Roles(UserRole.SUPERADMIN)
@Controller({ path: 'admin/usuarios', version: '1' })
export class AdminUsuariosController {
  constructor(private readonly admin: AdminUsuariosService) {}

  @Get()
  @ApiOkResponse({ type: PaginaUsuariosDto })
  async listar(@Query() q: ListarUsuariosDto): Promise<PaginaUsuariosDto> {
    const [filas, total] = await this.admin.listar({ role: q.rol, q: q.q }, q.pagina, q.tamano);
    return construirPagina(filas.map(aUsuarioDto), total, q.pagina, q.tamano);
  }

  @Patch(':id')
  @ApiOkResponse({ type: UsuarioDto })
  async administrar(
    @UsuarioActual() admin: UsuarioAutenticado,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdministrarUsuarioDto,
  ): Promise<UsuarioDto> {
    return aUsuarioDto(await this.admin.administrar(admin, id, dto));
  }
}
