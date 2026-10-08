import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiConflictResponse, ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsInt, IsUUID, Max, Min } from 'class-validator';
import { Roles, UsuarioActual } from '../../../compartido/auth/decoradores';
import { UsuarioAutenticado } from '../../../compartido/auth/usuario-autenticado';
import { RespuestaErrorDto } from '../../../compartido/errores/respuesta-error.dto';
import { CarritoService } from '../aplicacion/carrito.service';

class AgregarItemDto {
  @ApiProperty() @IsUUID() productoId!: string;
  @ApiProperty({ example: 1 }) @Type(() => Number) @IsInt() @Min(1) @Max(100) cantidad!: number;
}

class CantidadDto {
  @ApiProperty({ example: 2 }) @Type(() => Number) @IsInt() @Min(1) @Max(100) cantidad!: number;
}

class ItemCarritoDto {
  @ApiProperty() productoId!: string;
  @ApiProperty() nombre!: string;
  @ApiProperty() precioUnitario!: number;
  @ApiProperty() cantidad!: number;
  @ApiProperty() subtotal!: number;
  @ApiProperty() existencias!: number;
  @ApiProperty({ description: 'false si el producto se despublicó o no alcanza el stock' }) disponible!: boolean;
}

class ResumenCarritoDto {
  @ApiProperty({ type: [ItemCarritoDto] }) items!: ItemCarritoDto[];
  @ApiProperty() cantidadItems!: number;
  @ApiProperty() unidades!: number;
  @ApiProperty() subtotal!: number;
  @ApiProperty() comprable!: boolean;
}

/** CU-02 Gestionar carrito. */
@ApiTags('carrito')
@ApiBearerAuth()
@Roles(UserRole.COMPRADOR)
@Controller({ path: 'carrito', version: '1' })
export class CarritoController {
  constructor(private readonly carrito: CarritoService) {}

  @Get()
  @ApiOkResponse({ type: ResumenCarritoDto })
  async ver(@UsuarioActual() u: UsuarioAutenticado): Promise<ResumenCarritoDto> {
    return this.aDto(await this.carrito.resumen(u.userId));
  }

  @Post('items')
  @HttpCode(200)
  @ApiOkResponse({ type: ResumenCarritoDto })
  @ApiConflictResponse({ type: RespuestaErrorDto, description: 'STOCK_INSUFFICIENT' })
  async agregar(@UsuarioActual() u: UsuarioAutenticado, @Body() dto: AgregarItemDto): Promise<ResumenCarritoDto> {
    return this.aDto(await this.carrito.agregar(u.userId, dto.productoId, dto.cantidad));
  }

  @Put('items/:productoId')
  @ApiOkResponse({ type: ResumenCarritoDto })
  async cambiar(
    @UsuarioActual() u: UsuarioAutenticado,
    @Param('productoId', ParseUUIDPipe) productoId: string,
    @Body() dto: CantidadDto,
  ): Promise<ResumenCarritoDto> {
    return this.aDto(await this.carrito.cambiarCantidad(u.userId, productoId, dto.cantidad));
  }

  @Delete('items/:productoId')
  @ApiOkResponse({ type: ResumenCarritoDto })
  async quitar(
    @UsuarioActual() u: UsuarioAutenticado,
    @Param('productoId', ParseUUIDPipe) productoId: string,
  ): Promise<ResumenCarritoDto> {
    return this.aDto(await this.carrito.quitar(u.userId, productoId));
  }

  @Delete()
  @HttpCode(204)
  async vaciar(@UsuarioActual() u: UsuarioAutenticado) {
    await this.carrito.vaciar(u.userId);
  }

  private aDto(r: Awaited<ReturnType<CarritoService['resumen']>>): ResumenCarritoDto {
    return {
      items: r.items.map((i) => ({
        productoId: i.productoId,
        nombre: i.nombre,
        precioUnitario: i.precioUnitario,
        cantidad: i.cantidad,
        subtotal: i.subtotal,
        existencias: i.existencias,
        disponible: i.disponible,
      })),
      cantidadItems: r.cantidadItems,
      unidades: r.unidades,
      subtotal: r.subtotal,
      comprable: r.comprable,
    };
  }
}
