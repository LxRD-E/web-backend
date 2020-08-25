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
class UserReferralInfo {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserReferralInfo.prototype, "referralId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserReferralInfo.prototype, "userId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], UserReferralInfo.prototype, "createdAt", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], UserReferralInfo.prototype, "updatedAt", void 0);
exports.UserReferralInfo = UserReferralInfo;
class ExtendedUserReferralInfo extends UserReferralInfo {
}
__decorate([
    common_1.Required(),
    swagger_1.Description('Amount of times the code has been used'),
    __metadata("design:type", Number)
], ExtendedUserReferralInfo.prototype, "uses", void 0);
exports.ExtendedUserReferralInfo = ExtendedUserReferralInfo;
class UserReferralUse {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserReferralUse.prototype, "referralId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserReferralUse.prototype, "userId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], UserReferralUse.prototype, "createdAt", void 0);
class UserReferralUseResult {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Boolean)
], UserReferralUseResult.prototype, "areMoreAvailable", void 0);
__decorate([
    common_1.Required(),
    common_1.PropertyType(UserReferralUse),
    __metadata("design:type", Array)
], UserReferralUseResult.prototype, "data", void 0);
exports.UserReferralUseResult = UserReferralUseResult;
var ContestEntryType;
(function (ContestEntryType) {
    ContestEntryType[ContestEntryType["ReferredBySomeone"] = 1] = "ReferredBySomeone";
    ContestEntryType[ContestEntryType["ReferredSomeone"] = 2] = "ReferredSomeone";
})(ContestEntryType = exports.ContestEntryType || (exports.ContestEntryType = {}));
class UserReferralContestEntry {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Boolean)
], UserReferralContestEntry.prototype, "hasEnteredContest", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Boolean)
], UserReferralContestEntry.prototype, "hasContestEnded", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserReferralContestEntry.prototype, "contestId", void 0);
exports.UserReferralContestEntry = UserReferralContestEntry;

