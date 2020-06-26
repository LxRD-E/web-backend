"use strict";
/* istanbul ignore next */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
/* istanbul ignore next */
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
/* istanbul ignore next */
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
/* istanbul ignore next */
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/* istanbul ignore next */
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@tsed/common");
const swagger_1 = require("@tsed/swagger");
var ModerationStatus;
(function (ModerationStatus) {
    ModerationStatus[ModerationStatus["Pending"] = 0] = "Pending";
    ModerationStatus[ModerationStatus["Approved"] = 1] = "Approved";
    ModerationStatus[ModerationStatus["Declined"] = 2] = "Declined";
})(ModerationStatus = exports.ModerationStatus || (exports.ModerationStatus = {}));
var AdType;
(function (AdType) {
    AdType[AdType["CatalogItem"] = 1] = "CatalogItem";
    AdType[AdType["Group"] = 2] = "Group";
    AdType[AdType["ForumThread"] = 3] = "ForumThread";
})(AdType = exports.AdType || (exports.AdType = {}));
var AdDisplayType;
(function (AdDisplayType) {
    AdDisplayType[AdDisplayType["Leaderboard"] = 1] = "Leaderboard";
    AdDisplayType[AdDisplayType["Skyscraper"] = 2] = "Skyscraper";
})(AdDisplayType = exports.AdDisplayType || (exports.AdDisplayType = {}));
class Advertisement {
}
__decorate([
    common_1.PropertyType(Number),
    __metadata("design:type", Number)
], Advertisement.prototype, "adId", void 0);
__decorate([
    common_1.PropertyType(String),
    __metadata("design:type", String)
], Advertisement.prototype, "imageUrl", void 0);
__decorate([
    common_1.PropertyType(String),
    __metadata("design:type", String)
], Advertisement.prototype, "title", void 0);
exports.Advertisement = Advertisement;
class ExpandedAdvertisementDetails {
}
exports.ExpandedAdvertisementDetails = ExpandedAdvertisementDetails;
class AdClickResponse {
}
__decorate([
    common_1.PropertyType(String),
    __metadata("design:type", String)
], AdClickResponse.prototype, "url", void 0);
exports.AdClickResponse = AdClickResponse;
class FullAdvertisementDetails {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], FullAdvertisementDetails.prototype, "adId", void 0);
__decorate([
    common_1.AllowTypes('string', 'null'),
    common_1.PropertyType(String),
    swagger_1.Description('This value will be null if moderation has declined the image or it is pending approval'),
    __metadata("design:type", Object)
], FullAdvertisementDetails.prototype, "imageUrl", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], FullAdvertisementDetails.prototype, "title", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], FullAdvertisementDetails.prototype, "adType", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], FullAdvertisementDetails.prototype, "adRedirectId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], FullAdvertisementDetails.prototype, "moderationStatus", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], FullAdvertisementDetails.prototype, "userId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], FullAdvertisementDetails.prototype, "bidAmount", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], FullAdvertisementDetails.prototype, "totalBidAmount", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Boolean)
], FullAdvertisementDetails.prototype, "hasRunBefore", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], FullAdvertisementDetails.prototype, "updatedAt", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], FullAdvertisementDetails.prototype, "createdAt", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], FullAdvertisementDetails.prototype, "views", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], FullAdvertisementDetails.prototype, "totalViews", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], FullAdvertisementDetails.prototype, "clicks", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], FullAdvertisementDetails.prototype, "totalClicks", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], FullAdvertisementDetails.prototype, "adDisplayType", void 0);
exports.FullAdvertisementDetails = FullAdvertisementDetails;

