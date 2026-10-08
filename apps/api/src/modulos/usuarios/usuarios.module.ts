import { Module } from '@nestjs/common';
import { AdminUsuariosService } from './aplicacion/admin-usuarios.service';
import { AutenticacionService } from './aplicacion/autenticacion.service';
import { ConsultaUsuariosService } from './aplicacion/consulta-usuarios.service';
import { Hasher, HasherArgon2 } from './aplicacion/hasher';
import { PerfilService } from './aplicacion/perfil.service';
import { RepositorioDirecciones, RepositorioDireccionesPrisma } from './datos/repositorio-direcciones';
import { RepositorioRefreshTokens, RepositorioRefreshTokensPrisma } from './datos/repositorio-refresh-tokens';
import { RepositorioUsuarios, RepositorioUsuariosPrisma } from './datos/repositorio-usuarios';
import { AdminUsuariosController } from './exposicion/admin-usuarios.controller';
import { AuthController } from './exposicion/auth.controller';
import { PerfilController } from './exposicion/perfil.controller';

@Module({
  controllers: [AuthController, PerfilController, AdminUsuariosController],
  providers: [
    AutenticacionService,
    PerfilService,
    AdminUsuariosService,
    ConsultaUsuariosService,
    { provide: Hasher, useClass: HasherArgon2 },
    { provide: RepositorioUsuarios, useClass: RepositorioUsuariosPrisma },
    { provide: RepositorioRefreshTokens, useClass: RepositorioRefreshTokensPrisma },
    { provide: RepositorioDirecciones, useClass: RepositorioDireccionesPrisma },
  ],
  exports: [PerfilService, ConsultaUsuariosService],
})
export class UsuariosModule {}
