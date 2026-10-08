import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderStatus } from '@prisma/client';
import { IsEnum, IsIn, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';
import { ConsultaPaginadaDto, PaginaDto } from '../../../../compartido/paginacion/paginacion';

export class CrearPedidoDto {
  @ApiPropertyOptional({ description: 'Dirección guardada del comprador. Si se omite se usa la principal o direccionEnvio.' })
  @IsOptional()
  @IsUUID()
  direccionId?: string;

  @ApiPropertyOptional({ example: 'Calle 10 # 20-30, Bogotá' })
  @IsOptional()
  @IsString()
  @Length(5, 300)
  direccionEnvio?: string;

  @ApiPropertyOptional({ example: 'BIENVENIDA10', description: 'Requiere el módulo cupones activo' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  cupon?: string;
}

export const ESTADOS_VENDEDOR = [OrderStatus.EN_PREPARACION, OrderStatus.ENVIADO, OrderStatus.ENTREGADO, OrderStatus.CANCELADO] as const;

export class CambiarEstadoDto {
  @ApiProperty({ enum: ESTADOS_VENDEDOR, example: OrderStatus.EN_PREPARACION })
  @IsIn(ESTADOS_VENDEDOR)
  estado!: OrderStatus;
}

export class ConsultaPedidosVendedorDto extends ConsultaPaginadaDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  estado?: OrderStatus;
}

export class ItemPedidoDto {
  @ApiProperty() productoId!: string;
  @ApiProperty() vendedorId!: string;
  @ApiProperty() nombre!: string;
  @ApiProperty() cantidad!: number;
  @ApiProperty() precioUnitario!: number;
  @ApiProperty() subtotal!: number;
}

export class PedidoDto {
  @ApiProperty() id!: string;
  @ApiProperty({ enum: OrderStatus }) estado!: OrderStatus;
  @ApiProperty() subtotal!: number;
  @ApiProperty() descuento!: number;
  @ApiProperty() total!: number;
  @ApiProperty() direccionEnvio!: string;
  @ApiProperty({ type: String, nullable: true }) cupon!: string | null;
  @ApiProperty({ type: String, nullable: true }) referenciaPago!: string | null;
  @ApiProperty({ type: String, nullable: true }) motivoCancelacion!: string | null;
  @ApiProperty({ type: String, nullable: true, description: 'Fin de la reserva de existencias mientras el pedido está por pagar' })
  pagarAntesDe!: string | null;
  @ApiProperty({ enum: OrderStatus, isArray: true, description: 'Transiciones que puede ejecutar quien consulta' })
  accionesDisponibles!: OrderStatus[];
  @ApiProperty() creadoEn!: string;
  @ApiProperty() actualizadoEn!: string;
  @ApiProperty({ type: [ItemPedidoDto] }) items!: ItemPedidoDto[];
}

export class PaginaPedidosDto extends PaginaDto {
  @ApiProperty({ type: [PedidoDto] }) contenido!: PedidoDto[];
}
