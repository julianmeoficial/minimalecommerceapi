import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { CodigoError } from '../../../compartido/errores/codigos-error';
import { Conflicto } from '../../../compartido/errores/error-api';
import { RepositorioModulos } from '../datos/repositorio-modulos';
import { ClaveModulo, MODULOS_ACTIVABLES } from '../dominio/modulos';

const TTL_MS = 10_000;
const claveCache = (m: ClaveModulo) => `modulos:${m}`;

/**
 * Registro de módulos activables (EAC-05). El estado vive en Postgres y se cachea en
 * Redis compartido para que todas las instancias vean el cambio sin redespliegue.
 */
@Injectable()
export class RegistroModulosService {
  constructor(
    private readonly repo: RepositorioModulos,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async estaActivo(modulo: ClaveModulo): Promise<boolean> {
    const cacheado = await this.cache.get<boolean>(claveCache(modulo));
    if (cacheado !== undefined && cacheado !== null) return cacheado;
    const estado = await this.repo.buscar(modulo);
    const activo = estado?.activo ?? true;
    await this.cache.set(claveCache(modulo), activo, TTL_MS);
    return activo;
  }

  async exigirActivo(modulo: ClaveModulo): Promise<void> {
    if (!(await this.estaActivo(modulo))) {
      throw new Conflicto(CodigoError.MODULE_DISABLED, `El módulo "${modulo}" está desactivado`);
    }
  }

  async listar() {
    const guardados = new Map((await this.repo.listar()).map((m) => [m.clave, m]));
    return MODULOS_ACTIVABLES.map((clave) => ({
      clave,
      activo: guardados.get(clave)?.activo ?? true,
      actualizadoEn: guardados.get(clave)?.actualizadoEn ?? null,
    }));
  }

  async cambiar(modulo: ClaveModulo, activo: boolean) {
    const estado = await this.repo.guardar(modulo, activo);
    await this.cache.del(claveCache(modulo));
    return estado;
  }
}
