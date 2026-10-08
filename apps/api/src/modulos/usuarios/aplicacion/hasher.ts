import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

export abstract class Hasher {
  abstract hash(plano: string): Promise<string>;
  abstract verificar(hash: string, plano: string): Promise<boolean>;
}

@Injectable()
export class HasherArgon2 extends Hasher {
  hash(plano: string) {
    return argon2.hash(plano, { type: argon2.argon2id });
  }

  async verificar(hash: string, plano: string) {
    try {
      return await argon2.verify(hash, plano);
    } catch {
      return false;
    }
  }
}
