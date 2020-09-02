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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const model = require("../../models/models");
const common_1 = require("@tsed/common");
const swagger_1 = require("@tsed/swagger");
const controller_1 = require("../controller");
const Auth_1 = require("../../middleware/Auth");
const middleware = require("../../middleware/middleware");
const auth_1 = require("../../dal/auth");
const RateLimit_1 = require("../../middleware/RateLimit");
const TwoStepCheck_1 = require("../../middleware/TwoStepCheck");
let UsersController = class UsersController extends controller_1.default {
    constructor() {
        super();
    }
    async getInfo(id, info, cols) {
        let userInfo;
        try {
            let columns = undefined;
            if (info && info.staff >= 1 && typeof cols === 'string') {
                columns = cols.split(',').filter(val => { return typeof val === 'string' && val !== 'password' && !!val; });
                if (columns.length === 0) {
                    columns = undefined;
                }
            }
            userInfo = await this.user.getInfo(id, columns);
        }
        catch (e) {
            throw new this.BadRequest('InvalidUserId');
        }
        if (userInfo.accountStatus === model.user.accountStatus.deleted) {
            if (!info || info && info.staff === 0) {
                throw new this.BadRequest('InvalidUserId');
            }
        }
        return userInfo;
    }
    async getInfoByUsername(userName, session) {
        let userId;
        let userInfo;
        try {
            userId = await this.user.userNameToId(userName);
            userInfo = await this.user.getInfo(userId);
            if (session && session.staff >= 1) {
                return userInfo;
            }
        }
        catch (e) {
            throw new this.BadRequest('InvalidUsername');
        }
        if (userInfo.accountStatus === model.user.accountStatus.deleted) {
            throw new this.BadRequest('InvalidUsername');
        }
        return userInfo;
    }
    async getAvatar(id) {
        const avatarObjects = await this.user.getAvatar(id);
        const avatarColoring = await this.user.getAvatarColors(id);
        return {
            avatar: avatarObjects,
            color: avatarColoring,
        };
    }
    async getFriends(id, offset = 0, limit = 100, sort = 'asc') {
        const friends = await this.user.getFriends(id, offset, limit, sort);
        const totalFriendCount = await this.user.countFriends(id);
        return {
            total: totalFriendCount,
            friends: friends,
        };
    }
    async MultiGetNames(ids) {
        return await this.user.MultiGetNamesFromIds(ids);
    }
    async multiGetForumData(ids) {
        return await this.user.multiGetForumInfo(ids);
    }
    async getSoloThumbnail(numericId) {
        if (!numericId) {
            return { url: "https://cdn.blockshub.net/thumbnails/d8f9737603db2d077e9c6f2d5bd3eec1db8ff9fc8ef64784a5e4e6580c4519ba.png", success: false };
        }
        const thumbnail = await this.user.getThumbnailByUserId(numericId);
        if (thumbnail && thumbnail.url) {
            return { url: thumbnail.url, success: true };
        }
        else {
            return { url: "https://cdn.blockshub.net/thumbnails/d8f9737603db2d077e9c6f2d5bd3eec1db8ff9fc8ef64784a5e4e6580c4519ba.png", success: false };
        }
    }
    async getSoloThumbnailRedirect(res, numericId) {
        if (!numericId) {
            return res.redirect("https://cdn.blockshub.net/thumbnails/d8f9737603db2d077e9c6f2d5bd3eec1db8ff9fc8ef64784a5e4e6580c4519ba.png");
        }
        const thumbnail = await this.user.getThumbnailByUserId(numericId);
        if (thumbnail && thumbnail.url) {
            return res.redirect(thumbnail.url);
        }
        else {
            return res.redirect("https://cdn.blockshub.net/thumbnails/d8f9737603db2d077e9c6f2d5bd3eec1db8ff9fc8ef64784a5e4e6580c4519ba.png");
        }
    }
    async multiGetThumbnails(ids) {
        return await this.user.multiGetThumbnailsFromIds(ids);
    }
    getFriendshipMetadata() {
        let metaInfo = new model.user.FriendshipMetadata();
        metaInfo.maxFriendships = model.user.MAX_FRIENDS;
        return metaInfo;
    }
    async getFriendshipStatus(userInfo, userId) {
        return await this.user.getFriendshipStatus(userInfo.userId, userId);
    }
    async sendFriendRequest(userInfo, userId) {
        let friendCount = await this.user.countFriends(userInfo.userId);
        if (friendCount >= model.user.MAX_FRIENDS) {
            throw new this.Conflict('AuthenticatedUserIsAtMaxFriends');
        }
        let friendsCountForOtherUser = await this.user.countFriends(userId);
        if (friendsCountForOtherUser >= model.user.MAX_FRIENDS) {
            throw new this.Conflict('OtherUserIsAtMaxFriends');
        }
        let canSend = await this.user.getFriendshipStatus(userInfo.userId, userId);
        if (canSend.canSendFriendRequest) {
            await this.user.sendFriendRequest(userInfo.userId, userId);
            return { success: true };
        }
        throw new this.BadRequest('CannotSendRequest');
    }
    async acceptFriendRequest(userInfo, userId) {
        let friendCount = await this.user.countFriends(userInfo.userId);
        if (friendCount >= model.user.MAX_FRIENDS) {
            throw new this.Conflict('AuthenticatedUserIsAtMaxFriends');
        }
        let friendsCountForOtherUser = await this.user.countFriends(userId);
        if (friendsCountForOtherUser >= model.user.MAX_FRIENDS) {
            throw new this.Conflict('OtherUserIsAtMaxFriends');
        }
        let canSend = await this.user.getFriendshipStatus(userInfo.userId, userId);
        if (canSend.canAcceptFriendRequest) {
            await this.user.createFriendship(userInfo.userId, userId);
            return { success: true };
        }
        throw new this.BadRequest('NoPendingRequest');
    }
    async deleteFriendship(userInfo, userIdToDecline) {
        try {
            await this.user.getInfo(userIdToDecline, ["userId"]);
        }
        catch (e) {
            throw new this.BadRequest('InvalidUserId');
        }
        if (userIdToDecline === userInfo.userId) {
            throw new this.BadRequest('InvalidUserId');
        }
        let canSend = await this.user.getFriendshipStatus(userInfo.userId, userIdToDecline);
        if (canSend.areFriends || canSend.awaitingAccept) {
            await this.user.deleteFriendship(userInfo.userId, userIdToDecline);
            return { success: true };
        }
        else {
            canSend = await this.user.getFriendshipStatus(userIdToDecline, userInfo.userId);
            if (canSend.areFriends || canSend.awaitingAccept) {
                await this.user.deleteFriendship(userIdToDecline, userInfo.userId);
                return { success: true };
            }
        }
        throw new this.BadRequest('NoPendingRequest');
    }
    async getPastUsernames(userId) {
        return await this.user.getPastUsernames(userId);
    }
    async getInventory(id, category, offset = 0, limit = 100, sort = 'asc') {
        const items = await this.user.getInventory(id, category, offset, limit, sort);
        const totalInventoryCount = await this.user.countInventory(id, category);
        return {
            total: totalInventoryCount,
            items: items,
        };
    }
    async countCollectibleInventory(userId) {
        const totalInventoryCount = await this.user.countCollectibleInventory(userId);
        return {
            total: totalInventoryCount,
        };
    }
    async getCollectibleInventory(id, query, offset = 0, limit = 100, sort = 'asc') {
        if (query && query.length >= 32) {
            throw new this.BadRequest('SearchQueryTooLarge');
        }
        let items;
        if (!query) {
            items = await this.user.getCollectibleInventory(id, offset, limit, sort);
        }
        else {
            items = await this.user.searchCollectibleInventory(id, query, offset, limit);
        }
        return items;
    }
    async getOwnedItemsByCatalogId(userId, catalogId) {
        return await this.user.getUserInventoryByCatalogId(userId, catalogId);
    }
    async sellItem(userInfo, userInventoryId, newPrice, userIpAddress) {
        if (newPrice > 1000000 || newPrice < 0) {
            throw new this.BadRequest('InvalidPrice');
        }
        const inventoryItemData = await this.user.getItemByInventoryId(userInventoryId);
        if (!inventoryItemData) {
            throw new this.BadRequest('CannotBeSold');
        }
        const catalogData = await this.catalog.getInfo(inventoryItemData.catalogId, ['collectible', 'forSale']);
        if (catalogData.collectible !== model.catalog.collectible.true) {
            throw new this.BadRequest('CannotBeSold');
        }
        if (catalogData.forSale !== model.catalog.isForSale.false) {
            throw new this.BadRequest('CannotBeSold');
        }
        if (inventoryItemData.userId !== userInfo.userId) {
            throw new this.BadRequest('CannotBeSold');
        }
        await this.user.editItemPrice(inventoryItemData.userInventoryId, newPrice);
        await this.user.logUserIp(userInfo.userId, userIpAddress, model.user.ipAddressActions.PutItemForSale);
        return { success: true };
    }
    async getGroups(userId) {
        const groups = await this.user.getGroups(userId);
        const groupCount = await this.user.countGroups(userId);
        return {
            total: groupCount,
            groups: groups,
        };
    }
    async getRoleInGroup(userId, groupId) {
        return await this.group.getUserRole(groupId, userId);
    }
    search(offset = 0, limit = 100, sort = 'asc', sortBy = 'id', query) {
        let goodSortBy;
        if (sortBy === "id") {
            goodSortBy = "id";
        }
        else {
            goodSortBy = "user_lastonline";
        }
        if (query && query.length > 32) {
            throw new this.BadRequest('InvalidQuery');
        }
        return this.user.search(offset, limit, sort, goodSortBy, query);
    }
};
__decorate([
    common_1.Get('/:userId/info'),
    swagger_1.Summary('Get a user\'s info'),
    swagger_1.Returns(200, { type: model.user.UserInfoResponse, description: 'OK' }),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidUserId: UserId is deleted or invalid\n' }),
    __param(0, common_1.PathParams('userId', Number)),
    __param(1, common_1.Locals('userInfo')),
    __param(2, common_1.QueryParams('columns', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, model.UserSession, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getInfo", null);
__decorate([
    common_1.Get('/username'),
    swagger_1.Summary('Get user info from username'),
    swagger_1.Returns(200, { type: model.user.UserInfoResponse, description: 'OK' }),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidUsername: Username is deleted or invalid\n' }),
    __param(0, common_1.Required()),
    __param(0, common_1.QueryParams('username', String)),
    __param(1, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, model.UserSession]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getInfoByUsername", null);
__decorate([
    common_1.Get('/:userId/avatar'),
    swagger_1.Summary('Get user\'s avatar and avatar colors'),
    swagger_1.Returns(200, { type: model.user.UserAvatarResponse }),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidUserId: userId is deleted or invalid\n' }),
    __param(0, common_1.PathParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getAvatar", null);
__decorate([
    common_1.Get('/:userId/friends'),
    swagger_1.Summary('Get user friends'),
    swagger_1.Returns(200, { type: model.user.UserFriendsResponse }),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidSort: Sort must be one of asc,desc\nInvalidUserId: userId is deleted or invalid\n' }),
    common_1.Use(middleware.user.ValidateUserId, middleware.ValidatePaging),
    __param(0, common_1.Required()),
    __param(0, common_1.PathParams('userId', Number)),
    __param(1, common_1.QueryParams('offset', Number)),
    __param(2, common_1.QueryParams('limit', Number)),
    __param(3, common_1.QueryParams('sort', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getFriends", null);
__decorate([
    common_1.Get('/names'),
    swagger_1.Summary('Multi-get usernames from IDs'),
    swagger_1.Description('Accepts CSV of userIds. Example: 1,2,3'),
    swagger_1.ReturnsArray(200, { type: model.user.MultiGetUsernames }),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidIds: One or more of the IDs are non valid 64-bit signed integers\nTooManyIds: Maximum amount of IDs is 25\n' }),
    common_1.Use(middleware.ConvertIdsToCsv),
    __param(0, common_1.Required()),
    __param(0, common_1.QueryParams('ids')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "MultiGetNames", null);
__decorate([
    common_1.Get('/forum'),
    swagger_1.Summary('Multi-get user forum information'),
    swagger_1.Description('postCount, permissionLevel, signature...'),
    swagger_1.ReturnsArray(200, { type: model.user.ForumInfo }),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidIds: One or more of the IDs are non valid 64-bit signed integers\nTooManyIds: Maximum amount of IDs is 25\n' }),
    common_1.Use(middleware.ConvertIdsToCsv),
    __param(0, common_1.QueryParams('ids')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "multiGetForumData", null);
__decorate([
    common_1.Get('/:userId/thumbnail'),
    swagger_1.Summary('Get a user\'s thumbnail'),
    swagger_1.Description('If a thumbnail fails to load, success is set to false and placeholder image is provided for url. Requests can fail for many reasons, such as invalid userId or thumbnail not available'),
    swagger_1.Returns(200, { type: model.user.SoloThumbnailResponse }),
    __param(0, common_1.PathParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getSoloThumbnail", null);
__decorate([
    common_1.Get('/:userId/thumbnail/redirect'),
    swagger_1.Summary('Get a user\'s thumbnail & redirect to it'),
    swagger_1.Description('If an error occurs (invalid userId, thumbnail not available, etc) then a placeholder is returned'),
    common_1.Status(302),
    swagger_1.Returns(302, { description: 'See Location Header for URL of image' }),
    __param(0, common_1.Res()),
    __param(1, common_1.PathParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getSoloThumbnailRedirect", null);
__decorate([
    common_1.Get('/thumbnails'),
    swagger_1.Summary('Multi-get user thumbnails'),
    swagger_1.Description('Accepts csv of userIds. Example: 1,2,3'),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidIds: One or more of the IDs are non valid 64-bit signed integers\nTooManyIds: Maximum amount of IDs is 25\n' }),
    swagger_1.ReturnsArray(200, { type: model.user.ThumbnailResponse }),
    common_1.Use(middleware.ConvertIdsToCsv),
    __param(0, common_1.QueryParams('ids')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "multiGetThumbnails", null);
__decorate([
    common_1.Get('/friend/metadata'),
    swagger_1.Summary('Get friendship metadata'),
    swagger_1.Returns(200, { type: model.user.FriendshipMetadata }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getFriendshipMetadata", null);
__decorate([
    common_1.Get('/:userId/friend'),
    swagger_1.Summary('Get the friendship status between the authenticated user and another user'),
    swagger_1.Returns(200, { type: model.user.FriendshipStatus }),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidUserId: UserId is terminated or invalid\n' }),
    common_1.Use(Auth_1.YesAuth, middleware.user.ValidateUserId),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getFriendshipStatus", null);
__decorate([
    common_1.Post('/:userId/friend/request'),
    swagger_1.Summary('Send a friend request to a user'),
    swagger_1.Returns(200, { description: 'Request Sent' }),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidUserId: UserId is terminated or invalid\nCannotSendRequest: You cannot send a friend request right now\n' }),
    swagger_1.Returns(409, { type: model.Error, description: 'AuthenticatedUserIsAtMaxFriends: Authenticated user is at the maximum amount of friends\nOtherUserIsAtMaxFriends: The user you are trying to friend is at the maximum amount of friends\n' }),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.user.ValidateUserId, RateLimit_1.RateLimiterMiddleware('sendFriendRequest')),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "sendFriendRequest", null);
__decorate([
    common_1.Put('/:userId/friend'),
    swagger_1.Summary('Accept a friend request'),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidUserId: UserId is terminated or invalid\nNoPendingRequest: There is no friend request to accept\n' }),
    swagger_1.Returns(409, { type: model.Error, description: 'AuthenticatedUserIsAtMaxFriends: Authenticated user is at the maximum amount of friends\nOtherUserIsAtMaxFriends: The user you are trying to friend is at the maximum amount of friends\n' }),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.user.ValidateUserId),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "acceptFriendRequest", null);
__decorate([
    common_1.Delete('/:userId/friend'),
    swagger_1.Summary('Delete an existing friendship, delete a requested friendship, or decline a requested friendship'),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidUserId: UserId is terminated or invalid\nNoPendingRequest: There is no friend request to decline\n' }),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteFriendship", null);
__decorate([
    common_1.Get('/:userId/past-usernames'),
    swagger_1.Summary('Get the past usernames of the {userId}'),
    swagger_1.ReturnsArray(200, { type: model.user.PastUsernames }),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidUserId: UserId is invalid\n' }),
    common_1.Use(middleware.user.ValidateUserId),
    __param(0, common_1.PathParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getPastUsernames", null);
__decorate([
    common_1.Get('/:userId/inventory'),
    swagger_1.Summary('Get a user\'s inventory'),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidUserId: UserId is terminated or invalid\n' }),
    swagger_1.Returns(200, { type: model.user.UserInventoryResponse }),
    common_1.Use(middleware.user.ValidateUserId),
    __param(0, common_1.PathParams('userId', Number)),
    __param(1, common_1.Required()),
    __param(1, common_1.QueryParams('category', Number)),
    __param(2, common_1.QueryParams('offset', Number)),
    __param(3, common_1.QueryParams('limit', Number)),
    __param(4, common_1.QueryParams('sort', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getInventory", null);
__decorate([
    common_1.Get('/:userId/inventory/collectibles/count'),
    swagger_1.Summary('Count user collectibles'),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidUserId: userId is terminated or invalid\n' }),
    swagger_1.Returns(200, { type: model.user.GenericCount }),
    common_1.Use(middleware.user.ValidateUserId),
    __param(0, common_1.PathParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "countCollectibleInventory", null);
__decorate([
    common_1.Get('/:userId/inventory/collectibles'),
    swagger_1.Summary('Get a user\'s collectible inventory'),
    swagger_1.Description('If query is specified, the sort parameter is ignored.'),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidUserId: UserId is terminated or invalid\nSearchQueryTooLarge: Search query is too large or otherwise invalid\n' }),
    swagger_1.Returns(200, { type: model.user.UserCollectibleInventoryResponse }),
    common_1.Use(middleware.user.ValidateUserId),
    __param(0, common_1.PathParams('userId', Number)),
    __param(1, swagger_1.Description('The optional search query. This will be used to search for collectible item names')),
    __param(1, common_1.QueryParams('query', String)),
    __param(2, common_1.QueryParams('offset', Number)),
    __param(3, common_1.QueryParams('limit', Number)),
    __param(4, common_1.QueryParams('sort', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getCollectibleInventory", null);
__decorate([
    common_1.Get('/:userId/owns/:catalogId'),
    swagger_1.Summary('Check if a user owns a Catalog Item. If they do, return the data about the owned items'),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidUserId: UserId is terminated or invalid\n' }),
    swagger_1.ReturnsArray(200, { type: model.user.UserInventory }),
    common_1.Use(middleware.user.ValidateUserId),
    __param(0, common_1.PathParams('userId', Number)),
    __param(1, common_1.PathParams('catalogId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getOwnedItemsByCatalogId", null);
__decorate([
    common_1.Patch('/market/:userInventoryId'),
    swagger_1.Summary('Sell an item that the authenticated user has permission to sell. If price set to 0, the item will be de-listed'),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidPrice: Price must be between 0 and 1,000,000\nCannotBeSold: Item cannot be listed for sale\n' }),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, TwoStepCheck_1.default('ListItem')),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('userInventoryId', Number)),
    __param(2, common_1.Required()),
    __param(2, common_1.BodyParams('price', Number)),
    __param(3, common_1.HeaderParams('cf-connecting-ip')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "sellItem", null);
__decorate([
    common_1.Get('/:userId/groups'),
    swagger_1.Summary('Get a user groups'),
    swagger_1.Returns(200, { type: model.user.UserGroupsResponse }),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidUserId: UserId is terminated or invalid\n' }),
    common_1.Use(middleware.user.ValidateUserId),
    __param(0, common_1.PathParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getGroups", null);
__decorate([
    common_1.Get('/:userId/groups/:groupId/role'),
    swagger_1.Summary('Get a user\'s role in a group.'),
    swagger_1.Description('Returns guest role if not in group'),
    swagger_1.Returns(200, { type: model.group.roleInfo }),
    common_1.Use(middleware.user.ValidateUserId),
    __param(0, common_1.PathParams('userId', Number)),
    __param(1, common_1.PathParams('groupId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getRoleInGroup", null);
__decorate([
    common_1.Get('/search'),
    swagger_1.Summary('Search all users'),
    swagger_1.ReturnsArray(200, { type: model.user.SearchResult }),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidQuery: Query is too long (over 32 characters)\n' }),
    common_1.Use(middleware.ValidatePaging),
    __param(0, common_1.QueryParams('offset', Number)),
    __param(1, common_1.QueryParams('limit', Number)),
    __param(2, common_1.QueryParams('sort', String)),
    __param(3, common_1.QueryParams('sortBy', String)),
    __param(4, common_1.QueryParams('username', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Object, String, String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "search", null);
UsersController = __decorate([
    common_1.Controller('/user'),
    swagger_1.Description('Endpoints regarding user information'),
    __metadata("design:paramtypes", [])
], UsersController);
exports.UsersController = UsersController;

