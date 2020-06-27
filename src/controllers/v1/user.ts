/**
 * Imports
 */
// Interfaces
import * as model from '../../models/models';
// Misc Models
import {filterId} from '../../helpers/Filter';
// Autoload
import {
    BodyParams,
    Controller,
    Delete,
    Get,
    HeaderParams,
    Locals,
    Patch,
    PathParams,
    Post,
    Put,
    QueryParams,
    Req,
    Required,
    Res,
    Status,
    Use
} from '@tsed/common';
import {Description, Returns, ReturnsArray, Summary} from '@tsed/swagger';
import controller from '../controller';
// Middleware
import {YesAuth} from '../../middleware/Auth';
import * as middleware from '../../middleware/middleware';
import {csrf} from '../../dal/auth';
import {RateLimiterMiddleware} from '../../middleware/RateLimit';
import TwoStepMiddleware from '../../middleware/TwoStepCheck';

/**
 * Users Controller
 */
@Controller('/user')
@Description('Endpoints regarding user information')
export class UsersController extends controller {
    constructor() {
        super();
    }

    @Get('/:userId/info')
    @Summary('Get a user\'s info')
    @Returns(200, { type: model.user.UserInfoResponse, description: 'OK' })
    @Returns(400, { type: model.Error, description: 'InvalidUserId: UserId is deleted or invalid\n' })
    public async getInfo(
        @PathParams('userId', Number) id: number
    ) {
        let userInfo;
        try {
            userInfo = await this.user.getInfo(id);
        } catch (e) {
            throw new this.BadRequest('InvalidUserId');
        }
        if (userInfo.accountStatus === model.user.accountStatus.deleted) {
            throw new this.BadRequest('InvalidUserId');
        }
        return userInfo;
    }

    @Get('/username')
    @Summary('Get user info from username')
    @Returns(200, { type: model.user.UserInfoResponse, description: 'OK' })
    @Returns(400, { type: model.Error, description: 'InvalidUsername: Username is deleted or invalid\n' })
    public async getInfoByUsername(
        @Required()
        @QueryParams('username', String) userName: string
    ) {
        let userId;
        let userInfo: model.user.UserInfo;
        try {
            userId = await this.user.userNameToId(userName);
            userInfo = await this.user.getInfo(userId);
        } catch (e) {
            throw new this.BadRequest('InvalidUsername');
        }
        if (userInfo.accountStatus === model.user.accountStatus.deleted) {
            throw new this.BadRequest('InvalidUsername');
        }
        return userInfo;
    }

    @Get('/:userId/avatar')
    @Summary('Get user\'s avatar and avatar colors')
    @Returns(200, { type: model.user.UserAvatarResponse })
    @Returns(400, { type: model.Error, description: 'InvalidUserId: userId is deleted or invalid\n' })
    public async getAvatar(
        @PathParams('userId', Number) id: number
    ) {
        const avatarObjects = await this.user.getAvatar(id);
        const avatarColoring = await this.user.getAvatarColors(id);
        return {
            avatar: avatarObjects,
            color: avatarColoring,
        };
    }

    @Get('/:userId/friends')
    @Summary('Get user friends')
    @Returns(200, { type: model.user.UserFriendsResponse })
    @Returns(400, { type: model.Error, description: 'InvalidSort: Sort must be one of asc,desc\nInvalidUserId: userId is deleted or invalid\n' })
    @Use(middleware.user.ValidateUserId, middleware.ValidatePaging)
    public async getFriends(
        @Required()
        @PathParams('userId', Number) id: number,
        @QueryParams('offset', Number) offset: number = 0,
        @QueryParams('limit', Number) limit: number = 100,
        @QueryParams('sort', String) sort: 'asc' | 'desc' = 'asc',
    ) {
        // Grab Friends
        const friends = await this.user.getFriends(id, offset, limit, sort);
        const totalFriendCount = await this.user.countFriends(id);
        return {
            total: totalFriendCount,
            friends: friends,
        };
    }

