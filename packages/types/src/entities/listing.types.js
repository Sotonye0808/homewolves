"use strict";
// ─── ENUMS ───────────────────────────────────────────────────
var ListingCategory;
(function (ListingCategory) {
    ListingCategory["SALE"] = "SALE";
    ListingCategory["RENT"] = "RENT";
    ListingCategory["SHORTLET"] = "SHORTLET";
    ListingCategory["LAND"] = "LAND";
})(ListingCategory || (ListingCategory = {}));
var ListingStatus;
(function (ListingStatus) {
    ListingStatus["DRAFT"] = "DRAFT";
    ListingStatus["PENDING"] = "PENDING";
    ListingStatus["ACTIVE"] = "ACTIVE";
    ListingStatus["SUSPENDED"] = "SUSPENDED";
    ListingStatus["SOLD"] = "SOLD";
    ListingStatus["RENTED"] = "RENTED";
})(ListingStatus || (ListingStatus = {}));
var PropertyType;
(function (PropertyType) {
    PropertyType["APARTMENT"] = "APARTMENT";
    PropertyType["HOUSE"] = "HOUSE";
    PropertyType["DUPLEX"] = "DUPLEX";
    PropertyType["BUNGALOW"] = "BUNGALOW";
    PropertyType["TERRACE"] = "TERRACE";
    PropertyType["SEMI_DETACHED"] = "SEMI_DETACHED";
    PropertyType["DETACHED"] = "DETACHED";
    PropertyType["PENTHOUSE"] = "PENTHOUSE";
    PropertyType["STUDIO"] = "STUDIO";
    PropertyType["COMMERCIAL"] = "COMMERCIAL";
    PropertyType["WAREHOUSE"] = "WAREHOUSE";
    PropertyType["OFFICE"] = "OFFICE";
})(PropertyType || (PropertyType = {}));
// ─── LISTING CLASS ──────────────────────────────────────────
class Listing {
    getShareableLink() {
        return `/properties/${this.id}`;
    }
    isAvailable() {
        return this.status === ListingStatus.ACTIVE;
    }
    getPrimaryImage() {
        return this.media.find(m => m.isPrimary) ?? this.media[0];
    }
}
//# sourceMappingURL=listing.types.js.map