/**
 * Imports
 */
// Express
import moment = require('moment');
import crypto = require('crypto');
// Interfaces
import * as model from '../../models/models';
// Misc Models
import { filterOffset, filterId } from '../../helpers/Filter';
// middleware
import * as middleware from '../../middleware/middleware';
import * as filter from '../../filters/filters';
// Autoload
import controller from '../controller';
import { Controller, Post, Get, Patch, Delete, Put, QueryParams, BodyParams, PathParams, UseBeforeEach, UseBefore, Locals, Use, MaxLength, MinLength, Required, Filter } from '@tsed/common';
import { Summary, Description, ReturnsArray, Returns } from '@tsed/swagger';
import { YesAuth } from '../../middleware/Auth';
import { csrf } from '../../dal/auth';
/**
 * Staff Controller
 */
@Controller('/staff')
export class StaffController extends controller {
    constructor() {
        super();
    }
    /**
     * Validate a user has proper staff permissions to access the specified endpoint
     * @param userInfo 
     * @param permLevel 
     */
    public validate(userInfo: model.user.UserInfo, permLevel: number): void {
        const staff = userInfo.staff >= permLevel ? true : false;
        if (!staff) {
            throw new this.BadRequest('InvalidPermissions');
        }
    }

    @Get('/user/:userId/transactions')
    @Summary('Get transaction history for the {userId}')
    @Use(YesAuth)
    @ReturnsArray(200, {type: model.economy.userTransactions})
    public async getTransactions(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @QueryParams('offset', Number) offset: number = 0,
        @PathParams('userId', Number) userId: number,
    ): Promise<model.economy.userTransactions[]> {
        this.validate(userInfo, 1);
        const transactions = await this.economy.getUserTransactions(userId, offset);
        return transactions;
    }
    /**
     * Ban a User
     * @param deleted Delete the account? This cannot be reversed after 30 days
     */
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    @Post('/user/:userId/ban')
    @Summary('Ban a user')
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
        this.validate(userInfo, 2);
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
    /**
     * Unban a User
     * @param userId 
     */
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    @Post('/user/:userId/unban')
    @Summary('Unban a user')
    public async unban(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userId: number
    ) {
        // Verify User
        this.validate(userInfo, 2);
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
    @UseBefore(YesAuth)
    @Get('/user/:userId/associated-accounts')
    @Summary('Get potentially associated accounts in respect to the provided userId. Can return duplicate results. Results should be taken with a grain of salt')
    public async getAssociatedAccounts(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userId: number
    ) {
        this.validate(userInfo, 1);
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
    /**
     * Get Comments on a User made by staff
     * @param userId 
     * @param offset 
     * @param limit 
     */
    @UseBefore(YesAuth)
    @Get('/user/:userId/comments')
    @Summary('Get staff comments posted to a userId')
    public async getUserComments(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userId: number,
        @QueryParams('offset', Number) offset: number = 0,
        @QueryParams('limit', Number) limit: number = 100,
    ) {
        this.validate(userInfo, 1);
        const comments = await this.staff.getUserComments(userId, offset, limit);
        return {
            comments: comments,
        };
    }

    /**
     * Create a Comment on a user moderation profile
     * @param userId 
     * @param comment 
     */
    @Post('/user/:userId/comment')
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    @Summary('Post a comment to a user profile')
    public async createUserComment(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userId: number,
        @BodyParams('comment', String) comment: string
    ): Promise<{ success: true }> {
        // Validate
        this.validate(userInfo, 1);
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

    /**
     * Reset a user's password. Returns new password
     * @param userId 
     */
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    @Post('/user/:userId/resetpassword')
    @Summary('Reset a users password. Returns a link for the staff member to give to the user')
    public resetPassword(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userId: number,
    ) {
        this.validate(userInfo, 2);
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

    /**
     * Give an Item to a User
     * @param userId 
     */
    @Post('/user/:userId/give/:catalogId')
    @Summary('Give an item to a user')
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async give(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userId: number,
        @PathParams('catalogId', Number) catalogId: number
    ) {
        // Verify User
        this.validate(userInfo, 3);
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
    /**
     * Give Currency to a User
     * @param userId 
     */
    @Put('/user/:userId/currency')
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async giveCurrency(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userId: number,
        @BodyParams('amount', Number) amount: number,
        @BodyParams('currency', Number) currency: model.economy.currencyType
    ) {
        // Verify User
        this.validate(userInfo, 3);
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

    /**
     * Get items awaiting moderation
     */
    @UseBefore(YesAuth)
    @Get('/catalog/pending')
    public async getPendingModerationCatalogItems(
        @Locals('userInfo') userInfo: model.user.UserInfo,
    ) {
        // Verify User
        this.validate(userInfo, 1);
        const data = await this.staff.getItems();
        return data;
    }

    /**
     * Multi-Get Catalog Thumbnails at once, ignoring moderation status
     * @param ids CSV of IDs
     */
    @UseBefore(YesAuth)
    @Get('/catalog/thumbnails')
    @Summary('Multi-get thumbnails, ignoring moderation state')
    public async multiGetThumbnails(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @QueryParams('ids', String) ids: string
    ): Promise<model.catalog.ThumbnailResponse[]> {
        // Verify User
        this.validate(userInfo, 1);
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
        const thumbnails = await this.staff.multiGetThumbnailsFromIdsIgnoreModeration(safeIds);
        return thumbnails;
    }

    @Get('/thumbnails')
    @Summary('Multi-get thumbnails by CSV of gameIds, ignoring moderation')
    @Description('Invalid IDs will be filtered out')
    @ReturnsArray(200, {type: model.game.GameThumbnail})
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
        let results = await this.game.multiGetGameThumbnails(safeIds, true);
        return results;
    }

    /**
     * Update ad item state
     * @param userInfo 
     * @param catalogId 
     * @param moderationStatus 
     */
    @Patch('/ad/:adId/')
    @Summary('Update ad item state')
    @Use(csrf, YesAuth)
    public async updateAdState(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('adId', Number) adId: number,
        @BodyParams('state', Number) moderationStatus: number
    ) {
        this.validate(userInfo, 1);
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

    /**
     * Update a game thumbnail
     * @param userInfo 
     * @param catalogId 
     * @param moderationStatus 
     */
    @Patch('/game-thumbnail/:gameThumbnailId/')
    @Summary('Update a game thumbnail item state')
    @Use(csrf, YesAuth)
    public async updateGameThumbnailState(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('gameThumbnailId', Number) gameThumbnailId: number,
        @BodyParams('state', Number) moderationStatus: number
    ) {
        this.validate(userInfo, 1);
        if (moderationStatus !== 1 && moderationStatus !== 2) {
            throw new this.BadRequest('InvalidState');
        }
        await this.staff.updateGameThumbnailState(gameThumbnailId, moderationStatus);
        return {
            success: true,
        };
    }

    /**
     * Update Item State
     * @param catalogId 
     * @param moderationStatus 
     */
    @Patch('/catalog/:catalogId')
    @Summary('Update items moderation state')
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async updateItemStatus(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('catalogId', Number) catalogId: number,
        @BodyParams('state', Number) moderationStatus: number
    ) {
        console.log(catalogId);
        // Verify User
        this.validate(userInfo, 1);
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

    /**
     * Force a user's avatar to be re/generated
     * @param userId 
     */
    @Post('/user/:userId/avatar')
    @Summary('Force a users avatar to be [re]generated')
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async regenAvatar(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userId: number
    ) {
        // Verify User
        this.validate(userInfo, 1);

        const numericUserId = filterId(userId) as number;
        if (!numericUserId) {
            throw new this.BadRequest('InvalidUserId');
        }
        (async (): Promise<void> => {
            try {
                // Update Avatar of User
                const avatar = await this.user.getAvatar(numericUserId);
                const avatarColors = await this.user.getAvatarColors(numericUserId);
                console.log(avatar);
                console.log(avatarColors);
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
                const URL = await this.avatar.renderAvatar('avatar', avatarObject);
                await this.user.addUserThumbnail(numericUserId, URL);
            } catch (e) {
                // throw StaffError(0);
                console.log(e);
            }
        })();
        return {
            'success': true,
        };
    }

    /**
     * Update the Site Banner
     * @param enabled 
     * @param bannerText 
     */
    @Patch('/banner')
    @Summary('Update site-wide banner text')
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async updateBanner(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @BodyParams('enabled', Number) enabled: number,
        @BodyParams('text', String) bannerText: string
    ) {
        // Verify User
        this.validate(userInfo, 2);
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
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async deleteBlurb(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userId: number
    ) {
        // Verify User
        this.validate(userInfo, 1);
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
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async deleteStatus(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userId: number
    ) {
        // Verify User
        this.validate(userInfo, 1);
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
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async deleteForumSignature(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userId: number
    ) {
        // Verify User
        this.validate(userInfo, 1);
        await this.settings.updateSignature(userId, '[ Content Deleted ]');
        return {
            'success': true,
        };
    }

    /**
     * Delete a User's 2FA Status
     */
    @Delete('/user/:userId/two-factor')
    @Summary('Disable an accounts two-factor authentcation')
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async disableTwoFactor(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userId: number
    ) {
        // Verify User
        this.validate(userInfo, 1);
        await this.settings.disable2fa(userId);
        return {
            'success': true,
        };
    }

     /**
     * Clear a users balance
     */
    @Delete('/user/:userId/clear-balance/:currencyTypeId')
    @Summary('Clear the balance of the {currencyTypeId} for the {userId}')
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async clearBalance(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userId: number,
        @PathParams('currencyTypeId', Number) currencyTypeId: number
    ) {
        // Verify User
        this.validate(userInfo, 2);
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

    /**
     * Get all staff
     * @param offset 
     */
    @Get('/search')
    @Summary('Search staff')
    public async search(
        @QueryParams('offset', Number) offset: number = 0
    ) {
        const numericOffset = filterOffset(offset);
        const results = await this.staff.search(numericOffset);
        return results;
    }

    /**
     * Get the Web Server's Status
     */
    @Get('/status/web')
    @UseBefore(YesAuth)
    public async getServerStatus(
        @Locals('userInfo') userInfo: model.user.UserInfo,
    ): Promise<model.staff.SystemUsageStats> {
        // Verify User
        this.validate(userInfo, 1);
        const status = await this.staff.getServerStatus();
        return status;
    }

    /**
     * Update a User's Staff Rank
     * @param userId 
     */
    @Patch('/user/:userId/rank')
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async updateUserStaffRank(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) userId: number, 
        @BodyParams('rank', Number) newRank: number
    ) {
        this.validate(userInfo, 3);
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
    @Use(csrf, YesAuth)
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
        // Validate staff rank
        this.validate(userInfo, 3);
        // Update cat
        await this.forum.updateCategory(catId, title, description, weight);
        // Return success
        return {
            success: true,
        };
    }

    @Put('/forum/category/')
    @Summary('Update a forum category')
    @Use(csrf, YesAuth)
    public async createForumCategory(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @BodyParams('title', String) title: string,
        @Required()
        @BodyParams('description', String) description: string = '',
        @Required()
        @BodyParams('weight', Number) weight: number = 0,
    ) {
        // Validate staff rank
        this.validate(userInfo, 3);
        // Update cat
        await this.forum.createCategory(title, description, weight);
        // Return success
        return {
            success: true,
        };
    }

    @Patch('/forum/sub-category/:subCategoryId')
    @Summary('Update a forum subCategory')
    @Use(csrf,YesAuth)
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
        // Validate staff rank
        this.validate(userInfo, 3);
        // Update sub
        await this.forum.updateSubCategory(subId, catId, title, desc, readPermissionLevel, postPermissionLevel, weight);
        // Return success
        return {
            success: true,
        };
    }

    @Put('/forum/sub-category/')
    @Summary('Create a forum subCategory')
    @Use(csrf,YesAuth)
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
        // Validate staff rank
        this.validate(userInfo, 3);
        // Create sub
        await this.forum.createSubCategory(catId, title, desc, readPermissionLevel, postPermissionLevel, weight);
        // Return success
        return {
            success: true,
        };
    }

    @Get('/support/tickets-awaiting-response')
    @Summary('Get support tickets awaiting cs response')
    @Use(YesAuth)
    public async getTickets(
        @Locals('userInfo') userInfo: model.user.UserInfo,
    ) {
        this.validate(userInfo, 1);
        let tickets = this.support.getTicketsAwaitingSupportResponse();
        return tickets;
    }

    @Get('/support/tickets-all')
    @Summary('Get all support tickets, excluding ones that are closed')
    @Use(YesAuth)
    public async getAllTickets(
        @Locals('userInfo') userInfo: model.user.UserInfo,
    ) {
        this.validate(userInfo, 1);
        let tickets = this.support.getTicketsNotClosed();
        return tickets;
    }

    @Get('/support/ticket/:ticketId/replies')
    @Summary('Get replies to ticket')
    @Use(YesAuth)
    public async getRepliesToTicket(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('ticketId', Number) ticketId: number
    ) {
        this.validate(userInfo, 1);
        let responses = await this.support.getTicketRepliesAll(ticketId);
        return responses;
    }

    @Post('/support/ticket/:ticketId/reply')
    @Summary('Reply to a ticket')
    @Use(csrf, YesAuth)
    public async replyToTicket(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('ticketId', Number) ticketId: number,
        @BodyParams('body', String) body: string,
        @BodyParams('visibleToClient', Boolean) visibleToClient: boolean = true,
    ) {
        this.validate(userInfo, 1);
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
            if (!isNaN(parseInt(item))) {
                statuses.push({
                    key: item,
                    value: status[item],
                });
            }
        }
        return {
            status: statuses,
        };
    }

    @Patch('/support/ticket/:ticketId/status')
    @Summary('Update ticket_status')
    @Use(csrf, YesAuth)
    public async updateTicketStatus(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('ticketId', Number) ticketId: number,
        @BodyParams('status', Number) status: number,
    ) {
        this.validate(userInfo, 1);
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
    @Use(csrf, YesAuth)
    public async updateGroupStatus(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('groupId', Number) groupId: number,
        @BodyParams('status', Number) status: number,
    ) {
        this.validate(userInfo, 2);
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
    @Use(YesAuth)
    @ReturnsArray(200, {type: model.reportAbuse.ReportedStatusEntry})
    public async latestAbuseReports(
        @Locals('userInfo') userInfo: model.user.UserInfo,
    ) {
        this.validate(userInfo, 1);
        let pendingAbuseReports = await this.reportAbuse.latestReportedUserStatuses();
        return pendingAbuseReports;
    }

    @Patch('/feed/friends/abuse-report/:reportId/')
    @Summary('Update a friends feed abuse-report status')
    @Use(csrf, YesAuth)
    @Returns(200, {description: 'Abuse report has been updated'})
    public async updateAbuseReportStatus(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('reportId', Number) reportId: number,
        @Required()
        @BodyParams('status', Number) status: number,
    ) {
        this.validate(userInfo, 1);
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
    @Returns(200, {description: 'Status Deleted'})
    public async deleteUserStatusId(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userStatusId', Number) userStatusId: number,
    ) {
        this.validate(userInfo, 1);
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
}
