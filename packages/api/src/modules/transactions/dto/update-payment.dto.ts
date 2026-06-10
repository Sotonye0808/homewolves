export class UpdatePaymentDto {
  transactionId: string;
  amount: number;
  currency?: string;
  type: 'deposit' | 'installment' | 'commission' | 'final';
  evidenceUrl?: string;
}
