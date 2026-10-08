import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ClavesJwt } from './claves-jwt';
import { JwtStrategy } from './jwt.strategy';

@Global()
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({})],
  providers: [ClavesJwt, JwtStrategy],
  exports: [ClavesJwt, JwtModule],
})
export class AuthCompartidoModule {}
