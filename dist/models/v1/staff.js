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
var Permission;
(function (Permission) {
    Permission[Permission["BanUser"] = 1] = "BanUser";
    Permission[Permission["UnbanUser"] = 2] = "UnbanUser";
    Permission[Permission["ManageGroup"] = 3] = "ManageGroup";
    Permission[Permission["ViewEmail"] = 4] = "ViewEmail";
    Permission[Permission["ViewPaymentInformation"] = 5] = "ViewPaymentInformation";
    Permission[Permission["ManageStaff"] = 6] = "ManageStaff";
    Permission[Permission["ImpersonateUser"] = 7] = "ImpersonateUser";
    Permission[Permission["ManageSupportTickets"] = 8] = "ManageSupportTickets";
    Permission[Permission["ReviewPendingItems"] = 9] = "ReviewPendingItems";
    Permission[Permission["ReviewAbuseReports"] = 10] = "ReviewAbuseReports";
    Permission[Permission["ReviewUserInformation"] = 11] = "ReviewUserInformation";
    Permission[Permission["UploadStaffAssets"] = 12] = "UploadStaffAssets";
    Permission[Permission["ManageSelf"] = 13] = "ManageSelf";
    Permission[Permission["ResetPassword"] = 14] = "ResetPassword";
    Permission[Permission["GiveItemToUser"] = 15] = "GiveItemToUser";
    Permission[Permission["GiveCurrencyToUser"] = 16] = "GiveCurrencyToUser";
    Permission[Permission["TakeItemFromUser"] = 17] = "TakeItemFromUser";
    Permission[Permission["TakeCurrencyFromUser"] = 18] = "TakeCurrencyFromUser";
    Permission[Permission["ManageAssets"] = 19] = "ManageAssets";
    Permission[Permission["RegenerateThumbnails"] = 20] = "RegenerateThumbnails";
    Permission[Permission["ManageBanner"] = 21] = "ManageBanner";
    Permission[Permission["ManagePublicUserInfo"] = 22] = "ManagePublicUserInfo";
    Permission[Permission["ManagePrivateUserInfo"] = 23] = "ManagePrivateUserInfo";
    Permission[Permission["ManageWeb"] = 24] = "ManageWeb";
    Permission[Permission["ManageGameServer"] = 25] = "ManageGameServer";
    Permission[Permission["ManageGameClient"] = 26] = "ManageGameClient";
    Permission[Permission["ManageForumCategories"] = 27] = "ManageForumCategories";
    Permission[Permission["ManageCurrencyProducts"] = 28] = "ManageCurrencyProducts";
})(Permission = exports.Permission || (exports.Permission = {}));
var ReasonForAssociation;
(function (ReasonForAssociation) {
    ReasonForAssociation[ReasonForAssociation["SameIpaddress"] = 1] = "SameIpaddress";
    ReasonForAssociation[ReasonForAssociation["SameEmail"] = 2] = "SameEmail";
    ReasonForAssociation[ReasonForAssociation["SameBillingEmail"] = 3] = "SameBillingEmail";
})(ReasonForAssociation = exports.ReasonForAssociation || (exports.ReasonForAssociation = {}));
class TransferItemsRequest {
}
__decorate([
    common_1.Required(),
    swagger_1.Description('The userId that the items are expected to be owned by'),
    common_1.Default(50),
    __metadata("design:type", Number)
], TransferItemsRequest.prototype, "userIdFrom", void 0);
__decorate([
    common_1.Required(),
    swagger_1.Description('The userId to transfer the item(s) from'),
    __metadata("design:type", Number)
], TransferItemsRequest.prototype, "userIdTo", void 0);
__decorate([
    common_1.Required(),
    common_1.PropertyType(Number),
    common_1.MinItems(1),
    common_1.MaxItems(100),
    swagger_1.Description('An array of {userInventoryId} to transfer'),
    __metadata("design:type", Array)
], TransferItemsRequest.prototype, "userInventoryIds", void 0);
exports.TransferItemsRequest = TransferItemsRequest;
class ProvideItemsEntry {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], ProvideItemsEntry.prototype, "catalogId", void 0);
exports.ProvideItemsEntry = ProvideItemsEntry;
class ProvideItemsRequest {
}
__decorate([
    common_1.Required(),
    swagger_1.Description('userId to give the items to'),
    __metadata("design:type", Number)
], ProvideItemsRequest.prototype, "userIdTo", void 0);
__decorate([
    common_1.Required(),
    swagger_1.Description('An array of {catalogId} to transfer to the user'),
    common_1.PropertyType(ProvideItemsEntry),
    common_1.MinItems(1),
    common_1.MaxItems(1000),
    __metadata("design:type", Array)
], ProvideItemsRequest.prototype, "catalogIds", void 0);
exports.ProvideItemsRequest = ProvideItemsRequest;
class SearchUsersResponse {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], SearchUsersResponse.prototype, "username", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], SearchUsersResponse.prototype, "userId", void 0);
exports.SearchUsersResponse = SearchUsersResponse;
exports.UserLeadboardSortOptions = [
    "PrimaryCurrencyDesc",
    "SecondaryCurrencyDesc",
    "UserIdAsc",
    'LastOnlineAsc',
    'LastOnlineDesc',
];
exports.UserLeaderboardAccountStatus = [
    'all',
    'ok',
    'banned',
    'terminated',
    'deleted',
];
class ModerationCurrencyEntry {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], ModerationCurrencyEntry.prototype, "moderationCurrencyId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], ModerationCurrencyEntry.prototype, "userIdGiver", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], ModerationCurrencyEntry.prototype, "userIdReceiver", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], ModerationCurrencyEntry.prototype, "amount", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], ModerationCurrencyEntry.prototype, "currency", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], ModerationCurrencyEntry.prototype, "date", void 0);
exports.ModerationCurrencyEntry = ModerationCurrencyEntry;

