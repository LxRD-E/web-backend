/**
 * Imports
 */
// Express
import moment = require('moment');
import crypto = require('crypto');
// Interfaces
import * as model from '../../models/models';
// Misc Models
import {filterId, filterOffset} from '../../helpers/Filter';
// middleware
import * as middleware from '../../middleware/middleware';
// Autoload
import controller from '../controller';
import {
    BodyParams,
    Controller,
    Delete,
    Get,
    Locals,
    Patch,
    PathParams,
    Post,
    Put,
    QueryParams, Req,
    Required, Res, Session,
    Use,
    UseBeforeEach
} from '@tsed/common';
import {Description, Returns, ReturnsArray, Summary} from '@tsed/swagger';
import {YesAuth} from '../../middleware/Auth';
import {csrf} from '../../dal/auth';

/**
 * Staff Controller
 */
@Controller('/staff')
export class StaffController extends controller {
    constructor() {
        super();
    }

    @Get('/permissions')
    @Summary('Get all permissions')
    public getPermissions() {
        return model.staff.Permission;
    }

    @Get('/permissions/:userId')
    @Summary('Get permissions for the {userId}')
    @Use(YesAuth, middleware.staff.validate(0))
    public async getPermissionsForUserId(
        @PathParams('userId', Number) userId: number,
    ) {
        let allPermissions = await this.staff.getPermissions(userId);
        let permissionsObject: any = {};
        for (const perm of allPermissions) {
            permissionsObject[perm] = model.staff.Permission[perm];
            permissionsObject[model.staff.Permission[perm]] = perm;
        }
        return permissionsObject;
    }

    @Put('/permissions/:userId/:permission')
    @Summary('Give a permission to the {userId}')
    @Use(YesAuth, csrf, middleware.staff.validate(model.staff.Permission.ManageStaff))
    public async setPermissionForUserId(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @PathParams('userId', Number) userId: number,
        @Required()
        @PathParams('permission', String) permission: string,
    ) {
        if (userInfo.userId === userId) {
            let isOk = await this.staff.getPermissions(userId);
            if (isOk.includes(model.staff.Permission.ManageSelf) || userInfo.staff >= 100) {
                // Ok
            }else{
                // Bad
                throw new this.Conflict('InvalidPermissions');
            }
        }
        let permissionId: number = (model.staff.Permission[permission as any] as any);

        if (!permissionId) {
            throw new this.BadRequest('InvalidPermissionId');
        }
        await this.staff.addPermissions(userId, permissionId);
        return {};
    }

    @Delete('/permissions/:userId/:permission')
    @Summary('Remove a permission from the {userId}')
    @Use(YesAuth, csrf, middleware.staff.validate(model.staff.Permission.ManageStaff))
    public async deletePermissionForUserId(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @PathParams('userId', Number) userId: number,
        @Required()
        @PathParams('permission', String) permission: string,
    ) {
        if (userInfo.userId === userId) {
            let isOk = await this.staff.getPermissions(userId);
            if (isOk.includes(model.staff.Permission.ManageSelf) || userInfo.staff >= 100) {
                // Ok
            }else{
                // Bad
                throw new this.Conflict('InvalidPermissions');
            }
        }
        let permissionId: number = (model.staff.Permission[permission as any] as any);

        if (!permissionId) {
            throw new this.BadRequest('InvalidPermissionId');
        }
        console.log('deleted',permissionId);
        await this.staff.deletePermissions(userId, permissionId);
        return {};
    }

    @Get('/user/:userId/transactions')
    @Summary('Get transaction history for the {userId}')
    @Use(YesAuth, middleware.staff.validate(model.staff.Permission.ReviewUserInformation))
    @ReturnsArray(200, {type: model.economy.userTransactions})
    public async getTransactions(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @QueryParams('offset', Number) offset: number = 0,
        @PathParams('userId', Number) userId: number,
    ): Promise<model.economy.userTransactions[]> {
        return await this.economy.getUserTransactions(userId, offset);
    }

