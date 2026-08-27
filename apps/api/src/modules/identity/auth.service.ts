import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RegisterDto, LoginDto, UpdateProfileDto, AddressDto } from './dto/auth.dto';
import { ApiException, ConflictError, NotFoundError } from '../../shared/errors/api-error';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private toUser(u: { id: string; name: string; email: string; phone: string | null; role: UserRole; active: boolean }) {
    return { id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, active: u.active };
  }

  private tokenFor(user: { id: string; email: string; role: UserRole }) {
    return this.jwt.sign({ sub: user.id, email: user.email, role: user.role });
  }

  async register(dto: RegisterDto) {
    if (dto.role === UserRole.SUPERADMIN) {
      throw new ApiException('INVALID_ROLE', 'No se puede auto-registrar como SUPERADMIN');
    }
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (exists) throw new ConflictError('EMAIL_TAKEN', 'Ya existe una cuenta con ese email');
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        passwordHash: await argon2.hash(dto.password),
        phone: dto.phone,
        role: dto.role,
      },
    });
    return { token: this.tokenFor(user), tokenType: 'Bearer', user: this.toUser(user) };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user || !user.active) throw new ApiException('UNAUTHORIZED', 'Credenciales inválidas', 401);
    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) throw new ApiException('UNAUTHORIZED', 'Credenciales inválidas', 401);
    return { token: this.tokenFor(user), tokenType: 'Bearer', user: this.toUser(user) };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, active: true } });
    if (!user) throw new NotFoundError('usuario', userId);
    return this.toUser(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name ?? undefined,
        phone: dto.phone ?? undefined,
      },
    });
    return this.toUser(user);
  }

  async listAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId, active: true },
      orderBy: [{ primaryAddress: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createAddress(userId: string, dto: AddressDto) {
    if (dto.primaryAddress) {
      await this.prisma.address.updateMany({
        where: { userId, primaryAddress: true },
        data: { primaryAddress: false },
      });
    }
    return this.prisma.address.create({
      data: {
        userId,
        label: dto.label,
        fullAddress: dto.fullAddress,
        city: dto.city,
        postalCode: dto.postalCode,
        phone: dto.phone,
        primaryAddress: !!dto.primaryAddress,
      },
    });
  }

  async deleteAddress(userId: string, id: string) {
    const address = await this.prisma.address.findFirst({ where: { id, userId, active: true } });
    if (!address) throw new NotFoundError('dirección', id);
    await this.prisma.address.update({
      where: { id },
      data: { active: false, primaryAddress: false },
    });
  }
}
