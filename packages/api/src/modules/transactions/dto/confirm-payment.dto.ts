export class ConfirmPaymentDto {
  paymentId: string;
  status: 'confirmed' | 'rejected';
  confirmedBy: string;
}