    @Post('/user/:userId/ban')
    @Summary('Ban a user')
    @Use(csrf, YesAuth, middleware.staff.validate(model.staff.Permission.BanUser))
    public async ban(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userId: number,
        @BodyParams('reason', String) reason: string,
        @BodyParams('privateReason', String) privateReason: string,
        @BodyParams('length', String) length: string,
        @BodyParams('lengthType', String) lengthType: string,
        @BodyParams('terminated', String) terminated: string,
        @BodyParams('deleted', String) deleted: string,
    ) {
        // Verify id
        const numericId = filterId(userId) as number;
        if (!numericId) {
            throw new this.BadRequest('InvalidUserId');
        }
        // Verify Exists
        try {
            const info = await this.user.getInfo(numericId, ['userId', 'accountStatus', 'staff']);
            if (info.staff >= userInfo.staff) {
                throw false; // cannot ban users at this staff level
            }
        } catch (e) {
            throw new this.BadRequest('InvalidUserId');
        }
        // Verify Reason
        if (!reason || reason.length > 255) {
            throw new this.BadRequest('InvalidReason');
        }
        if (!privateReason) {
            privateReason = "";
        }
        let numericLength = filterId(length) as number;
        if (!numericLength) {
            numericLength = 0;
        }
        if (lengthType !== "hours" && lengthType !== "days" && lengthType !== "months" && lengthType !== "weeks") {
            throw new this.BadRequest('InvalidLengthType');
        }
        // Add unban time
        const whenWillUserBeUnBanned = moment().add(numericLength, lengthType).format();
        // Is user going to be terminated?
        let numericTerminated = filterId(terminated) as number;
        if (!numericTerminated) {
            numericTerminated = 0;
        } else {
            numericTerminated = 1;
        }
        // Is user going to be deleted?
        let numericDeleted = filterId(deleted) as number;
        if (!numericDeleted) {
            numericDeleted = 0;
        } else {
            numericDeleted = 1;
        }
        if (privateReason.length > 1024) {
            throw new this.BadRequest('InvalidPrivateReason');
        }
        // One last check
        if (numericDeleted === 1 && numericTerminated === 0) {
            throw new this.BadRequest('ConstraintIfDeletedUserMustAlsoBeTerminated')
        }
        // Ban
        // Ban User
        await this.user.modifyUserBanStatus(numericId, model.user.banned.true);
        // Add Ban Message
        await this.staff.insertBan(numericId, reason, privateReason, whenWillUserBeUnBanned, numericTerminated, userInfo.userId);
        // If account should be deleted...
        if (numericDeleted) {
            // Delete Account
            await this.user.modifyAccountStatus(numericId, model.user.accountStatus.deleted);
        } else {
            if (numericTerminated) {
                // Mark status as terminated
                await this.user.modifyAccountStatus(numericId, model.user.accountStatus.terminated);
            } else {
                // Mark status as banned
                await this.user.modifyAccountStatus(numericId, model.user.accountStatus.banned);
            }
        }
        // Take Items Offsale
        await this.user.takeAllItemsOffSale(numericId);
        // Record
        await this.staff.recordBan(userInfo.userId, numericId, model.user.banned.true);
        // Return Success
        return {
            'success': true,
        };
    }

    @Post('/user/:userId/unban')
    @Summary('Unban a user')
    @Use(csrf, YesAuth, middleware.staff.validate(model.staff.Permission.UnbanUser))
    public async unban(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userId: number
    ) {
        // Verify id
        const numericId = filterId(userId) as number;
        if (!numericId) {
            throw new this.BadRequest('InvalidUserid');
        }
        // Verify Exists & Is banned
        try {
            await this.user.getInfo(numericId, ['banned']);
        } catch (e) {
            throw new this.BadRequest('InvalidUserId');
        }
        // Unban
        // UnBan User
        await this.user.modifyUserBanStatus(numericId, model.user.banned.false);
        // Set status
        await this.user.modifyAccountStatus(numericId, model.user.accountStatus.ok);
        // Record
        await this.staff.recordBan(userInfo.userId, numericId, model.user.banned.false);
        // Return Success
        return {
            'success': true,
        };
    }
    /**
     * Get Accounts **potentially** associated with a specific userId. This can return duplicate results. This does not guarntee they are the same person
     * @param userId
     */
    @Get('/user/:userId/associated-accounts')
    @Summary('Get potentially associated accounts in respect to the provided userId. Can return duplicate results. Results should be taken with a grain of salt')
    @Use(YesAuth, middleware.staff.validate(model.staff.Permission.ReviewUserInformation))
    public async getAssociatedAccounts(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userId: number
    ) {
        // Verify User Exists
        try {
            await this.user.getInfo(userId, ['userId']);
        } catch{
            throw new this.BadRequest('InvalidUserId');
        }
        // Setup Array
        const arrayOfAssociatedAccounts = [] as {
            reason: model.staff.ReasonForAssociation;
            userId: number;
        }[];
        const ipAddress = await this.user.getUserIpAddresses(userId);
        for (const ip of ipAddress) {
            const associatedAccounts = await this.user.getUserIdsAssociatedWithIpAddress(ip);
            for (const AssociatedID of associatedAccounts) {
                if (AssociatedID === userId) {
                    continue; // skip
                }
                let exists = false;
                for (const existsId of arrayOfAssociatedAccounts) {
                    if (existsId.userId === AssociatedID) {
                        exists = true;
                    }
                }
                if (exists) {
                    continue;
                }
                arrayOfAssociatedAccounts.push({
                    reason: model.staff.ReasonForAssociation.SameIpaddress,
                    userId: AssociatedID,
                });
            }
        }

        return {
            accounts: arrayOfAssociatedAccounts,
        };
    }

    @Get('/user/:userId/comments')
    @Summary('Get staff comments posted to a userId')
    @Use(YesAuth, middleware.staff.validate(model.staff.Permission.ReviewUserInformation))
    public async getUserComments(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userId: number,
        @QueryParams('offset', Number) offset: number = 0,
        @QueryParams('limit', Number) limit: number = 100,
    ) {
        const comments = await this.staff.getUserComments(userId, offset, limit);
        return {
            comments: comments,
        };
    }

    @Post('/user/:userId/comment')
    @Summary('Post a comment to a user profile')
    @Use(YesAuth, csrf, middleware.staff.validate(model.staff.Permission.ReviewUserInformation))
    public async createUserComment(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userId: number,
        @BodyParams('comment', String) comment: string
    ): Promise<{ success: true }> {
        if (!comment || comment.length < 4 || comment.length > 1024) {
            throw new this.BadRequest('CommentTooLarge');
        }
        // verify user exists
        try {
            await this.user.getInfo(userId, ['userId']);
        } catch{
            throw new this.BadRequest('InvalidUserId');
        }
        await this.staff.createComment(userId, userInfo.userId, comment);
        return {
            success: true,
        };
    }

