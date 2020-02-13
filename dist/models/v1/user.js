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
const Catalog = require("./catalog");
const Groups = require("./group");
const common_1 = require("@tsed/common");
const swagger_1 = require("@tsed/swagger");
;
class UserInfo {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserInfo.prototype, "userId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], UserInfo.prototype, "username", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserInfo.prototype, "passwordChanged", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserInfo.prototype, "primaryBalance", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserInfo.prototype, "secondaryBalance", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Date)
], UserInfo.prototype, "membership", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Date)
], UserInfo.prototype, "dailyAward", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], UserInfo.prototype, "status", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], UserInfo.prototype, "blurb", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Date)
], UserInfo.prototype, "joinDate", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Date)
], UserInfo.prototype, "lastOnline", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Date)
], UserInfo.prototype, "birthDate", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserInfo.prototype, "theme", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserInfo.prototype, "tradingEnabled", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserInfo.prototype, "staff", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserInfo.prototype, "banned", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserInfo.prototype, "accountStatus", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserInfo.prototype, "forumPostCount", void 0);
__decorate([
    common_1.PropertyType(String),
    __metadata("design:type", String)
], UserInfo.prototype, "forumSignature", void 0);
__decorate([
    common_1.PropertyType(Number),
    __metadata("design:type", Number)
], UserInfo.prototype, "2faEnabled", void 0);
exports.UserInfo = UserInfo;
class UserAvatarItem {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserAvatarItem.prototype, "userId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserAvatarItem.prototype, "catalogId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserAvatarItem.prototype, "type", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], UserAvatarItem.prototype, "date", void 0);
exports.UserAvatarItem = UserAvatarItem;
class UserAvatarColor {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserAvatarColor.prototype, "id", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserAvatarColor.prototype, "userid", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserAvatarColor.prototype, "legr", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserAvatarColor.prototype, "legg", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserAvatarColor.prototype, "legb", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserAvatarColor.prototype, "headr", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserAvatarColor.prototype, "headg", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserAvatarColor.prototype, "headb", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserAvatarColor.prototype, "torsor", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserAvatarColor.prototype, "torsog", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserAvatarColor.prototype, "torsob", void 0);
exports.UserAvatarColor = UserAvatarColor;
class Friendship {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], Friendship.prototype, "userId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], Friendship.prototype, "date", void 0);
__decorate([
    common_1.PropertyType(String),
    __metadata("design:type", String)
], Friendship.prototype, "UserStatus", void 0);
exports.Friendship = Friendship;
class ForumInfo {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], ForumInfo.prototype, "postCount", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], ForumInfo.prototype, "permissionLevel", void 0);
__decorate([
    common_1.PropertyType(String),
    __metadata("design:type", String)
], ForumInfo.prototype, "signature", void 0);
exports.ForumInfo = ForumInfo;
class MultiGetUsernames {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], MultiGetUsernames.prototype, "userId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], MultiGetUsernames.prototype, "username", void 0);
exports.MultiGetUsernames = MultiGetUsernames;
class ThumbnailResponse {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], ThumbnailResponse.prototype, "userId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], ThumbnailResponse.prototype, "url", void 0);
exports.ThumbnailResponse = ThumbnailResponse;
class UserStatus {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserStatus.prototype, "userId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], UserStatus.prototype, "status", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], UserStatus.prototype, "date", void 0);
exports.UserStatus = UserStatus;
class FriendshipStatus {
}
__decorate([
    swagger_1.Description('Are the users friends?'),
    common_1.Required(),
    __metadata("design:type", Boolean)
], FriendshipStatus.prototype, "areFriends", void 0);
__decorate([
    swagger_1.Description('Can you send a friend request to the user?'),
    common_1.Required(),
    __metadata("design:type", Boolean)
], FriendshipStatus.prototype, "canSendFriendRequest", void 0);
__decorate([
    swagger_1.Description('Can a friend request sent from the other user be accepted?'),
    common_1.Required(),
    __metadata("design:type", Boolean)
], FriendshipStatus.prototype, "canAcceptFriendRequest", void 0);
__decorate([
    swagger_1.Description('Are you waiting for the other user to accept your friend request?'),
    common_1.Required(),
    __metadata("design:type", Boolean)
], FriendshipStatus.prototype, "awaitingAccept", void 0);
exports.FriendshipStatus = FriendshipStatus;
class UserInventory {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserInventory.prototype, "userInventoryId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserInventory.prototype, "catalogId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserInventory.prototype, "price", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], UserInventory.prototype, "catalogName", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserInventory.prototype, "collectible", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserInventory.prototype, "category", void 0);
exports.UserInventory = UserInventory;
class UserCollectibleInventory extends UserInventory {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserCollectibleInventory.prototype, "averagePrice", void 0);
exports.UserCollectibleInventory = UserCollectibleInventory;
class UserGroups extends Groups.groupDetails {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", void 0)
], UserGroups.prototype, "groupStatus", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserGroups.prototype, "userId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserGroups.prototype, "userRolesetId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], UserGroups.prototype, "userRolesetName", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserGroups.prototype, "userRolsetRank", void 0);
exports.UserGroups = UserGroups;
var emailVerificationType;
(function (emailVerificationType) {
    emailVerificationType[emailVerificationType["true"] = 1] = "true";
    emailVerificationType[emailVerificationType["false"] = 0] = "false";
})(emailVerificationType = exports.emailVerificationType || (exports.emailVerificationType = {}));
var ipAddressActions;
(function (ipAddressActions) {
    ipAddressActions[ipAddressActions["Login"] = 0] = "Login";
    ipAddressActions[ipAddressActions["SignUp"] = 1] = "SignUp";
    ipAddressActions[ipAddressActions["SignOut"] = 2] = "SignOut";
    ipAddressActions[ipAddressActions["UnsuccessfulLoginWithCompletedCaptcha"] = 3] = "UnsuccessfulLoginWithCompletedCaptcha";
    ipAddressActions[ipAddressActions["UnsuccessfulLoginWithoutCaptcha"] = 4] = "UnsuccessfulLoginWithoutCaptcha";
    ipAddressActions[ipAddressActions["PurchaseOfItem"] = 5] = "PurchaseOfItem";
    ipAddressActions[ipAddressActions["TradeSent"] = 6] = "TradeSent";
    ipAddressActions[ipAddressActions["TradeCompleted"] = 7] = "TradeCompleted";
    ipAddressActions[ipAddressActions["PutItemForSale"] = 8] = "PutItemForSale";
})(ipAddressActions = exports.ipAddressActions || (exports.ipAddressActions = {}));
var banned;
(function (banned) {
    banned[banned["true"] = 1] = "true";
    banned[banned["false"] = 0] = "false";
})(banned = exports.banned || (exports.banned = {}));
var accountStatus;
(function (accountStatus) {
    accountStatus[accountStatus["ok"] = 0] = "ok";
    accountStatus[accountStatus["banned"] = 1] = "banned";
    accountStatus[accountStatus["terminated"] = 2] = "terminated";
    accountStatus[accountStatus["deleted"] = 3] = "deleted";
})(accountStatus = exports.accountStatus || (exports.accountStatus = {}));
var staff;
(function (staff) {
    staff[staff["false"] = 0] = "false";
    staff[staff["Mod"] = 1] = "Mod";
    staff[staff["Admin"] = 2] = "Admin";
    staff[staff["Owner"] = 3] = "Owner";
})(staff = exports.staff || (exports.staff = {}));
var tradingEnabled;
(function (tradingEnabled) {
    tradingEnabled[tradingEnabled["true"] = 1] = "true";
    tradingEnabled[tradingEnabled["false"] = 0] = "false";
})(tradingEnabled = exports.tradingEnabled || (exports.tradingEnabled = {}));
var theme;
(function (theme) {
    theme[theme["Light"] = 0] = "Light";
    theme[theme["Dark"] = 1] = "Dark";
})(theme = exports.theme || (exports.theme = {}));
var banType;
(function (banType) {
    banType[banType["true"] = 1] = "true";
    banType[banType["false"] = 0] = "false";
})(banType = exports.banType || (exports.banType = {}));
class SessionUserInfo {
}
exports.SessionUserInfo = SessionUserInfo;
class UserInfoResponse {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserInfoResponse.prototype, "userId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], UserInfoResponse.prototype, "username", void 0);
__decorate([
    common_1.PropertyType(String),
    __metadata("design:type", String)
], UserInfoResponse.prototype, "status", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], UserInfoResponse.prototype, "joinDate", void 0);
__decorate([
    common_1.PropertyType(String),
    __metadata("design:type", String)
], UserInfoResponse.prototype, "blurb", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], UserInfoResponse.prototype, "lastOnline", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserInfoResponse.prototype, "banned", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], UserInfoResponse.prototype, "membership", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserInfoResponse.prototype, "tradingEnabled", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserInfoResponse.prototype, "staff", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserInfoResponse.prototype, "accountStatus", void 0);
exports.UserInfoResponse = UserInfoResponse;
class UserAvatarResponse {
}
__decorate([
    common_1.Required(),
    common_1.PropertyType(UserAvatarItem),
    __metadata("design:type", Array)
], UserAvatarResponse.prototype, "avatar", void 0);
__decorate([
    common_1.Required(),
    common_1.PropertyType(UserAvatarColor),
    __metadata("design:type", Array)
], UserAvatarResponse.prototype, "color", void 0);
exports.UserAvatarResponse = UserAvatarResponse;
class UserFriendsResponse {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserFriendsResponse.prototype, "total", void 0);
__decorate([
    common_1.Required(),
    common_1.PropertyType(Friendship),
    __metadata("design:type", Array)
], UserFriendsResponse.prototype, "friends", void 0);
exports.UserFriendsResponse = UserFriendsResponse;
class SoloThumbnailResponse {
}
__decorate([
    common_1.Required(),
    swagger_1.Example(true),
    __metadata("design:type", Boolean)
], SoloThumbnailResponse.prototype, "success", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], SoloThumbnailResponse.prototype, "url", void 0);
exports.SoloThumbnailResponse = SoloThumbnailResponse;
class UserInventoryResponse {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserInventoryResponse.prototype, "total", void 0);
__decorate([
    common_1.Required(),
    common_1.PropertyType(UserInventory),
    __metadata("design:type", Array)
], UserInventoryResponse.prototype, "items", void 0);
exports.UserInventoryResponse = UserInventoryResponse;
class UserCollectibleInventoryResponse {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserCollectibleInventoryResponse.prototype, "total", void 0);
__decorate([
    common_1.Required(),
    common_1.PropertyType(UserCollectibleInventory),
    __metadata("design:type", Array)
], UserCollectibleInventoryResponse.prototype, "items", void 0);
exports.UserCollectibleInventoryResponse = UserCollectibleInventoryResponse;
class UserGroupsResponse {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserGroupsResponse.prototype, "total", void 0);
__decorate([
    common_1.Required(),
    common_1.PropertyType(UserGroups),
    __metadata("design:type", Array)
], UserGroupsResponse.prototype, "groups", void 0);
exports.UserGroupsResponse = UserGroupsResponse;
class SearchResult {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], SearchResult.prototype, "userId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], SearchResult.prototype, "username", void 0);
__decorate([
    common_1.PropertyType(String),
    __metadata("design:type", String)
], SearchResult.prototype, "status", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], SearchResult.prototype, "joinDate", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], SearchResult.prototype, "lastOnline", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], SearchResult.prototype, "staff", void 0);
exports.SearchResult = SearchResult;

