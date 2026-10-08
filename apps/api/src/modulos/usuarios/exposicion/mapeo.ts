import { Address, User } from '@prisma/client';
import { DireccionRespuestaDto } from './dto/perfil.dto';
import { UsuarioDto } from './dto/auth.dto';

export function aUsuarioDto(u: User): UsuarioDto {
  return { id: u.id, nombre: u.name, email: u.email, telefono: u.phone, rol: u.role, activo: u.active };
}

export function aDireccionDto(a: Address): DireccionRespuestaDto {
  return {
    id: a.id,
    etiqueta: a.label,
    direccion: a.fullAddress,
    ciudad: a.city,
    codigoPostal: a.postalCode,
    telefono: a.phone,
    principal: a.primaryAddress,
  };
}