    @Post('/user/:userId/resetpassword')
    @Summary('Reset a users password. Returns a link for the staff member to give to the user')
    @Use(csrf, YesAuth, middleware.staff.validate(model.staff.Permission.ResetPassword))
    public resetPassword(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userId: number,
    ) {
        return new Promise((resolve, reject): void => {
            // Verify User
            const staff = userInfo.staff > 1 ? true : false;
            if (!staff) {
                return reject();
            }
            // Verify id
            const numericId = filterId(userId) as number;
            if (!numericId) {
                return reject();
            }
            // Verify user can be reset
            this.user.getInfo(numericId, ['staff']).then((userToResetInfo) => {
                if (userToResetInfo.staff > userInfo.staff || userToResetInfo.staff === 1 && userInfo.staff === 1) {
                    return reject();
                }
                // Reset
                crypto.randomBytes(128, async (err, newPassword) => {
                    try {
                        if (err) {
                            return reject();
                        }
                        const stringToken = newPassword.toString('hex');
                        // Insert Request
                        await this.user.insertPasswordReset(numericId, stringToken);
                        // Return Code
                        resolve({
                            'success': true,
                            'code': stringToken,
                        });
                    } catch (e) {
                        reject(e);
                    }
                });
            })
                .catch((e) => {
                    reject();
                })
        });
    }

    @Post('/user/:userId/give/:catalogId')
    @Summary('Give an item to a user')
    @Use(csrf, YesAuth, middleware.staff.validate(model.staff.Permission.GiveItemToUser))
    public async give(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userId: number,
        @PathParams('catalogId', Number) catalogId: number
    ) {
        // Verify id
        const numericId = filterId(userId) as number;
        if (!numericId) {
            throw new this.BadRequest('InvalidUserId');
        }
        // Verify Exists & Isn't already banned
        try {
            const userInfo = await this.user.getInfo(numericId, ['banned']);
            if (userInfo.banned === model.user.banned.true) {
                throw new this.BadRequest('InvalidUserId');
            }
        } catch (e) {
            throw new this.BadRequest('InvalidUserId');
        }
        // Verify Catalog ID Exists
        const numericCatalogId = filterId(catalogId) as number;
        if (!numericCatalogId) {
            throw new this.BadRequest('InvalidCatalogId');
        }
        try {
            await this.catalog.getInfo(numericCatalogId, ['catalogId']);
        } catch (e) {
            throw new this.BadRequest('InvalidCatalogId');
        }
        // Give Item
        let userInventoryId: number;
        // Try to grab from BadDecisions
        const bdOwnership = await this.user.getUserInventoryByCatalogId(50, numericCatalogId);
        if (bdOwnership.length >= 1) {
            userInventoryId = bdOwnership[0].userInventoryId;
            await this.catalog.updateUserInventoryIdOwner(bdOwnership[0].userInventoryId, numericId);
        } else {
            // Create
            userInventoryId = await this.catalog.createItemForUserInventory(numericId, numericCatalogId, null);
        }
        // Log
        await this.staff.recordGive(userInfo.userId, numericId, numericCatalogId, userInventoryId);
        // Return success
        return { 'success': true };
    }

    @Put('/user/:userId/currency')
    @Use(csrf, YesAuth, middleware.staff.validate(model.staff.Permission.GiveCurrencyToUser))
    public async giveCurrency(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userId: number,
        @BodyParams('amount', Number) amount: number,
        @BodyParams('currency', Number) currency: model.economy.currencyType
    ) {
        // Verify id
        const numericId = filterId(userId) as number;
        if (!numericId) {
            throw new this.BadRequest('InvalidUserId');
        }
        // Verify Exists & Isn't already banned
        try {
            const userInfo = await this.user.getInfo(numericId, ['banned']);
            if (userInfo.banned === model.user.banned.true) {
                throw new this.BadRequest('InvalidUserId');
            }
        } catch (e) {
            throw new this.BadRequest('InvalidUserId');
        }
        // Verify Amount
        const numericAmount = filterId(amount) as number;
        if (!numericAmount) {
            throw new this.BadRequest('InvalidCurrencyAmount');
        }
        // Verify currency
        if (currency !== 1 && currency !== 2) {
            throw new this.BadRequest('InvalidCurrency');
        }
        // Give Item
        await this.economy.addToUserBalance(numericId, numericAmount, currency);
        // Log
        await this.staff.recordGiveCurrency(userInfo.userId, numericId, numericAmount, currency);
        // Return success
        return { 'success': true };
    }

    @Get('/catalog/pending')
    @Use(YesAuth, middleware.staff.validate(model.staff.Permission.ReviewPendingItems))
    public async getPendingModerationCatalogItems(
        @Locals('userInfo') userInfo: model.user.UserInfo,
    ) {
        // Verify User
        return await this.staff.getItems();
    }


    @Get('/catalog/thumbnails')
    @Summary('Multi-get thumbnails, ignoring moderation state')
    @Use(YesAuth, middleware.staff.validate(model.staff.Permission.ReviewPendingItems))
    public async multiGetThumbnails(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @QueryParams('ids', String) ids: string
    ): Promise<model.catalog.ThumbnailResponse[]> {
        // Convert CSV to array
        const idsArray = ids.split(',');
        if (idsArray.length < 1) {
            throw new this.BadRequest('InvalidIds');
        }
        const filteredIds: Array<number> = [];
        idsArray.forEach((id) => {
            const userId = filterId(id) as number;
            if (userId) {
                filteredIds.push(userId);
            }
        });
        // Remove duplcates
        const safeIds = Array.from(new Set(filteredIds));
        if (safeIds.length > 25 || safeIds.length < 1) {
            throw new this.BadRequest('InvalidIds');
        }
        return await this.staff.multiGetThumbnailsFromIdsIgnoreModeration(safeIds);
    }

