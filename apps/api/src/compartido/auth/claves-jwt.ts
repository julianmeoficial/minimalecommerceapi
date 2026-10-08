import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface ClaveJwt {
  kid: string;
  secreto: string;
}

/** Parsea "kid:secreto,kid:secreto". La primera clave es la activa. */
export function parsearClaves(jwtKeys?: string, jwtSecret?: string): ClaveJwt[] {
  if (jwtKeys?.trim()) {
    return jwtKeys.split(',').map((par) => {
      const i = par.indexOf(':');
      if (i <= 0) throw new Error('JWT_KEYS debe tener el formato kid:secreto');
      return { kid: par.slice(0, i).trim(), secreto: par.slice(i + 1).trim() };
    });
  }
  if (jwtSecret) return [{ kid: 'default', secreto: jwtSecret }];
  throw new Error('Configura JWT_KEYS o JWT_SECRET');
}

/**
 * Anillo de claves de firma (RI-03): se firma con la activa y se verifica con cualquiera
 * de las configuradas, de modo que rotar no invalida los tokens vivos firmados con la anterior.
 */
@Injectable()
export class ClavesJwt {
  private readonly claves: ClaveJwt[];

  constructor(config: ConfigService) {
    this.claves = parsearClaves(config.get<string>('JWT_KEYS'), config.get<string>('JWT_SECRET'));
  }

  activa(): ClaveJwt {
    return this.claves[0];
  }

  secretoPara(kid: string | undefined): string | undefined {
    return this.claves.find((c) => c.kid === kid)?.secreto;
  }
}
