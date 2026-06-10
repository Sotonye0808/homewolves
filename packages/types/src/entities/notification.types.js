"use strict";
// ─── ENUMS ───────────────────────────────────────────────────
var NotificationEvent;
(function (NotificationEvent) {
    NotificationEvent["TRANSACTION_CREATED"] = "TRANSACTION_CREATED";
    NotificationEvent["TRANSACTION_ADVANCED"] = "TRANSACTION_ADVANCED";
    NotificationEvent["TRANSACTION_APPROVED"] = "TRANSACTION_APPROVED";
    NotificationEvent["TRANSACTION_REJECTED"] = "TRANSACTION_REJECTED";
    NotificationEvent["LISTING_CREATED"] = "LISTING_CREATED";
    NotificationEvent["LISTING_APPROVED"] = "LISTING_APPROVED";
    NotificationEvent["LISTING_REJECTED"] = "LISTING_REJECTED";
    NotificationEvent["WISHLIST_INTEREST"] = "WISHLIST_INTEREST";
    NotificationEvent["INSPECTION_SCHEDULED"] = "INSPECTION_SCHEDULED";
    NotificationEvent["MESSAGE_RECEIVED"] = "MESSAGE_RECEIVED";
    NotificationEvent["PRICE_DROP"] = "PRICE_DROP";
    NotificationEvent["NEW_MATCHING_LISTING"] = "NEW_MATCHING_LISTING";
    NotificationEvent["REFERRAL_SIGNUP"] = "REFERRAL_SIGNUP";
    NotificationEvent["COMMISSION_EARNED"] = "COMMISSION_EARNED";
})(NotificationEvent || (NotificationEvent = {}));
var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["PUSH"] = "PUSH";
    NotificationChannel["EMAIL"] = "EMAIL";
    NotificationChannel["SMS"] = "SMS";
    NotificationChannel["WHATSAPP"] = "WHATSAPP";
    NotificationChannel["IN_APP"] = "IN_APP";
})(NotificationChannel || (NotificationChannel = {}));
//# sourceMappingURL=notification.types.js.map