    @Get('/thumbnails')
    @Summary('Multi-get thumbnails by CSV of gameIds, ignoring moderation')
    @Description('Invalid IDs will be filtered out')
    @ReturnsArray(200, {type: model.game.GameThumbnail})
    @Use(YesAuth, middleware.staff.validate(model.staff.Permission.ReviewPendingItems))
    public async multiGetGameThumbnails(
        @Required()
        @QueryParams('ids', String) gameIds: string,
    ) {
        if (!gameIds) {
            throw new this.BadRequest('InvalidIds');
        }
        const idsArray = gameIds.split(',');
        if (idsArray.length < 1) {
            throw new this.BadRequest('InvalidIds');
        }
        const filteredIds: Array<number> = [];
        let allIdsValid = true;
        idsArray.forEach((id) => {
            const gameId = parseInt(id, 10) as number;
            if (!Number.isInteger(gameId)) {
                allIdsValid = false
            }
            filteredIds.push(gameId);
        });
        const safeIds = Array.from(new Set(filteredIds));
        if (safeIds.length > 25) {
            throw new this.BadRequest('TooManyIds');
        }
        return await this.game.multiGetGameThumbnails(safeIds, true);
    }

    @Patch('/ad/:adId/')
    @Summary('Update ad item state')
    @Use(csrf, YesAuth, middleware.staff.validate(model.staff.Permission.ManageAssets))
    public async updateAdState(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('adId', Number) adId: number,
        @BodyParams('state', Number) moderationStatus: number
    ) {
        if (moderationStatus !== 1 && moderationStatus !== 2) {
            throw new this.BadRequest('InvalidState');
        }
        let adInfo = await this.ad.getFullAdInfoById(adId);
        await this.staff.updateAdState(adId, moderationStatus);
        if (moderationStatus === model.catalog.moderatorStatus.Moderated) {
            // Send Message
            await this.notification.createMessage(adInfo.userId, 1, 'Ad "' + adInfo.title + '" has been Rejected', 'Hello,\nYour ad, "' + adInfo.title + '", has been rejected by our moderation team. Please fully review our terms of service before uploading assets so that you don\'t run into this issue again. Sorry for the inconvenience,\n\n-The Moderation Team');
        }
        return {
            success: true,
        };
    }

    @Patch('/game-thumbnail/:gameThumbnailId/')
    @Summary('Update a game thumbnail item state')
    @Use(csrf, YesAuth, middleware.staff.validate(model.staff.Permission.ReviewPendingItems))
    public async updateGameThumbnailState(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('gameThumbnailId', Number) gameThumbnailId: number,
        @BodyParams('state', Number) moderationStatus: number
    ) {
        if (moderationStatus !== 1 && moderationStatus !== 2) {
            throw new this.BadRequest('InvalidState');
        }
        await this.staff.updateGameThumbnailState(gameThumbnailId, moderationStatus);
        return {
            success: true,
        };
    }

    @Patch('/catalog/:catalogId')
    @Summary('Update items moderation state')
    @Use(csrf, YesAuth, middleware.staff.validate(model.staff.Permission.ReviewPendingItems))
    public async updateItemStatus(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('catalogId', Number) catalogId: number,
        @BodyParams('state', Number) moderationStatus: number
    ) {
        const numericCatalogId = filterId(catalogId) as number;
        let itemInfo = await this.catalog.getInfo(numericCatalogId, ['creatorId', 'creatorType', 'catalogName'])
        let numericState = filterId(moderationStatus) as number;
        if (!numericState) {
            numericState = 0;
        }
        if (!numericCatalogId || numericState !== 0 && numericState !== 1 && numericState !== 2) {
            throw new this.BadRequest('InvalidCatalogIdOrState');
        }
        await this.staff.updateItemStatus(numericCatalogId, numericState);
        if (numericState === model.catalog.moderatorStatus.Moderated && itemInfo.creatorType === model.catalog.creatorType.User) {
            // Send Message
            await this.notification.createMessage(itemInfo.creatorId, 1, '"' + itemInfo.catalogName + '" has been Rejected', 'Hello,\nYour item, "' + itemInfo.catalogName + '", has been rejected by our moderation team. Please fully review our terms of service before uploading assets so that you don\'t run into this issue again. Sorry for the inconvenience,\n\n-The Moderation Team');
        }
        return {
            'success': true,
        };
    }

