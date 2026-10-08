import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { UserRole } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ClavesJwt } from './claves-jwt';
import { UsuarioAutenticado } from './usuario-autenticado';

interface PayloadJwt {
  sub: string;
  email: string;
  role: UserRole;
  typ?: string;
}

function kidDelToken(raw: string): string | undefined {
  try {
    const header = JSON.parse(Buffer.from(raw.split('.')[0], 'base64url').toString('utf8'));
    return typeof header.kid === 'string' ? header.kid : undefined;
  } catch {
    return undefined;
  }
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(claves: ClavesJwt) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['HS256'],
      secretOrKeyProvider: (_req: unknown, raw: string, done: (err: Error | null, secret?: string) => void) => {
        const secreto = claves.secretoPara(kidDelToken(raw));
        if (!secreto) return done(new Error('kid desconocido'));
        done(null, secreto);
      },
    });
  }

  validate(payload: PayloadJwt): UsuarioAutenticado | false {
    if (payload.typ !== 'access') return false;
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