    @Get('/names')
    @Summary('Multi-get usernames from IDs')
    @Description('Accepts CSV of userIds. Example: 1,2,3')
    @ReturnsArray(200, { type: model.user.MultiGetUsernames })
    @Returns(400, { type: model.Error, description: 'InvalidIds: One or more of the IDs are non valid 64-bit signed integers\nTooManyIds: Maximum amount of IDs is 25\n' })
    @Use(middleware.ConvertIdsToCsv)
    public async MultiGetNames(
        @Required()
        @QueryParams('ids') ids: number[]
    ) {
        return await this.user.MultiGetNamesFromIds(ids);
    }

    @Get('/forum')
    @Summary('Multi-get user forum information')
    @Description('postCount, permissionLevel, signature...')
    @ReturnsArray(200, { type: model.user.ForumInfo })
    @Returns(400, { type: model.Error, description: 'InvalidIds: One or more of the IDs are non valid 64-bit signed integers\nTooManyIds: Maximum amount of IDs is 25\n' })
    @Use(middleware.ConvertIdsToCsv)
    public async multiGetForumData(
        @QueryParams('ids') ids: number[]
    ) {
        return await this.user.multiGetForumInfo(ids);
    }

    @Get('/:userId/thumbnail')
    @Summary('Get a user\'s thumbnail')
    @Description('If a thumbnail fails to load, success is set to false and placeholder image is provided for url. Requests can fail for many reasons, such as invalid userId or thumbnail not available')
    @Returns(200, { type: model.user.SoloThumbnailResponse })
    public async getSoloThumbnail(
        @PathParams('userId', Number) numericId: number
    ) {
        // Filter User ID
        if (!numericId) {
            return { url: "https://cdn.blockshub.net/thumbnails/d8f9737603db2d077e9c6f2d5bd3eec1db8ff9fc8ef64784a5e4e6580c4519ba.png", success: false };
        }
        const thumbnail = await this.user.getThumbnailByUserId(numericId);
        if (thumbnail && thumbnail.url) {
            return { url: thumbnail.url, success: true };
        } else {
            return { url: "https://cdn.blockshub.net/thumbnails/d8f9737603db2d077e9c6f2d5bd3eec1db8ff9fc8ef64784a5e4e6580c4519ba.png", success: false };
        }
    }

    @Get('/:userId/thumbnail/redirect')
    @Summary('Get a user\'s thumbnail & redirect to it')
    @Description('If an error occurs (invalid userId, thumbnail not available, etc) then a placeholder is returned')
    @Status(302)
    @Returns(302, { description: 'See Location Header for URL of image' })
    public async getSoloThumbnailRedirect(
        @Res() res: Res,
        @PathParams('userId', Number) numericId: number
    ) {
        // Filter User ID
        if (!numericId) {
            return res.redirect("https://cdn.blockshub.net/thumbnails/d8f9737603db2d077e9c6f2d5bd3eec1db8ff9fc8ef64784a5e4e6580c4519ba.png");
        }
        const thumbnail = await this.user.getThumbnailByUserId(numericId);
        if (thumbnail && thumbnail.url) {
            return res.redirect(thumbnail.url);
        } else {
            return res.redirect("https://cdn.blockshub.net/thumbnails/d8f9737603db2d077e9c6f2d5bd3eec1db8ff9fc8ef64784a5e4e6580c4519ba.png");
        }
    }

    @Get('/thumbnails')
    @Summary('Multi-get user thumbnails')
    @Description('Accepts csv of userIds. Example: 1,2,3')
    @Returns(400, { type: model.Error, description: 'InvalidIds: One or more of the IDs are non valid 64-bit signed integers\nTooManyIds: Maximum amount of IDs is 25\n' })
    @ReturnsArray(200, { type: model.user.ThumbnailResponse })
    @Use(middleware.ConvertIdsToCsv)
    public async multiGetThumbnails(
        @QueryParams('ids') ids: number[]
    ) {
        return await this.user.multiGetThumbnailsFromIds(ids);
    }

    @Get('/friend/metadata')
    @Summary('Get friendship metadata')
    @Returns(200, { type: model.user.FriendshipMetadata })
    public getFriendshipMetadata() {
        let metaInfo = new model.user.FriendshipMetadata();
        metaInfo.maxFriendships = model.user.MAX_FRIENDS;
        return metaInfo;
    }