    @Post('/user/:userId/avatar')
    @Summary('Force a users avatar to be [re]generated')
    @Use(csrf, YesAuth, middleware.staff.validate(model.staff.Permission.RegenerateThumbnails))
    public async regenAvatar(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userId: number,
        @QueryParams('allowHashes', Boolean) allowHashes: boolean = false,
        yieldUntilComplete: boolean = false,
        setUserUrl: boolean = true,
    ) {
        const numericUserId = filterId(userId) as number;
        if (!numericUserId) {
            throw new this.BadRequest('InvalidUserId');
        }
        const renderAvatar = async () => {
            try {
                // Update Avatar of User
                const avatar = await this.user.getAvatar(numericUserId);
                const avatarColors = await this.user.getAvatarColors(numericUserId);
                // const avatarObject = await this.AvatarModel.generateAvatarFromModels(numericUserId, avatarColors, avatar);
                // Generate Avatar
                const catalogIds = [];
                for (const asset of avatar) {
                    const info = await this.catalog.getInfo(asset.catalogId, ['status']);
                    if (info.status === model.catalog.moderatorStatus.Ready) {
                        catalogIds.push(asset.catalogId);
                    }
                }
                const headrgb = [
                    avatarColors[0].headr,
                    avatarColors[0].headg,
                    avatarColors[0].headb,
                ];
                const legrgb = [
                    avatarColors[0].legr,
                    avatarColors[0].legg,
                    avatarColors[0].legb,
                ];
                const torsorgb = [
                    avatarColors[0].torsor,
                    avatarColors[0].torsog,
                    avatarColors[0].torsob,
                ];
                const avatarObject = await this.catalog.generateAvatarJsonFromCatalogIds(numericUserId, catalogIds, legrgb, headrgb, torsorgb);
                let url: string;
                if (allowHashes) {
                    let _internalUrl = await this.avatar.getThumbnailHashUrl(avatarObject);
                    if (_internalUrl) {
                        url = _internalUrl;
                    }else{
                        url = await this.avatar.renderAvatar('avatar', avatarObject);
                    }
                }else{
                    url = await this.avatar.renderAvatar('avatar', avatarObject);
                }
                if (setUserUrl) {
                    await this.user.addUserThumbnail(numericUserId, url);
                }
                return url;
            } catch (e) {
                // throw StaffError(0);
                console.error(e);
                throw e;
            }
        };
        if (yieldUntilComplete) {
            let url = await renderAvatar();
            return {
                success: true,
                url: url,
            }
        }else{
            renderAvatar().then(d => {
                // do nothing for now
            }).catch(err => {
                console.error(err);
            })
        }
        return {
            'success': true,
        };
    }

    @Patch('/banner')
    @Summary('Update site-wide banner text')
    @Use(csrf, YesAuth, middleware.staff.validate(model.staff.Permission.ManageBanner))
    public async updateBanner(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @BodyParams('enabled', Number) enabled: number,
        @BodyParams('text', String) bannerText: string
    ) {
        let isEnabled = filterId(enabled) as number;
        if (!isEnabled) {
            isEnabled = 0;
        } else {
            isEnabled = 1;
        }
        if (bannerText && bannerText.length > 1024) {
            throw new this.BadRequest('InvalidBannerText');
        }
        // Set Redis
        if (isEnabled === 1) {
            await this.staff.updateBannerText(bannerText);
        } else {
            await this.staff.updateBannerText('');
        }
        return {
            'success': true,
        };
    }

    /**
     * Delete a User's Blurb
     */
    @Delete('/user/:userId/blurb')
    @Summary('Delete a users blurb')
    @Use(csrf, YesAuth, middleware.staff.validate(model.staff.Permission.ManagePublicUserInfo))
    public async deleteBlurb(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userId: number
    ) {
        await this.settings.updateBlurb(userId, '[ Content Deleted ]');
        return {
            'success': true,
        };
    }

    /**
     * Delete a User's Status
     */
    @Delete('/user/:userId/status')
    @Summary('Delete a users status')
    @Use(csrf, YesAuth, middleware.staff.validate(model.staff.Permission.ManagePublicUserInfo))
    public async deleteStatus(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userId: number
    ) {
        // grab id of current status
        let currentStatus = await this.user.multiGetStatus([userId], 0, 1);
        if (currentStatus[0]) {
            let data = currentStatus[0];
            // delete current status
            await this.user.updateStatusByid(data.statusId, '[ Content Deleted ]');
        }
        // now, update the current one to content deleted
        await this.user.updateStatus(userId, '[ Content Deleted ]');
        return {
            'success': true,
        };
    }

    /**
     * Delete a User's Forum Signature
     */
    @Delete('/user/:userId/forum/signature')
    @Summary('Delete a users forum signature')
    @Use(csrf, YesAuth, middleware.staff.validate(model.staff.Permission.ManagePublicUserInfo))
    public async deleteForumSignature(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userId: number
    ) {
        // Verify User
        await this.settings.updateSignature(userId, '[ Content Deleted ]');
        return {
            'success': true,
        };
    }

    @Delete('/user/:userId/two-factor')
    @Summary('Disable an accounts two-factor authentcation')
    @Use(csrf, YesAuth, middleware.staff.validate(model.staff.Permission.ManagePrivateUserInfo))
    public async disableTwoFactor(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userId: number
    ) {
        // Verify User
        await this.settings.disable2fa(userId);
        return {
            'success': true,
        };
    }

    @Delete('/user/:userId/clear-balance/:currencyTypeId')
    @Summary('Clear the balance of the {currencyTypeId} for the {userId}')
    @Use(csrf, YesAuth, middleware.staff.validate(model.staff.Permission.TakeCurrencyFromUser))
    public async clearBalance(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userId: number,
        @PathParams('currencyTypeId', Number) currencyTypeId: number
    ) {
        // Verify User
        if (currencyTypeId !== 1 && currencyTypeId !== 2) {
            throw new this.BadRequest('InvalidCurrencyType');
        }
        let balToGrab: 'primaryBalance'|'secondaryBalance' = 'primaryBalance';
        if (currencyTypeId === 2) {
            balToGrab = 'secondaryBalance';
        }
        let userBalance = await this.user.getInfo(userId, [balToGrab]);
        await this.economy.subtractFromUserBalance(userId, userBalance[balToGrab], currencyTypeId);
        // Return success
        return {
            success: true,
        };
    }

