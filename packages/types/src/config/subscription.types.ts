interface PlanFeature {
  id: string;
  label: string;
  included: boolean;
  limit?: number;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: Money;
  interval: 'monthly' | 'yearly';
  features: PlanFeature[];
  highlighted: boolean;
  active: boolean;
}