    @Get('/:userId/friend')
    @Summary('Get the friendship status between the authenticated user and another user')
    @Returns(200, { type: model.user.FriendshipStatus })
    @Returns(400, { type: model.Error, description: 'InvalidUserId: UserId is terminated or invalid\n' })
    @Use(YesAuth, middleware.user.ValidateUserId)
    public async getFriendshipStatus(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userId: number
    ) {
        return await this.user.getFriendshipStatus(userInfo.userId, userId);
    }

    @Post('/:userId/friend/request')
    @Summary('Send a friend request to a user')
    @Returns(200, { description: 'Request Sent' })
    @Returns(400, { type: model.Error, description: 'InvalidUserId: UserId is terminated or invalid\nCannotSendRequest: You cannot send a friend request right now\n' })
    @Returns(409, { type: model.Error, description: 'AuthenticatedUserIsAtMaxFriends: Authenticated user is at the maximum amount of friends\nOtherUserIsAtMaxFriends: The user you are trying to friend is at the maximum amount of friends\n' })
    @Use(csrf, YesAuth, middleware.user.ValidateUserId, RateLimiterMiddleware('sendFriendRequest'))
    public async sendFriendRequest(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userId: number
    ) {
        // Check if authenticated user is at max friends 
        let friendCount = await this.user.countFriends(userInfo.userId);
        if (friendCount >= model.user.MAX_FRIENDS) {
            throw new this.Conflict('AuthenticatedUserIsAtMaxFriends');
        }
        // Check if user to send request to is at max friends
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

    @Put('/:userId/friend')
    @Summary('Accept a friend request')
    @Returns(400, { type: model.Error, description: 'InvalidUserId: UserId is terminated or invalid\nNoPendingRequest: There is no friend request to accept\n' })
    @Returns(409, { type: model.Error, description: 'AuthenticatedUserIsAtMaxFriends: Authenticated user is at the maximum amount of friends\nOtherUserIsAtMaxFriends: The user you are trying to friend is at the maximum amount of friends\n' })
    @Use(csrf, YesAuth, middleware.user.ValidateUserId)
    public async acceptFriendRequest(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userId: number
    ) {
        // Check if authenticated user is at max friends 
        let friendCount = await this.user.countFriends(userInfo.userId);
        if (friendCount >= model.user.MAX_FRIENDS) {
            throw new this.Conflict('AuthenticatedUserIsAtMaxFriends');
        }
        // Check if user to send request to is at max friends
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

    @Delete('/:userId/friend')
    @Summary('Delete an existing friendship, delete a requested friendship, or decline a requested friendship')
    @Returns(400, { type: model.Error, description: 'InvalidUserId: UserId is terminated or invalid\nNoPendingRequest: There is no friend request to decline\n' })
    @Use(csrf, YesAuth)
    public async deleteFriendship(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userIdToDecline: number
    ) {
        // Verify user exists
        try {
            await this.user.getInfo(userIdToDecline, ["userId"]);
        } catch (e) {
            throw new this.BadRequest('InvalidUserId');
        }
        if (userIdToDecline === userInfo.userId) {
            throw new this.BadRequest('InvalidUserId');
        }
        let canSend = await this.user.getFriendshipStatus(userInfo.userId, userIdToDecline);
        if (canSend.areFriends || canSend.awaitingAccept) {
            await this.user.deleteFriendship(userInfo.userId, userIdToDecline);
            return { success: true };
        } else {
            canSend = await this.user.getFriendshipStatus(userIdToDecline, userInfo.userId);
            if (canSend.areFriends || canSend.awaitingAccept) {
                await this.user.deleteFriendship(userIdToDecline, userInfo.userId);
                return { success: true };
            }
        }
        throw new this.BadRequest('NoPendingRequest');
    }

    @Get('/:userId/past-usernames')
    @Summary('Get the past usernames of the {userId}')
    @ReturnsArray(200, { type: model.user.PastUsernames })
    @Returns(400, { type: model.Error, description: 'InvalidUserId: UserId is invalid\n' })
    @Use(middleware.user.ValidateUserId)
    public async getPastUsernames(
        @PathParams('userId', Number) userId: number,
    ) {
        return await this.user.getPastUsernames(userId);
    }

    @Get('/:userId/inventory')
    @Summary('Get a user\'s inventory')
    @Returns(400, { type: model.Error, description: 'InvalidUserId: UserId is terminated or invalid\n' })
    @Returns(200, { type: model.user.UserInventoryResponse })
    @Use(middleware.user.ValidateUserId)
    public async getInventory(
        @PathParams('userId', Number) id: number,
        @Required()
        @QueryParams('category', Number) category: number,
        @QueryParams('offset', Number) offset: number = 0,
        @QueryParams('limit', Number) limit: number = 100,
        @QueryParams('sort', String) sort: any = 'asc',
    ) {
        const items = await this.user.getInventory(id, category, offset, limit, sort);
        const totalInventoryCount = await this.user.countInventory(id, category);
        return {
            total: totalInventoryCount,
            items: items,
        };
    }

    @Get('/:userId/inventory/collectibles/count')
    @Summary('Count user collectibles')
    @Returns(400, { type: model.Error, description: 'InvalidUserId: userId is terminated or invalid\n' })
    @Returns(200, { type: model.user.GenericCount })
    @Use(middleware.user.ValidateUserId)
    public async countCollectibleInventory(
        @PathParams('userId', Number) userId: number,
    ): Promise<model.user.GenericCount> {
        const totalInventoryCount = await this.user.countCollectibleInventory(userId);
        return {
            total: totalInventoryCount,
        };
    }

    @Get('/:userId/inventory/collectibles')
    @Summary('Get a user\'s collectible inventory')
    @Description('If query is specified, the sort parameter is ignored.')
    @Returns(400, { type: model.Error, description: 'InvalidUserId: UserId is terminated or invalid\nSearchQueryTooLarge: Search query is too large or otherwise invalid\n' })
    @Returns(200, { type: model.user.UserCollectibleInventoryResponse })
    @Use(middleware.user.ValidateUserId)
    public async getCollectibleInventory(
        @PathParams('userId', Number) id: number,
        @Description('The optional search query. This will be used to search for collectible item names')
        @QueryParams('query', String) query?: string,
        @QueryParams('offset', Number) offset: number = 0,
        @QueryParams('limit', Number) limit: number = 100,
        @QueryParams('sort', String) sort: any = 'asc',
    ): Promise<model.user.UserCollectibleInventoryResponse> {
        // confirm size
        if (query && query.length >= 32) {
            throw new this.BadRequest('SearchQueryTooLarge');
        }
        // Grab items
        let items: model.user.UserCollectibleInventoryResponse;
        if (!query) {
            items = await this.user.getCollectibleInventory(id, offset, limit, sort);
        } else {
            items = await this.user.searchCollectibleInventory(id, query, offset, limit);
        }
        return items;
    }

    @Get('/:userId/owns/:catalogId')
    @Summary('Check if a user owns a Catalog Item. If they do, return the data about the owned items')
    @Returns(400, { type: model.Error, description: 'InvalidUserId: UserId is terminated or invalid\n' })
    @ReturnsArray(200, { type: model.user.UserInventory })
    @Use(middleware.user.ValidateUserId)
    public async getOwnedItemsByCatalogId(
        @PathParams('userId', Number) userId: number,
        @PathParams('catalogId', Number) catalogId: number
    ) {
        return await this.user.getUserInventoryByCatalogId(userId, catalogId);
    }

    @Patch('/market/:userInventoryId')
    @Summary('Sell an item that the authenticated user has permission to sell. If price set to 0, the item will be de-listed')
    @Returns(400, { type: model.Error, description: 'InvalidPrice: Price must be between 0 and 1,000,000\nCannotBeSold: Item cannot be listed for sale\n' })
    @Use(csrf, YesAuth, TwoStepMiddleware('ListItem'))
    public async sellItem(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userInventoryId', Number) userInventoryId: number,
        @Required()
        @BodyParams('price', Number) newPrice: number,
        @HeaderParams('cf-connecting-ip') userIpAddress: string
    ) {
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
        // Log Put-on-sale
        await this.user.logUserIp(userInfo.userId, userIpAddress, model.user.ipAddressActions.PutItemForSale);
        // Success
        return { success: true };
    }

    @Get('/:userId/groups')
    @Summary('Get a user groups')
    @Returns(200, { type: model.user.UserGroupsResponse })
    @Returns(400, { type: model.Error, description: 'InvalidUserId: UserId is terminated or invalid\n' })
    @Use(middleware.user.ValidateUserId)
    public async getGroups(
        @PathParams('userId', Number) userId: number
    ) {
        // Get Groups
        const groups = await this.user.getGroups(userId);
        // Count groups
        const groupCount = await this.user.countGroups(userId);
        // Return results
        return {
            total: groupCount,
            groups: groups,
        };
    }

    @Get('/:userId/groups/:groupId/role')
    @Summary('Get a user\'s role in a group.')
    @Description('Returns guest role if not in group')
    @Returns(200, { type: model.group.roleInfo })
    @Use(middleware.user.ValidateUserId)
    public async getRoleInGroup(
        @PathParams('userId', Number) userId: number,
        @PathParams('groupId', Number) groupId: number
    ) {
        return await this.group.getUserRole(groupId, userId);
    }

    @Get('/search')
    @Summary('Search all users')
    @ReturnsArray(200, { type: model.user.SearchResult })
    @Returns(400, { type: model.Error, description: 'InvalidQuery: Query is too long (over 32 characters)\n' })
    @Use(middleware.ValidatePaging)
    public async search(
        @QueryParams('offset', Number) offset: number = 0,
        @QueryParams('limit', Number) limit: number = 100,
        @QueryParams('sort', String) sort: any = 'asc',
        @QueryParams('sortBy', String) sortBy: string = 'id',
        @QueryParams('username', String) query?: string
    ) {
        let goodSortBy: 'id' | 'user_lastonline';
        if (sortBy === "id") {
            goodSortBy = "id";
        } else {
            goodSortBy = "user_lastonline";
        }
        if (query && query.length > 32) {
            // Query too large
            throw new this.BadRequest('InvalidQuery');
        }
        return await this.user.search(offset, limit, sort, goodSortBy, query);
    }

    @Put('/:userId/trade/request')
    @Summary('Create a trade request')
    @Description('offerItems and requestedItems should both be arrays of userInventoryIds')
    @Returns(400, { type: model.Error, description: 'InvalidUserId: UserId is terminated or invalid\nInvalidItemsSpecified: One or more of the userInventoryId(s) are invalid\nPrimaryRequestTooLarge: Primary Currency Request is too large\nPrimaryOfferTooLarge: Primary Currency offer is too large\n' })
    @Returns(409, { type: model.Error, description: 'CannotTradeWithUser: Authenticated user has trading disabled or partner has trading disabled\nTooManyPendingTrades: You have too many pending trades with this user\nNotEnoughPrimaryCurrencyForOffer: User does not have enough currency for this offer\n' })
    @Use(csrf, YesAuth, TwoStepMiddleware('TradeRequest'))
    public async createTradeRequest(
        @Req() req: Req,
        @Locals('userInfo') userInfo: model.UserSession,
        @Required()
        @Description('The userId to open a trade with')
        @PathParams('userId', Number) partnerUserId: number,
        @Required()
        @BodyParams(model.user.CreateTradeRequest) body: model.user.CreateTradeRequest,
    ) {
        const forUpdate = [
            'users',
            'trade_items',
            'trades',
        ]
        await this.transaction(this, forUpdate,async function (trx) {
            let offerPrimary = 0;
            if (body.offerPrimary) {
                offerPrimary = body.offerPrimary;
            }
            let requestPrimary = 0;
            if (body.requestPrimary) {
                requestPrimary = body.requestPrimary;
            }
            let requestedItems = body.requestedItems;
            let offerItems = body.offerItems;
            const partnerInfo = await trx.user.getInfo(partnerUserId, ['userId', 'accountStatus', 'tradingEnabled']);
            if (partnerInfo.accountStatus === model.user.accountStatus.deleted || partnerInfo.accountStatus === model.user.accountStatus.terminated) {
                throw new this.BadRequest('InvalidUserId');
            }
            // Check offer primary
            if (offerPrimary > userInfo.primaryBalance) {
                throw new this.Conflict('NotEnoughPrimaryCurrencyForOffer');
            }
            // Check total offer
            if (offerPrimary >= 1000000) {
                throw new this.BadRequest('PrimaryOfferTooLarge');
            }
            if (requestPrimary >= 1000000) {
                throw new this.BadRequest('PrimaryRequestTooLarge');
            }
            const localInfo = await trx.user.getInfo(userInfo.userId, ['tradingEnabled']);
            // Check if user has Trading Disabled
            if (localInfo.tradingEnabled === model.user.tradingEnabled.false) {
                throw new this.Conflict('CannotTradeWithUser');
            }
            // Check if Partner has Trading Disabled
            if (partnerInfo.tradingEnabled === model.user.tradingEnabled.false) {
                throw new this.Conflict('CannotTradeWithUser');
            }
            // If partner is current user
            if (partnerInfo.userId === userInfo.userId) {
                throw new this.Conflict('CannotTradeWithUser');
            }
            if (!Array.isArray(requestedItems) || !Array.isArray(offerItems) || offerItems.length < 1 || offerItems.length > 4 || requestedItems.length < 1 || requestedItems.length > 4) {
                throw new this.BadRequest('InvalidItemsSpecified');
            }
            const safeRequestedItems: model.economy.TradeItemObject[] = [];
            // Check Items User is Requesting
            for (const unsafeInventoryId of requestedItems) {
                const userInventoryId = filterId(unsafeInventoryId) as number;
                if (!userInventoryId) {
                    throw new this.BadRequest('InvalidItemsSpecified');
                }
                // Verify item exists and is owned by partner
                const info = await trx.catalog.getItemByUserInventoryId(userInventoryId);
                if (info.userId !== partnerUserId) {
                    // Owned by someone else
                    throw new this.BadRequest('InvalidItemsSpecified');
                }
                if (info.collectible === model.catalog.collectible.false) {
                    // Not collectible
                    throw new this.BadRequest('InvalidItemsSpecified');
                }
                safeRequestedItems.push({
                    'catalogId': info.catalogId,
                    'userInventoryId': userInventoryId,
                });
            }
            const safeRequesteeItems: model.economy.TradeItemObject[] = [];
            // Check Items user is Providing
            for (const unsafeInventoryId of offerItems) {
                const userInventoryId = filterId(unsafeInventoryId) as number;
                if (!userInventoryId) {
                    throw new this.BadRequest('InvalidItemsSpecified');
                }
                // Verify item exists and is owned by authenticated user
                const info = await trx.catalog.getItemByUserInventoryId(userInventoryId);
                if (info.userId !== userInfo.userId) {
                    // Owned by someone else
                    throw new this.BadRequest('InvalidItemsSpecified');
                }
                if (info.collectible === model.catalog.collectible.false) {
                    // Not collectible
                    throw new this.BadRequest('InvalidItemsSpecified');
                }
                safeRequesteeItems.push({
                    'userInventoryId': userInventoryId,
                    'catalogId': info.catalogId,
                });
            }
            // Create Trade
            // Count outbound/inbound trades between users
            const count = await trx.economy.countPendingTradesBetweenUsers(userInfo.userId, partnerUserId);
            // Confirm they aren't spamming trades
            if (count >= 4) {
                throw new this.Conflict('TooManyPendingTrades');
            }
            // Create
            const tradeId = await trx.economy.createTrade(userInfo.userId, partnerUserId, offerPrimary, requestPrimary);
            // Add Requested Items
            await trx.economy.addItemsToTrade(tradeId, model.economy.tradeSides.Requested, safeRequestedItems);
            // Add Self Items
            await trx.economy.addItemsToTrade(tradeId, model.economy.tradeSides.Requester, safeRequesteeItems);
            // Send Message to Partner
            await trx.notification.createMessage(partnerUserId, 1, `Trade Request from ${userInfo.username}`, `Hi,
${userInfo.username} has sent you a new trade request. You can view it in the trades tab.`);
            // Log ip
            let ip = req.ip;
            if (req.headers['cf-connecting-ip']) {
                ip = req.headers['cf-connecting-ip'] as string;
            }
            await trx.user.logUserIp(userInfo.userId, ip, model.user.ipAddressActions.TradeSent);
        });
        // Return Success
        return {
            'success': true,
        };
    }
}