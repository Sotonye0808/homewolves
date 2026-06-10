export class CreateTransactionDto {
  listingId: string;
  buyerId: string;
  type: 'PURCHASE' | 'RENTAL' | 'SHORTLET';
  customSteps?: { id: string; label: string; order: number }[];
}
