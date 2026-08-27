import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { ConflictError } from '../../shared/errors/api-error';

@Injectable()
export class FeatureFlagsService {
  constructor(private readonly prisma: PrismaService) {}

  async isEnabled(key: string): Promise<boolean> {
    const flag = await this.prisma.featureFlag.findUnique({ where: { key } });
    return flag?.enabled ?? true;
  }

  async requireEnabled(key: string): Promise<void> {
    if (!(await this.isEnabled(key))) {
      throw new ConflictError('FEATURE_DISABLED', `Funcionalidad deshabilitada: ${key}`);
    }
  }

  list() {
    return this.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
  }

  upsert(key: string, enabled: boolean) {
    return this.prisma.featureFlag.upsert({
      where: { key },
      create: { key, enabled },
      update: { enabled },
    });
  }
}
