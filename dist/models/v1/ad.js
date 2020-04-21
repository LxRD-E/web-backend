"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
class Advertisment {
}
__decorate([
    common_1.PropertyType(Number),
    __metadata("design:type", Number)
], Advertisment.prototype, "adId", void 0);
__decorate([
    common_1.PropertyType(String),
    __metadata("design:type", String)
], Advertisment.prototype, "imageUrl", void 0);
__decorate([
    common_1.PropertyType(String),
    __metadata("design:type", String)
], Advertisment.prototype, "title", void 0);
exports.Advertisment = Advertisment;
class ExpandedAdvertismentDetails {
}
exports.ExpandedAdvertismentDetails = ExpandedAdvertismentDetails;
class AdClickResponse {
}
__decorate([
    common_1.PropertyType(String),
    __metadata("design:type", String)
], AdClickResponse.prototype, "url", void 0);
exports.AdClickResponse = AdClickResponse;
class FullAdvertismentDetails {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], FullAdvertismentDetails.prototype, "adId", void 0);
__decorate([
    common_1.AllowTypes('string', 'null'),
    common_1.PropertyType(String),
    swagger_1.Description('This value will be null if moderation has declined the image or it is pending approval'),
    __metadata("design:type", String)
], FullAdvertismentDetails.prototype, "imageUrl", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], FullAdvertismentDetails.prototype, "title", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], FullAdvertismentDetails.prototype, "adType", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], FullAdvertismentDetails.prototype, "adRedirectId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], FullAdvertismentDetails.prototype, "moderationStatus", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], FullAdvertismentDetails.prototype, "userId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], FullAdvertismentDetails.prototype, "bidAmount", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], FullAdvertismentDetails.prototype, "totalBidAmount", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Boolean)
], FullAdvertismentDetails.prototype, "hasRunBefore", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], FullAdvertismentDetails.prototype, "updatedAt", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], FullAdvertismentDetails.prototype, "createdAt", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], FullAdvertismentDetails.prototype, "views", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], FullAdvertismentDetails.prototype, "totalViews", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], FullAdvertismentDetails.prototype, "clicks", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], FullAdvertismentDetails.prototype, "totalClicks", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], FullAdvertismentDetails.prototype, "adDisplayType", void 0);
exports.FullAdvertismentDetails = FullAdvertismentDetails;
//# sourceMappingURL=ad.js.map