    @Put('/user/inventory/provide-items')
    @Summary('Provide items to the {userId}')
    @Use(csrf, YesAuth, middleware.staff.validate(model.staff.Permission.GiveItemToUser))
    public async provideItemToUser(
        @Required()
        @BodyParams(model.staff.ProvideItemsRequest) body: model.staff.ProvideItemsRequest,
    ) {
        const forUpdate = [
            'users',
            'user_inventory',
        ];
        await this.transaction(this, forUpdate, async function(trx) {
            for (const item of body.catalogIds) {
                let badDecisions = await trx.user.getUserInventoryByCatalogId(50, item.catalogId);
                if (badDecisions.length >= 1 && body.userIdTo !== 50) {
                    // Steal from BadDecisions and give to user
                    let item = badDecisions[0];
                    await trx.catalog.updateUserInventoryIdOwner(item.userInventoryId, body.userIdTo);
                }else{
                    // Create a new item
                    await trx.catalog.createItemForUserInventory(body.userIdTo, item.catalogId);
                }
            }
        });
        return {};
    }

    @Patch('/user/inventory/transfer-item')
    @Summary('Transfer one or more item(s) from the {userId}')
    @Use(csrf, YesAuth, middleware.staff.validate(model.staff.Permission.TakeItemFromUser, model.staff.Permission.GiveItemToUser))
    public async transferItem(
        @Required()
        @BodyParams(model.staff.TransferItemsRequest) body: model.staff.TransferItemsRequest,
    ) {
        const forUpdate = [
            'users',
            'user_inventory',
        ];
        await this.transaction(this, forUpdate, async function(trx) {
            for (const item of body.userInventoryIds) {
                let itemData = await trx.user.getItemByInventoryId(item);
                if (itemData.userId !== body.userIdFrom) {
                    throw new this.BadRequest('InvalidUserId');
                }
                await trx.user.editItemPrice(item, 0);
                await trx.catalog.updateUserInventoryIdOwner(item, body.userIdTo);
            }
        });
        return {};
    }

    @Get('/search')
    @Summary('Search staff')
    public async search(
        @QueryParams('offset', Number) offset: number = 0
    ) {
        const numericOffset = filterOffset(offset);
        return await this.staff.search(numericOffset);
    }

    @Get('/status/web')
    @Use(csrf, YesAuth, middleware.staff.validate(model.staff.Permission.ManageWeb))
    public async getServerStatus(
        @Locals('userInfo') userInfo: model.user.UserInfo,
    ): Promise<model.staff.SystemUsageStats> {
        // Verify User
        return await this.staff.getServerStatus();
    }

    @Patch('/user/:userId/rank')
    @Use(csrf, YesAuth, middleware.staff.validate(model.staff.Permission.ManageStaff))
    public async updateUserStaffRank(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userId: number,
        @BodyParams('rank', Number) newRank: number
    ) {
        if (newRank !== 0 && newRank !== 1 && newRank !== 2 && newRank !== 3) {
            throw new this.BadRequest('InvalidRank');
        }
        if (newRank >= userInfo.staff) {
            throw new this.BadRequest('RankCannotBeAboveCurrentUser');
        }
        let UserToRankInfo;
        try {
            UserToRankInfo = await this.user.getInfo(userId, ['userId', 'staff']);
            if (UserToRankInfo.staff >= userInfo.staff) {
                throw false;
            }
        } catch (e) {
            throw new this.BadRequest('InvalidPermissions');
        }
        await this.user.updateStaffRank(userId, newRank);
        return { success: true };
    }

    @Patch('/forum/category/:categoryId')
    @Summary('Update a forum category')
    @Use(csrf, YesAuth, middleware.staff.validate(model.staff.Permission.ManageForumCategories))
    public async updateForumCategory(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @PathParams('categoryId', Number) catId: number,
        @Required()
        @BodyParams('title', String) title: string,
        @Required()
        @BodyParams('description', String) description: string = '',
        @Required()
        @BodyParams('weight', Number) weight: number = 0,
    ) {
        // Update cat
        await this.forum.updateCategory(catId, title, description, weight);
        // Return success
        return {
            success: true,
        };
    }

    @Put('/forum/category/')
    @Summary('Update a forum category')
    @Use(csrf, YesAuth, middleware.staff.validate(model.staff.Permission.ManageForumCategories))
    public async createForumCategory(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @BodyParams('title', String) title: string,
        @Required()
        @BodyParams('description', String) description: string = '',
        @Required()
        @BodyParams('weight', Number) weight: number = 0,
    ) {
        // Update cat
        await this.forum.createCategory(title, description, weight);
        // Return success
        return {
            success: true,
        };
    }

