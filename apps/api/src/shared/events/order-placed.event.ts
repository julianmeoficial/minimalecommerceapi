export class OrderPlacedEvent {
  constructor(
    public readonly orderId: string,
    public readonly buyerId: string,
    public readonly total: string,
    public readonly couponCode: string | null,
    public readonly lines: Array<{
      productId: string;
      sellerId: string;
      quantity: number;
      unitPrice: string;
    }>,
  ) {}
}
