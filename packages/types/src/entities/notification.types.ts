// ─── ENUMS ───────────────────────────────────────────────────

enum NotificationEvent {
  TRANSACTION_CREATED = 'TRANSACTION_CREATED',
  TRANSACTION_ADVANCED = 'TRANSACTION_ADVANCED',
  TRANSACTION_APPROVED = 'TRANSACTION_APPROVED',
  TRANSACTION_REJECTED = 'TRANSACTION_REJECTED',
  LISTING_CREATED = 'LISTING_CREATED',
  LISTING_APPROVED = 'LISTING_APPROVED',
  LISTING_REJECTED = 'LISTING_REJECTED',
  WISHLIST_INTEREST = 'WISHLIST_INTEREST',
  INSPECTION_SCHEDULED = 'INSPECTION_SCHEDULED',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  PRICE_DROP = 'PRICE_DROP',
  NEW_MATCHING_LISTING = 'NEW_MATCHING_LISTING',
  REFERRAL_SIGNUP = 'REFERRAL_SIGNUP',
  COMMISSION_EARNED = 'COMMISSION_EARNED',
}

enum NotificationChannel {
  PUSH = 'PUSH',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  IN_APP = 'IN_APP',
}

// ─── INTERFACES ─────────────────────────────────────────────

interface RecipientRule {
  role?: string;
  userId?: string;
  relation?: 'owner' | 'agent' | 'buyer' | 'admin';
}

interface NotificationTemplate {
  id: string;
  event: NotificationEvent;
  channels: NotificationChannel[];
  subject: string;
  body: string;
  recipients: RecipientRule[];
  active: boolean;
}
