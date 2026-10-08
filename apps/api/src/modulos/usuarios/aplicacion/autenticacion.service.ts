import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '@prisma/client';
import { randomUUID } from 'crypto';
import { ClavesJwt } from '../../../compartido/auth/claves-jwt';
import { CodigoError } from '../../../compartido/errores/codigos-error';
import { Conflicto, ErrorApi, NoAutorizado } from '../../../compartido/errores/error-api';
import { UnidadDeTrabajo } from '../../../compartido/prisma/persistencia';
import { RepositorioRefreshTokens } from '../datos/repositorio-refresh-tokens';
import { RepositorioUsuarios } from '../datos/repositorio-usuarios';
import {
  componerToken,
  duracionASegundos,
  generarSecreto,
  hashSecreto,
  secretoCoincide,
  separarToken,
} from '../dominio/refresh-token';
import { Hasher } from './hasher';

export interface Sesion {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  usuario: User;
}

export interface DatosRegistro {
  nombre: string;
  email: string;
  password: string;
  telefono?: string;
  rol: UserRole;
}

@Injectable()
export class AutenticacionService {
  private readonly logger = new Logger(AutenticacionService.name);
  private readonly accessTtl: string;
  private readonly refreshTtlDias: number;
  /** Se verifica contra este hash cuando el email no existe para no revelar cuentas por tiempo de respuesta. */
  private hashSenuelo?: Promise<string>;

  constructor(
    private readonly usuarios: RepositorioUsuarios,
    private readonly tokens: RepositorioRefreshTokens,
    private readonly hasher: Hasher,
    private readonly jwt: JwtService,
    private readonly claves: ClavesJwt,
    private readonly uow: UnidadDeTrabajo,
    config: ConfigService,
  ) {
    this.accessTtl = config.get<string>('JWT_ACCESS_TTL') ?? '15m';
    this.refreshTtlDias = Number(config.get('JWT_REFRESH_TTL_DIAS') ?? 7);
  }

  async registrar(datos: DatosRegistro): Promise<Sesion> {
    if (datos.rol === UserRole.SUPERADMIN) {
      throw new ErrorApi(CodigoError.INVALID_ROLE, 'No se puede auto-registrar como SUPERADMIN');
    }
    const email = datos.email.toLowerCase();
    if (await this.usuarios.porEmail(email)) {
      throw new Conflicto(CodigoError.EMAIL_TAKEN, 'Ya existe una cuenta con ese email');
    }
    const usuario = await this.usuarios.crear({
      name: datos.nombre,
      email,
      passwordHash: await this.hasher.hash(datos.password),
      phone: datos.telefono,
      role: datos.rol,
    });
    return this.abrirSesion(usuario, randomUUID());
  }

  async ingresar(email: string, password: string): Promise<Sesion> {
    const usuario = await this.usuarios.porEmail(email.toLowerCase());
    this.hashSenuelo ??= this.hasher.hash(randomUUID());
    const valido = await this.hasher.verificar(usuario?.passwordHash ?? (await this.hashSenuelo), password);
    if (!usuario || !valido || !usuario.active) throw new NoAutorizado();
    return this.abrirSesion(usuario, randomUUID());
  }

  /**
   * Rotación con detección de reuso: cada refresh token sirve una sola vez. Si llega
   * uno ya revocado se asume robo y se revoca toda la familia de sesiones.
   */
  async refrescar(token: string): Promise<Sesion> {
    const partes = separarToken(token);
    const registro = partes ? await this.tokens.porId(partes.id) : null;
    if (!partes || !registro || !secretoCoincide(partes.secreto, registro.tokenHash)) {
      throw new NoAutorizado('Refresh token inválido', CodigoError.TOKEN_INVALID);
    }

    if (registro.revokedAt) {
      await this.tokens.revocarFamilia(registro.family);
      this.logger.warn({ userId: registro.userId, family: registro.family }, 'Reuso de refresh token: familia revocada');
      throw new NoAutorizado('Sesión revocada por reuso del token', CodigoError.REFRESH_REUSED);
    }
    if (registro.expiresAt < new Date()) {
      throw new NoAutorizado('Refresh token vencido', CodigoError.TOKEN_INVALID);
    }

    const usuario = await this.usuarios.porId(registro.userId);
    if (!usuario?.active) {
      await this.tokens.revocarFamilia(registro.family);
      throw new NoAutorizado('Usuario inactivo', CodigoError.TOKEN_INVALID);
    }

    return this.uow.ejecutar(async () => {
      const nuevoId = randomUUID();
      if (!(await this.tokens.revocarSiVigente(registro.id, nuevoId))) {
        await this.tokens.revocarFamilia(registro.family);
        throw new NoAutorizado('Sesión revocada por reuso del token', CodigoError.REFRESH_REUSED);
      }
      return this.abrirSesion(usuario, registro.family, nuevoId);
    });
  }

  async salir(token: string): Promise<void> {
    const partes = separarToken(token);
    const registro = partes ? await this.tokens.porId(partes.id) : null;
    if (partes && registro && secretoCoincide(partes.secreto, registro.tokenHash)) {
      await this.tokens.revocarFamilia(registro.family);
    }
  }

  private async abrirSesion(usuario: User, family: string, id = randomUUID()): Promise<Sesion> {
    const clave = this.claves.activa();
    const accessToken = this.jwt.sign(
      { sub: usuario.id, email: usuario.email, role: usuario.role, typ: 'access' },
      { secret: clave.secreto, keyid: clave.kid, expiresIn: duracionASegundos(this.accessTtl), algorithm: 'HS256' },
    );
    const secreto = generarSecreto();
    await this.tokens.crear({
      id,
      userId: usuario.id,
      family,
      tokenHash: hashSecreto(secreto),
      expiresAt: new Date(Date.now() + this.refreshTtlDias * 86_400_000),
    });
    return {
      accessToken,
      refreshToken: componerToken(id, secreto),
      expiresIn: duracionASegundos(this.accessTtl),
      usuario,
    };
  }
}