    @Patch('/forum/sub-category/:subCategoryId')
    @Summary('Update a forum subCategory')
    @Use(csrf, YesAuth, middleware.staff.validate(model.staff.Permission.ManageForumCategories))
    public async updateForumSubCategory(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @PathParams('subCategoryId', Number) subId: number,
        @Required()
        @BodyParams('categoryId', Number) catId: number,
        @Required()
        @BodyParams('title', String) title: string,
        @Required()
        @BodyParams('description', String) desc: string,
        @Required()
        @BodyParams('readPermissionLevel', Number) readPermissionLevel: number,
        @Required()
        @BodyParams('postPermissionLevel', Number) postPermissionLevel: number,
        @BodyParams('weight', Number) weight: number = 0,
    ) {
        // Update sub
        await this.forum.updateSubCategory(subId, catId, title, desc, readPermissionLevel, postPermissionLevel, weight);
        // Return success
        return {
            success: true,
        };
    }

    @Put('/forum/sub-category/')
    @Summary('Create a forum subCategory')
    @Use(csrf, YesAuth, middleware.staff.validate(model.staff.Permission.ManageForumCategories))
    public async createForumSubCategory(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @BodyParams('categoryId', Number) catId: number,
        @Required()
        @BodyParams('title', String) title: string,
        @Required()
        @BodyParams('description', String) desc: string,
        @Required()
        @BodyParams('readPermissionLevel', Number) readPermissionLevel: number,
        @Required()
        @BodyParams('postPermissionLevel', Number) postPermissionLevel: number,
        @BodyParams('weight', Number) weight: number = 0,
    ) {
        // Create sub
        await this.forum.createSubCategory(catId, title, desc, readPermissionLevel, postPermissionLevel, weight);
        // Return success
        return {
            success: true,
        };
    }

    @Get('/support/tickets-awaiting-response')
    @Summary('Get support tickets awaiting cs response')
    @Use(YesAuth, middleware.staff.validate(model.staff.Permission.ManageSupportTickets))
    public async getTickets(
        @Locals('userInfo') userInfo: model.user.UserInfo,
    ) {
        return this.support.getTicketsAwaitingSupportResponse();
    }

    @Get('/support/tickets-all')
    @Summary('Get all support tickets, excluding ones that are closed')
    @Use(YesAuth, middleware.staff.validate(model.staff.Permission.ManageSupportTickets))
    public async getAllTickets(
        @Locals('userInfo') userInfo: model.user.UserInfo,
    ) {
        return this.support.getTicketsNotClosed();
    }

    @Get('/support/ticket/:ticketId/replies')
    @Summary('Get replies to ticket')
    @Use(YesAuth, middleware.staff.validate(model.staff.Permission.ManageSupportTickets))
    public async getRepliesToTicket(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('ticketId', Number) ticketId: number
    ) {
        return await this.support.getTicketRepliesAll(ticketId);
    }

    @Post('/support/ticket/:ticketId/reply')
    @Summary('Reply to a ticket')
    @Use(YesAuth, csrf, middleware.staff.validate(model.staff.Permission.ManageSupportTickets))
    public async replyToTicket(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('ticketId', Number) ticketId: number,
        @BodyParams('body', String) body: string,
        @BodyParams('visibleToClient', Boolean) visibleToClient: boolean = true,
    ) {
        // reply
        await this.support.replyToTicket(ticketId, userInfo.userId, body, visibleToClient);
        // return success
        return {
            success: true,
        };
    }

    @Get('/support/ticket/metadata')
    @Summary('Get ticket meta-data')
    public getTicketMetaData() {
        let status = model.support.TicketStatus;
        let statuses = [];
        for (const item of Object.getOwnPropertyNames(status)) {
            let num = parseInt(item, 10);
            if (!isNaN(num)) {
                statuses.push({
                    key: item,
                    value: status[num],
                });
            }
        }
        return {
            status: statuses,
        };
    }

    @Patch('/support/ticket/:ticketId/status')
    @Summary('Update ticket_status')
    @Use(YesAuth, csrf, middleware.staff.validate(model.staff.Permission.ManageSupportTickets))
    public async updateTicketStatus(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('ticketId', Number) ticketId: number,
        @BodyParams('status', Number) status: number,
    ) {
        if (!model.support.TicketStatus[status]) {
            throw new this.BadRequest('InvalidTicketStatus');
        }
        await this.support.updateTicketStatus(ticketId, status);
        // return success
        return {
            success: true,
        };
    }

    @Patch('/groups/:groupId/status')
    @Summary('Update a groups status')
    @Use(YesAuth, csrf, middleware.staff.validate(model.staff.Permission.ManageGroup))
    public async updateGroupStatus(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('groupId', Number) groupId: number,
        @BodyParams('status', Number) status: number,
    ) {
        if (!model.group.groupStatus[status]) {
            throw new this.BadRequest('InvalidGroupStatus');
        }
        // update status
        await this.group.updateGroupStatus(groupId, status);
        // ok
        return {
            success: true,
        };
    }

    @Get('/feed/friends/abuse-reports')
    @Summary('Get latest abuse reports for friend feed')
    @Use(YesAuth, middleware.staff.validate(model.staff.Permission.ReviewAbuseReports))
    @ReturnsArray(200, {type: model.reportAbuse.ReportedStatusEntry})
    public async latestAbuseReports(
        @Locals('userInfo') userInfo: model.user.UserInfo,
    ) {
        return await this.reportAbuse.latestReportedUserStatuses();
    }

