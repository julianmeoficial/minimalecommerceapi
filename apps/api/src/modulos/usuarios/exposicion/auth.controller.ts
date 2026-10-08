import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Publico } from '../../../compartido/auth/decoradores';
import { LimiteCredenciales } from '../../../compartido/auth/limites';
import { RespuestaErrorDto } from '../../../compartido/errores/respuesta-error.dto';
import { AutenticacionService, Sesion } from '../aplicacion/autenticacion.service';
import { IngresoDto, RefrescarDto, RegistroDto, SesionDto } from './dto/auth.dto';
import { aUsuarioDto } from './mapeo';

const aSesionDto = (s: Sesion): SesionDto => ({
  accessToken: s.accessToken,
  refreshToken: s.refreshToken,
  tokenType: 'Bearer',
  expiresIn: s.expiresIn,
  usuario: aUsuarioDto(s.usuario),
});

@ApiTags('auth')
@Publico()
@ApiTooManyRequestsResponse({ type: RespuestaErrorDto })
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly auth: AutenticacionService) {}

  /** CU-06 Registrarse como comprador o vendedor. */
  @LimiteCredenciales()
  @Post('registro')
  @ApiCreatedResponse({ type: SesionDto })
  @ApiConflictResponse({ type: RespuestaErrorDto, description: 'EMAIL_TAKEN' })
  async registro(@Body() dto: RegistroDto): Promise<SesionDto> {
    return aSesionDto(await this.auth.registrar(dto));
  }

  /** CU-07 Ingresar al sistema. */
  @LimiteCredenciales()
  @Post('ingreso')
  @HttpCode(200)
  @ApiOkResponse({ type: SesionDto })
  @ApiUnauthorizedResponse({ type: RespuestaErrorDto, description: 'UNAUTHORIZED' })
  async ingreso(@Body() dto: IngresoDto): Promise<SesionDto> {
    return aSesionDto(await this.auth.ingresar(dto.email, dto.password));
  }

  @LimiteCredenciales()
  @Post('refrescar')
  @HttpCode(200)
  @ApiOkResponse({ type: SesionDto })
  @ApiUnauthorizedResponse({ type: RespuestaErrorDto, description: 'TOKEN_INVALID o REFRESH_REUSED' })
  async refrescar(@Body() dto: RefrescarDto): Promise<SesionDto> {
    return aSesionDto(await this.auth.refrescar(dto.refreshToken));
  }

  @Post('salir')
  @HttpCode(204)
  @ApiNoContentResponse({ description: 'Revoca la familia de sesiones del refresh token' })
  async salir(@Body() dto: RefrescarDto): Promise<void> {
    await this.auth.salir(dto.refreshToken);
  }
}