    @Patch('/feed/friends/abuse-report/:reportId/')
    @Summary('Update a friends feed abuse-report status')
    @Use(YesAuth, csrf, middleware.staff.validate(model.staff.Permission.ReviewAbuseReports))
    @Returns(200, {description: 'Abuse report has been updated'})
    public async updateAbuseReportStatus(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('reportId', Number) reportId: number,
        @Required()
        @BodyParams('status', Number) status: number,
    ) {
        if (!model.reportAbuse.ReportStatus[status]) {
            throw new this.BadRequest('InvalidStatus');
        }
        // mark report as OK
        await this.reportAbuse.updateUserStatusReportStatus(reportId, status);
        return {
            success: true,
        };
    }

    @Delete('/feed/friends/:userStatusId')
    @Summary('Delete a userStatusId')
    @Use(csrf, YesAuth)
    @Use(YesAuth, csrf, middleware.staff.validate(model.staff.Permission.ManagePublicUserInfo))
    @Returns(200, {description: 'Status Deleted'})
    public async deleteUserStatusId(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userStatusId', Number) userStatusId: number,
    ) {
        let info = await this.user.getStatusById(userStatusId);
        // update status to delete
        await this.user.updateStatusByid(userStatusId, '[ Content Deleted ]');
        // update current status
        await this.user.updateStatusWithoutInsert(info.userId, '[ Content Deleted ]');
        // return ok
        return {
            success: true,
        };
    }

    @Get('/economy/trades/:tradeId/items')
    @Summary('Get the items involved in a specific tradeId')
    @Description('Requestee is authenticated user, requested is the partner involved with the trade')
    @Returns(200, { type: model.economy.TradeItemsResponse })
    @Returns(400, { type: model.Error, description: 'InvalidTradeId: TradeId is invalid or you do not have permission to view it\n' })
    @Use(YesAuth, middleware.staff.validate(model.staff.Permission.ManagePublicUserInfo))
    public async getTradeItems(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('tradeId', Number) numericTradeId: number,
        @Required()
        @Description('userId to impersonate')
        @QueryParams('userId', Number) userId: number,
    ) {
        let tradeInfo: model.economy.ExtendedTradeInfo;
        try {
            tradeInfo = await this.economy.getTradeById(numericTradeId);
        } catch (e) {
            throw new this.BadRequest('InvalidTradeId');
        }
        if (tradeInfo.userIdOne === userId) {
            const requestedTradeItems = await this.economy.getTradeItems(model.economy.tradeSides.Requested, numericTradeId);
            const requesteeTradeItems = await this.economy.getTradeItems(model.economy.tradeSides.Requester, numericTradeId);
            return { 'requested': requestedTradeItems, 'offer': requesteeTradeItems };
        } else if (tradeInfo.userIdTwo === userId) {
            const requestedTradeItems = await this.economy.getTradeItems(model.economy.tradeSides.Requester, numericTradeId);
            const requesteeTradeItems = await this.economy.getTradeItems(model.economy.tradeSides.Requested, numericTradeId);
            return { 'requested': requestedTradeItems, 'offer': requesteeTradeItems };
        } else {
            throw new this.BadRequest('InvalidTradeId');
        }
    }

    @Get('/economy/trades/:type')
    @Summary('Get user trades')
    @Use(YesAuth, middleware.staff.validate(model.staff.Permission.ManagePublicUserInfo))
    @ReturnsArray(200, { type: model.economy.TradeInfo })
    @Returns(400, { type: model.Error, description: 'InvalidTradeType: TradeType must be one of: inbound,outbound,completed,inactive\n' })
    public async getTrades(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('type', String) tradeType: string,
        @Required()
        @Description('userId to impersonate')
        @QueryParams('userId', Number) userId: number,
        @QueryParams('offset', Number) offset: number = 0
    ) {
        if (!(userInfo.staff >= 2)) {
            throw new this.BadRequest('InvalidPermissions');
        }
        let tradeValue;
        if (tradeType !== 'inbound' && tradeType !== 'outbound' && tradeType !== 'completed' && tradeType !== 'inactive') {
            throw new this.BadRequest('InvalidTradeType');
        } else {
            tradeValue = tradeType;
        }
        return await this.economy.getTrades(userId, tradeValue, offset);
    }

    @Post('/user/:userId/game-dev')
    @Summary('Modify is_developer state of the {userId}')
    @Use(YesAuth, csrf, middleware.staff.validate(model.staff.Permission.ManagePublicUserInfo))
    public async updateIsGameDevPermission(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @PathParams('userId', Number) userId: number,
        @Required()
        @BodyParams('isDeveloper', Boolean) isDeveloper: boolean,
    ) {
        if (!(userInfo.staff >= 2)) {
            throw new this.BadRequest('InvalidPermissions');
        }
        await this.user.updateIsDeveloper(userId, isDeveloper);
        return {};
    }

    @Delete('/user/session-impersonation')
    @Summary('Disable impersonation')
    @Use(YesAuth, csrf, middleware.staff.validate(model.staff.Permission.ImpersonateUser))
    public async deleteImpersonation(
        @Req() req: Req,
    ) {
        if (req.session) {
            delete req.session.impersonateUserId;
        }
        return {}
    }

    @Put('/user/session-impersonation')
    @Summary('Impersonate a user')
    @Use(YesAuth, csrf, middleware.staff.validate(model.staff.Permission.ImpersonateUser))
    public async createImpersonation(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Req() req: Req,
        @Required()
        @BodyParams('userId', Number) userId: number,
    ) {
        let info = await this.user.getInfo(userId);
        if (info.staff >= userInfo.staff) {
            throw new Error('Cannot impersonate this user');
        }
        if (req.session) {
            req.session.impersonateUserId = userId;
        }
        return {};
    }
}
