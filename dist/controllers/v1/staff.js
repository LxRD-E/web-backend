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
const moment = require("moment");
const crypto = require("crypto");
const model = require("../../models/models");
const Filter_1 = require("../../helpers/Filter");
const middleware = require("../../middleware/middleware");
const controller_1 = require("../controller");
const common_1 = require("@tsed/common");
const swagger_1 = require("@tsed/swagger");
const Auth_1 = require("../../middleware/Auth");
const auth_1 = require("../../dal/auth");
let StaffController = class StaffController extends controller_1.default {
    constructor() {
        super();
    }
    getPermissions() {
        return model.staff.Permission;
    }
    async getPermissionsForUserId(userId) {
        let allPermissions = await this.staff.getPermissions(userId);
        let permissionsObject = {};
        for (const perm of allPermissions) {
            permissionsObject[perm] = model.staff.Permission[perm];
            permissionsObject[model.staff.Permission[perm]] = perm;
        }
        return permissionsObject;
    }
    async setPermissionForUserId(userInfo, userId, permission) {
        if (userInfo.userId === userId) {
            let isOk = await this.staff.getPermissions(userId);
            if (isOk.includes(model.staff.Permission.ManageSelf) || userInfo.staff >= 100) {
            }
            else {
                throw new this.Conflict('InvalidPermissions');
            }
        }
        let permissionId = model.staff.Permission[permission];
        if (!permissionId) {
            throw new this.BadRequest('InvalidPermissionId');
        }
        await this.staff.addPermissions(userId, permissionId);
        return {};
    }
    async deletePermissionForUserId(userInfo, userId, permission) {
        if (userInfo.userId === userId) {
            let isOk = await this.staff.getPermissions(userId);
            if (isOk.includes(model.staff.Permission.ManageSelf) || userInfo.staff >= 100) {
            }
            else {
                throw new this.Conflict('InvalidPermissions');
            }
        }
        let permissionId = model.staff.Permission[permission];
        if (!permissionId) {
            throw new this.BadRequest('InvalidPermissionId');
        }
        console.log('deleted', permissionId);
        await this.staff.deletePermissions(userId, permissionId);
        return {};
    }
    async getTransactions(userInfo, offset = 0, userId) {
        return await this.economy.getUserTransactions(userId, offset);
    }
    async ban(userInfo, userId, reason, privateReason, length, lengthType, terminated, deleted) {
        const numericId = Filter_1.filterId(userId);
        if (!numericId) {
            throw new this.BadRequest('InvalidUserId');
        }
        try {
            const info = await this.user.getInfo(numericId, ['userId', 'accountStatus', 'staff']);
            if (info.staff >= userInfo.staff) {
                throw false;
            }
        }
        catch (e) {
            throw new this.BadRequest('InvalidUserId');
        }
        if (!reason || reason.length > 255) {
            throw new this.BadRequest('InvalidReason');
        }
        if (!privateReason) {
            privateReason = "";
        }
        let numericLength = Filter_1.filterId(length);
        if (!numericLength) {
            numericLength = 0;
        }
        if (lengthType !== "hours" && lengthType !== "days" && lengthType !== "months" && lengthType !== "weeks") {
            throw new this.BadRequest('InvalidLengthType');
        }
        const whenWillUserBeUnBanned = moment().add(numericLength, lengthType).format();
        let numericTerminated = Filter_1.filterId(terminated);
        if (!numericTerminated) {
            numericTerminated = 0;
        }
        else {
            numericTerminated = 1;
        }
        let numericDeleted = Filter_1.filterId(deleted);
        if (!numericDeleted) {
            numericDeleted = 0;
        }
        else {
            numericDeleted = 1;
        }
        if (privateReason.length > 1024) {
            throw new this.BadRequest('InvalidPrivateReason');
        }
        if (numericDeleted === 1 && numericTerminated === 0) {
            throw new this.BadRequest('ConstraintIfDeletedUserMustAlsoBeTerminated');
        }
        await this.user.modifyUserBanStatus(numericId, model.user.banned.true);
        await this.staff.insertBan(numericId, reason, privateReason, whenWillUserBeUnBanned, numericTerminated, userInfo.userId);
        if (numericDeleted) {
            await this.user.modifyAccountStatus(numericId, model.user.accountStatus.deleted);
        }
        else {
            if (numericTerminated) {
                await this.user.modifyAccountStatus(numericId, model.user.accountStatus.terminated);
            }
            else {
                await this.user.modifyAccountStatus(numericId, model.user.accountStatus.banned);
            }
        }
        await this.user.takeAllItemsOffSale(numericId);
        await this.staff.recordBan(userInfo.userId, numericId, model.user.banned.true);
        return {
            'success': true,
        };
    }
    async unban(userInfo, userId) {
        const numericId = Filter_1.filterId(userId);
        if (!numericId) {
            throw new this.BadRequest('InvalidUserid');
        }
        try {
            await this.user.getInfo(numericId, ['banned']);
        }
        catch (e) {
            throw new this.BadRequest('InvalidUserId');
        }
        await this.user.modifyUserBanStatus(numericId, model.user.banned.false);
        await this.user.modifyAccountStatus(numericId, model.user.accountStatus.ok);
        await this.staff.recordBan(userInfo.userId, numericId, model.user.banned.false);
        return {
            'success': true,
        };
    }
    async getAssociatedAccounts(userInfo, userId) {
        try {
            await this.user.getInfo(userId, ['userId']);
        }
        catch {
            throw new this.BadRequest('InvalidUserId');
        }
        const arrayOfAssociatedAccounts = [];
        const ipAddress = await this.user.getUserIpAddresses(userId);
        for (const ip of ipAddress) {
            const associatedAccounts = await this.user.getUserIdsAssociatedWithIpAddress(ip);
            for (const AssociatedID of associatedAccounts) {
                if (AssociatedID === userId) {
                    continue;
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
    async getUserComments(userInfo, userId, offset = 0, limit = 100) {
        const comments = await this.staff.getUserComments(userId, offset, limit);
        return {
            comments: comments,
        };
    }
    async createUserComment(userInfo, userId, comment) {
        if (!comment || comment.length < 4 || comment.length > 1024) {
            throw new this.BadRequest('CommentTooLarge');
        }
        try {
            await this.user.getInfo(userId, ['userId']);
        }
        catch {
            throw new this.BadRequest('InvalidUserId');
        }
        await this.staff.createComment(userId, userInfo.userId, comment);
        return {
            success: true,
        };
    }
    resetPassword(userInfo, userId) {
        return new Promise((resolve, reject) => {
            const staff = userInfo.staff > 1 ? true : false;
            if (!staff) {
                return reject();
            }
            const numericId = Filter_1.filterId(userId);
            if (!numericId) {
                return reject();
            }
            this.user.getInfo(numericId, ['staff']).then((userToResetInfo) => {
                if (userToResetInfo.staff > userInfo.staff || userToResetInfo.staff === 1 && userInfo.staff === 1) {
                    return reject();
                }
                crypto.randomBytes(128, async (err, newPassword) => {
                    try {
                        if (err) {
                            return reject();
                        }
                        const stringToken = newPassword.toString('hex');
                        await this.user.insertPasswordReset(numericId, stringToken);
                        resolve({
                            'success': true,
                            'code': stringToken,
                        });
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            })
                .catch((e) => {
                reject();
            });
        });
    }
    async give(userInfo, userId, catalogId) {
        const numericId = Filter_1.filterId(userId);
        if (!numericId) {
            throw new this.BadRequest('InvalidUserId');
        }
        try {
            const userInfo = await this.user.getInfo(numericId, ['banned']);
            if (userInfo.banned === model.user.banned.true) {
                throw new this.BadRequest('InvalidUserId');
            }
        }
        catch (e) {
            throw new this.BadRequest('InvalidUserId');
        }
        const numericCatalogId = Filter_1.filterId(catalogId);
        if (!numericCatalogId) {
            throw new this.BadRequest('InvalidCatalogId');
        }
        try {
            await this.catalog.getInfo(numericCatalogId, ['catalogId']);
        }
        catch (e) {
            throw new this.BadRequest('InvalidCatalogId');
        }
        let userInventoryId;
        const bdOwnership = await this.user.getUserInventoryByCatalogId(50, numericCatalogId);
        if (bdOwnership.length >= 1) {
            userInventoryId = bdOwnership[0].userInventoryId;
            await this.catalog.updateUserInventoryIdOwner(bdOwnership[0].userInventoryId, numericId);
        }
        else {
            userInventoryId = await this.catalog.createItemForUserInventory(numericId, numericCatalogId, null);
        }
        await this.staff.recordGive(userInfo.userId, numericId, numericCatalogId, userInventoryId);
        return { 'success': true };
    }
    async giveCurrency(userInfo, userId, amount, currency) {
        const numericId = Filter_1.filterId(userId);
        if (!numericId) {
            throw new this.BadRequest('InvalidUserId');
        }
        try {
            const userInfo = await this.user.getInfo(numericId, ['banned']);
            if (userInfo.banned === model.user.banned.true) {
                throw new this.BadRequest('InvalidUserId');
            }
        }
        catch (e) {
            throw new this.BadRequest('InvalidUserId');
        }
        const numericAmount = Filter_1.filterId(amount);
        if (!numericAmount) {
            throw new this.BadRequest('InvalidCurrencyAmount');
        }
        if (currency !== 1 && currency !== 2) {
            throw new this.BadRequest('InvalidCurrency');
        }
        await this.economy.addToUserBalance(numericId, numericAmount, currency);
        await this.staff.recordGiveCurrency(userInfo.userId, numericId, numericAmount, currency);
        return { 'success': true };
    }
    async getPendingModerationCatalogItems(userInfo) {
        return await this.staff.getItems();
    }
    async multiGetThumbnails(userInfo, ids) {
        const idsArray = ids.split(',');
        if (idsArray.length < 1) {
            throw new this.BadRequest('InvalidIds');
        }
        const filteredIds = [];
        idsArray.forEach((id) => {
            const userId = Filter_1.filterId(id);
            if (userId) {
                filteredIds.push(userId);
            }
        });
        const safeIds = Array.from(new Set(filteredIds));
        if (safeIds.length > 25 || safeIds.length < 1) {
            throw new this.BadRequest('InvalidIds');
        }
        return await this.staff.multiGetThumbnailsFromIdsIgnoreModeration(safeIds);
    }
    async multiGetGameThumbnails(gameIds) {
        if (!gameIds) {
            throw new this.BadRequest('InvalidIds');
        }
        const idsArray = gameIds.split(',');
        if (idsArray.length < 1) {
            throw new this.BadRequest('InvalidIds');
        }
        const filteredIds = [];
        let allIdsValid = true;
        idsArray.forEach((id) => {
            const gameId = parseInt(id, 10);
            if (!Number.isInteger(gameId)) {
                allIdsValid = false;
            }
            filteredIds.push(gameId);
        });
        const safeIds = Array.from(new Set(filteredIds));
        if (safeIds.length > 25) {
            throw new this.BadRequest('TooManyIds');
        }
        return await this.game.multiGetGameThumbnails(safeIds, true);
    }
    async updateAdState(userInfo, adId, moderationStatus) {
        if (moderationStatus !== 1 && moderationStatus !== 2) {
            throw new this.BadRequest('InvalidState');
        }
        let adInfo = await this.ad.getFullAdInfoById(adId);
        await this.staff.updateAdState(adId, moderationStatus);
        if (moderationStatus === model.catalog.moderatorStatus.Moderated) {
            await this.notification.createMessage(adInfo.userId, 1, 'Ad "' + adInfo.title + '" has been Rejected', 'Hello,\nYour ad, "' + adInfo.title + '", has been rejected by our moderation team. Please fully review our terms of service before uploading assets so that you don\'t run into this issue again. Sorry for the inconvenience,\n\n-The Moderation Team');
        }
        return {
            success: true,
        };
    }
    async updateGameThumbnailState(userInfo, gameThumbnailId, moderationStatus) {
        if (moderationStatus !== 1 && moderationStatus !== 2) {
            throw new this.BadRequest('InvalidState');
        }
        await this.staff.updateGameThumbnailState(gameThumbnailId, moderationStatus);
        return {
            success: true,
        };
    }
    async updateItemStatus(userInfo, catalogId, moderationStatus) {
        const numericCatalogId = Filter_1.filterId(catalogId);
        let itemInfo = await this.catalog.getInfo(numericCatalogId, ['creatorId', 'creatorType', 'catalogName']);
        let numericState = Filter_1.filterId(moderationStatus);
        if (!numericState) {
            numericState = 0;
        }
        if (!numericCatalogId || numericState !== 0 && numericState !== 1 && numericState !== 2) {
            throw new this.BadRequest('InvalidCatalogIdOrState');
        }
        await this.staff.updateItemStatus(numericCatalogId, numericState);
        if (numericState === model.catalog.moderatorStatus.Moderated && itemInfo.creatorType === model.catalog.creatorType.User) {
            await this.notification.createMessage(itemInfo.creatorId, 1, '"' + itemInfo.catalogName + '" has been Rejected', 'Hello,\nYour item, "' + itemInfo.catalogName + '", has been rejected by our moderation team. Please fully review our terms of service before uploading assets so that you don\'t run into this issue again. Sorry for the inconvenience,\n\n-The Moderation Team');
        }
        return {
            'success': true,
        };
    }
    async regenAvatar(userInfo, userId, allowHashes = false, yieldUntilComplete = false, setUserUrl = true) {
        const numericUserId = Filter_1.filterId(userId);
        if (!numericUserId) {
            throw new this.BadRequest('InvalidUserId');
        }
        const renderAvatar = async () => {
            try {
                const avatar = await this.user.getAvatar(numericUserId);
                const avatarColors = await this.user.getAvatarColors(numericUserId);
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
                let url;
                if (allowHashes) {
                    let _internalUrl = await this.avatar.getThumbnailHashUrl(avatarObject);
                    if (_internalUrl) {
                        url = _internalUrl;
                    }
                    else {
                        url = await this.avatar.renderAvatar('avatar', avatarObject);
                    }
                }
                else {
                    url = await this.avatar.renderAvatar('avatar', avatarObject);
                }
                if (setUserUrl) {
                    await this.user.addUserThumbnail(numericUserId, url);
                }
                return url;
            }
            catch (e) {
                console.error(e);
                throw e;
            }
        };
        if (yieldUntilComplete) {
            let url = await renderAvatar();
            return {
                success: true,
                url: url,
            };
        }
        else {
            renderAvatar().then(d => {
            }).catch(err => {
                console.error(err);
            });
        }
        return {
            'success': true,
        };
    }
    async updateBanner(userInfo, enabled, bannerText) {
        let isEnabled = Filter_1.filterId(enabled);
        if (!isEnabled) {
            isEnabled = 0;
        }
        else {
            isEnabled = 1;
        }
        if (bannerText && bannerText.length > 1024) {
            throw new this.BadRequest('InvalidBannerText');
        }
        if (isEnabled === 1) {
            await this.staff.updateBannerText(bannerText);
        }
        else {
            await this.staff.updateBannerText('');
        }
        return {
            'success': true,
        };
    }
    async deleteBlurb(userInfo, userId) {
        await this.settings.updateBlurb(userId, '[ Content Deleted ]');
        return {
            'success': true,
        };
    }
    async deleteStatus(userInfo, userId) {
        let currentStatus = await this.user.multiGetStatus([userId], 0, 1);
        if (currentStatus[0]) {
            let data = currentStatus[0];
            await this.user.updateStatusByid(data.statusId, '[ Content Deleted ]');
        }
        await this.user.updateStatus(userId, '[ Content Deleted ]');
        return {
            'success': true,
        };
    }
    async deleteForumSignature(userInfo, userId) {
        await this.settings.updateSignature(userId, '[ Content Deleted ]');
        return {
            'success': true,
        };
    }
    async disableTwoFactor(userInfo, userId) {
        await this.settings.disable2fa(userId);
        return {
            'success': true,
        };
    }
    async clearBalance(userInfo, userId, currencyTypeId) {
        if (currencyTypeId !== 1 && currencyTypeId !== 2) {
            throw new this.BadRequest('InvalidCurrencyType');
        }
        let balToGrab = 'primaryBalance';
        if (currencyTypeId === 2) {
            balToGrab = 'secondaryBalance';
        }
        let userBalance = await this.user.getInfo(userId, [balToGrab]);
        await this.economy.subtractFromUserBalance(userId, userBalance[balToGrab], currencyTypeId);
        return {
            success: true,
        };
    }
    async provideItemToUser(body) {
        const forUpdate = [
            'users',
            'user_inventory',
        ];
        await this.transaction(this, forUpdate, async function (trx) {
            for (const item of body.catalogIds) {
                let badDecisions = await trx.user.getUserInventoryByCatalogId(50, item.catalogId);
                if (badDecisions.length >= 1 && body.userIdTo !== 50) {
                    let item = badDecisions[0];
                    await trx.catalog.updateUserInventoryIdOwner(item.userInventoryId, body.userIdTo);
                }
                else {
                    await trx.catalog.createItemForUserInventory(body.userIdTo, item.catalogId);
                }
            }
        });
        return {};
    }
    async transferItem(body) {
        const forUpdate = [
            'users',
            'user_inventory',
        ];
        await this.transaction(this, forUpdate, async function (trx) {
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
    async search(offset = 0) {
        const numericOffset = Filter_1.filterOffset(offset);
        return await this.staff.search(numericOffset);
    }
    async getServerStatus(userInfo) {
        return await this.staff.getServerStatus();
    }
    async updateUserStaffRank(userInfo, userId, newRank) {
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
        }
        catch (e) {
            throw new this.BadRequest('InvalidPermissions');
        }
        await this.user.updateStaffRank(userId, newRank);
        return { success: true };
    }
    async updateForumCategory(userInfo, catId, title, description = '', weight = 0) {
        await this.forum.updateCategory(catId, title, description, weight);
        return {
            success: true,
        };
    }
    async createForumCategory(userInfo, title, description = '', weight = 0) {
        await this.forum.createCategory(title, description, weight);
        return {
            success: true,
        };
    }
    async updateForumSubCategory(userInfo, subId, catId, title, desc, readPermissionLevel, postPermissionLevel, weight = 0) {
        await this.forum.updateSubCategory(subId, catId, title, desc, readPermissionLevel, postPermissionLevel, weight);
        return {
            success: true,
        };
    }
    async createForumSubCategory(userInfo, catId, title, desc, readPermissionLevel, postPermissionLevel, weight = 0) {
        await this.forum.createSubCategory(catId, title, desc, readPermissionLevel, postPermissionLevel, weight);
        return {
            success: true,
        };
    }
    async getTickets(userInfo) {
        return this.support.getTicketsAwaitingSupportResponse();
    }
    async getAllTickets(userInfo) {
        return this.support.getTicketsNotClosed();
    }
    async getRepliesToTicket(userInfo, ticketId) {
        return await this.support.getTicketRepliesAll(ticketId);
    }
    async replyToTicket(userInfo, ticketId, body, visibleToClient = true) {
        await this.support.replyToTicket(ticketId, userInfo.userId, body, visibleToClient);
        return {
            success: true,
        };
    }
    getTicketMetaData() {
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
    async updateTicketStatus(userInfo, ticketId, status) {
        if (!model.support.TicketStatus[status]) {
            throw new this.BadRequest('InvalidTicketStatus');
        }
        await this.support.updateTicketStatus(ticketId, status);
        return {
            success: true,
        };
    }
    async updateGroupStatus(userInfo, groupId, status) {
        if (!model.group.groupStatus[status]) {
            throw new this.BadRequest('InvalidGroupStatus');
        }
        await this.group.updateGroupStatus(groupId, status);
        return {
            success: true,
        };
    }
    async latestAbuseReports(userInfo) {
        return await this.reportAbuse.latestReportedUserStatuses();
    }
    async updateAbuseReportStatus(userInfo, reportId, status) {
        if (!model.reportAbuse.ReportStatus[status]) {
            throw new this.BadRequest('InvalidStatus');
        }
        await this.reportAbuse.updateUserStatusReportStatus(reportId, status);
        return {
            success: true,
        };
    }
    async deleteUserStatusId(userInfo, userStatusId) {
        let info = await this.user.getStatusById(userStatusId);
        await this.user.updateStatusByid(userStatusId, '[ Content Deleted ]');
        await this.user.updateStatusWithoutInsert(info.userId, '[ Content Deleted ]');
        return {
            success: true,
        };
    }
    async getTradeItems(userInfo, numericTradeId, userId) {
        let tradeInfo;
        try {
            tradeInfo = await this.economy.getTradeById(numericTradeId);
        }
        catch (e) {
            throw new this.BadRequest('InvalidTradeId');
        }
        if (tradeInfo.userIdOne === userId) {
            const requestedTradeItems = await this.economy.getTradeItems(model.economy.tradeSides.Requested, numericTradeId);
            const requesteeTradeItems = await this.economy.getTradeItems(model.economy.tradeSides.Requester, numericTradeId);
            return { 'requested': requestedTradeItems, 'offer': requesteeTradeItems };
        }
        else if (tradeInfo.userIdTwo === userId) {
            const requestedTradeItems = await this.economy.getTradeItems(model.economy.tradeSides.Requester, numericTradeId);
            const requesteeTradeItems = await this.economy.getTradeItems(model.economy.tradeSides.Requested, numericTradeId);
            return { 'requested': requestedTradeItems, 'offer': requesteeTradeItems };
        }
        else {
            throw new this.BadRequest('InvalidTradeId');
        }
    }
    async getTrades(userInfo, tradeType, userId, offset = 0) {
        if (!(userInfo.staff >= 2)) {
            throw new this.BadRequest('InvalidPermissions');
        }
        let tradeValue;
        if (tradeType !== 'inbound' && tradeType !== 'outbound' && tradeType !== 'completed' && tradeType !== 'inactive') {
            throw new this.BadRequest('InvalidTradeType');
        }
        else {
            tradeValue = tradeType;
        }
        return await this.economy.getTrades(userId, tradeValue, offset);
    }
    async updateIsGameDevPermission(userInfo, userId, isDeveloper) {
        if (!(userInfo.staff >= 2)) {
            throw new this.BadRequest('InvalidPermissions');
        }
        await this.user.updateIsDeveloper(userId, isDeveloper);
        return {};
    }
    async deleteImpersonation(req) {
        if (req.session) {
            delete req.session.impersonateUserId;
        }
        return {};
    }
    async createImpersonation(userInfo, req, userId) {
        let info = await this.user.getInfo(userId);
        if (info.staff >= userInfo.staff) {
            throw new Error('Cannot impersonate this user');
        }
        if (req.session) {
            req.session.impersonateUserId = userId;
        }
        return {};
    }
};
__decorate([
    common_1.Get('/permissions'),
    swagger_1.Summary('Get all permissions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "getPermissions", null);
__decorate([
    common_1.Get('/permissions/:userId'),
    swagger_1.Summary('Get permissions for the {userId}'),
    common_1.Use(Auth_1.YesAuth, middleware.staff.validate(0)),
    __param(0, common_1.PathParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "getPermissionsForUserId", null);
__decorate([
    common_1.Put('/permissions/:userId/:permission'),
    swagger_1.Summary('Give a permission to the {userId}'),
    common_1.Use(Auth_1.YesAuth, auth_1.csrf, middleware.staff.validate(model.staff.Permission.ManageStaff)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.PathParams('userId', Number)),
    __param(2, common_1.Required()),
    __param(2, common_1.PathParams('permission', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, String]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "setPermissionForUserId", null);
__decorate([
    common_1.Delete('/permissions/:userId/:permission'),
    swagger_1.Summary('Remove a permission from the {userId}'),
    common_1.Use(Auth_1.YesAuth, auth_1.csrf, middleware.staff.validate(model.staff.Permission.ManageStaff)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.PathParams('userId', Number)),
    __param(2, common_1.Required()),
    __param(2, common_1.PathParams('permission', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, String]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "deletePermissionForUserId", null);
__decorate([
    common_1.Get('/user/:userId/transactions'),
    swagger_1.Summary('Get transaction history for the {userId}'),
    common_1.Use(Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.ReviewUserInformation)),
    swagger_1.ReturnsArray(200, { type: model.economy.userTransactions }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.QueryParams('offset', Number)),
    __param(2, common_1.PathParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "getTransactions", null);
__decorate([
    common_1.Post('/user/:userId/ban'),
    swagger_1.Summary('Ban a user'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.BanUser)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('userId', Number)),
    __param(2, common_1.BodyParams('reason', String)),
    __param(3, common_1.BodyParams('privateReason', String)),
    __param(4, common_1.BodyParams('length', String)),
    __param(5, common_1.BodyParams('lengthType', String)),
    __param(6, common_1.BodyParams('terminated', String)),
    __param(7, common_1.BodyParams('deleted', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "ban", null);
__decorate([
    common_1.Post('/user/:userId/unban'),
    swagger_1.Summary('Unban a user'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.UnbanUser)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "unban", null);
__decorate([
    common_1.Get('/user/:userId/associated-accounts'),
    swagger_1.Summary('Get potentially associated accounts in respect to the provided userId. Can return duplicate results. Results should be taken with a grain of salt'),
    common_1.Use(Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.ReviewUserInformation)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "getAssociatedAccounts", null);
__decorate([
    common_1.Get('/user/:userId/comments'),
    swagger_1.Summary('Get staff comments posted to a userId'),
    common_1.Use(Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.ReviewUserInformation)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('userId', Number)),
    __param(2, common_1.QueryParams('offset', Number)),
    __param(3, common_1.QueryParams('limit', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number, Number]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "getUserComments", null);
__decorate([
    common_1.Post('/user/:userId/comment'),
    swagger_1.Summary('Post a comment to a user profile'),
    common_1.Use(Auth_1.YesAuth, auth_1.csrf, middleware.staff.validate(model.staff.Permission.ReviewUserInformation)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('userId', Number)),
    __param(2, common_1.BodyParams('comment', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, String]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "createUserComment", null);
__decorate([
    common_1.Post('/user/:userId/resetpassword'),
    swagger_1.Summary('Reset a users password. Returns a link for the staff member to give to the user'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.ResetPassword)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "resetPassword", null);
__decorate([
    common_1.Post('/user/:userId/give/:catalogId'),
    swagger_1.Summary('Give an item to a user'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.GiveItemToUser)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('userId', Number)),
    __param(2, common_1.PathParams('catalogId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "give", null);
__decorate([
    common_1.Put('/user/:userId/currency'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.GiveCurrencyToUser)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('userId', Number)),
    __param(2, common_1.BodyParams('amount', Number)),
    __param(3, common_1.BodyParams('currency', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number, Number]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "giveCurrency", null);
__decorate([
    common_1.Get('/catalog/pending'),
    common_1.Use(Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.ReviewPendingItems)),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "getPendingModerationCatalogItems", null);
__decorate([
    common_1.Get('/catalog/thumbnails'),
    swagger_1.Summary('Multi-get thumbnails, ignoring moderation state'),
    common_1.Use(Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.ReviewPendingItems)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.QueryParams('ids', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, String]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "multiGetThumbnails", null);
__decorate([
    common_1.Get('/thumbnails'),
    swagger_1.Summary('Multi-get thumbnails by CSV of gameIds, ignoring moderation'),
    swagger_1.Description('Invalid IDs will be filtered out'),
    swagger_1.ReturnsArray(200, { type: model.game.GameThumbnail }),
    common_1.Use(Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.ReviewPendingItems)),
    __param(0, common_1.Required()),
    __param(0, common_1.QueryParams('ids', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "multiGetGameThumbnails", null);
__decorate([
    common_1.Patch('/ad/:adId/'),
    swagger_1.Summary('Update ad item state'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.ManageAssets)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('adId', Number)),
    __param(2, common_1.BodyParams('state', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "updateAdState", null);
__decorate([
    common_1.Patch('/game-thumbnail/:gameThumbnailId/'),
    swagger_1.Summary('Update a game thumbnail item state'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.ReviewPendingItems)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('gameThumbnailId', Number)),
    __param(2, common_1.BodyParams('state', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "updateGameThumbnailState", null);
__decorate([
    common_1.Patch('/catalog/:catalogId'),
    swagger_1.Summary('Update items moderation state'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.ReviewPendingItems)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('catalogId', Number)),
    __param(2, common_1.BodyParams('state', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "updateItemStatus", null);
__decorate([
    common_1.Post('/user/:userId/avatar'),
    swagger_1.Summary('Force a users avatar to be [re]generated'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.RegenerateThumbnails)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('userId', Number)),
    __param(2, common_1.QueryParams('allowHashes', Boolean)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Boolean, Boolean, Boolean]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "regenAvatar", null);
__decorate([
    common_1.Patch('/banner'),
    swagger_1.Summary('Update site-wide banner text'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.ManageBanner)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.BodyParams('enabled', Number)),
    __param(2, common_1.BodyParams('text', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, String]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "updateBanner", null);
__decorate([
    common_1.Delete('/user/:userId/blurb'),
    swagger_1.Summary('Delete a users blurb'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.ManagePublicUserInfo)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "deleteBlurb", null);
__decorate([
    common_1.Delete('/user/:userId/status'),
    swagger_1.Summary('Delete a users status'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.ManagePublicUserInfo)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "deleteStatus", null);
__decorate([
    common_1.Delete('/user/:userId/forum/signature'),
    swagger_1.Summary('Delete a users forum signature'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.ManagePublicUserInfo)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "deleteForumSignature", null);
__decorate([
    common_1.Delete('/user/:userId/two-factor'),
    swagger_1.Summary('Disable an accounts two-factor authentcation'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.ManagePrivateUserInfo)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "disableTwoFactor", null);
__decorate([
    common_1.Delete('/user/:userId/clear-balance/:currencyTypeId'),
    swagger_1.Summary('Clear the balance of the {currencyTypeId} for the {userId}'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.TakeCurrencyFromUser)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('userId', Number)),
    __param(2, common_1.PathParams('currencyTypeId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "clearBalance", null);
__decorate([
    common_1.Put('/user/inventory/provide-items'),
    swagger_1.Summary('Provide items to the {userId}'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.GiveItemToUser)),
    __param(0, common_1.Required()),
    __param(0, common_1.BodyParams(model.staff.ProvideItemsRequest)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.staff.ProvideItemsRequest]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "provideItemToUser", null);
__decorate([
    common_1.Patch('/user/inventory/transfer-item'),
    swagger_1.Summary('Transfer one or more item(s) from the {userId}'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.TakeItemFromUser, model.staff.Permission.GiveItemToUser)),
    __param(0, common_1.Required()),
    __param(0, common_1.BodyParams(model.staff.TransferItemsRequest)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.staff.TransferItemsRequest]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "transferItem", null);
__decorate([
    common_1.Get('/search'),
    swagger_1.Summary('Search staff'),
    __param(0, common_1.QueryParams('offset', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "search", null);
__decorate([
    common_1.Get('/status/web'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.ManageWeb)),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "getServerStatus", null);
__decorate([
    common_1.Patch('/user/:userId/rank'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.ManageStaff)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('userId', Number)),
    __param(2, common_1.BodyParams('rank', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "updateUserStaffRank", null);
__decorate([
    common_1.Patch('/forum/category/:categoryId'),
    swagger_1.Summary('Update a forum category'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.ManageForumCategories)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.PathParams('categoryId', Number)),
    __param(2, common_1.Required()),
    __param(2, common_1.BodyParams('title', String)),
    __param(3, common_1.Required()),
    __param(3, common_1.BodyParams('description', String)),
    __param(4, common_1.Required()),
    __param(4, common_1.BodyParams('weight', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, String, String, Number]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "updateForumCategory", null);
__decorate([
    common_1.Put('/forum/category/'),
    swagger_1.Summary('Update a forum category'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.ManageForumCategories)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.BodyParams('title', String)),
    __param(2, common_1.Required()),
    __param(2, common_1.BodyParams('description', String)),
    __param(3, common_1.Required()),
    __param(3, common_1.BodyParams('weight', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, String, String, Number]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "createForumCategory", null);
__decorate([
    common_1.Patch('/forum/sub-category/:subCategoryId'),
    swagger_1.Summary('Update a forum subCategory'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.ManageForumCategories)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.PathParams('subCategoryId', Number)),
    __param(2, common_1.Required()),
    __param(2, common_1.BodyParams('categoryId', Number)),
    __param(3, common_1.Required()),
    __param(3, common_1.BodyParams('title', String)),
    __param(4, common_1.Required()),
    __param(4, common_1.BodyParams('description', String)),
    __param(5, common_1.Required()),
    __param(5, common_1.BodyParams('readPermissionLevel', Number)),
    __param(6, common_1.Required()),
    __param(6, common_1.BodyParams('postPermissionLevel', Number)),
    __param(7, common_1.BodyParams('weight', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number, String, String, Number, Number, Number]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "updateForumSubCategory", null);
__decorate([
    common_1.Put('/forum/sub-category/'),
    swagger_1.Summary('Create a forum subCategory'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.ManageForumCategories)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.BodyParams('categoryId', Number)),
    __param(2, common_1.Required()),
    __param(2, common_1.BodyParams('title', String)),
    __param(3, common_1.Required()),
    __param(3, common_1.BodyParams('description', String)),
    __param(4, common_1.Required()),
    __param(4, common_1.BodyParams('readPermissionLevel', Number)),
    __param(5, common_1.Required()),
    __param(5, common_1.BodyParams('postPermissionLevel', Number)),
    __param(6, common_1.BodyParams('weight', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, String, String, Number, Number, Number]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "createForumSubCategory", null);
__decorate([
    common_1.Get('/support/tickets-awaiting-response'),
    swagger_1.Summary('Get support tickets awaiting cs response'),
    common_1.Use(Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.ManageSupportTickets)),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "getTickets", null);
__decorate([
    common_1.Get('/support/tickets-all'),
    swagger_1.Summary('Get all support tickets, excluding ones that are closed'),
    common_1.Use(Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.ManageSupportTickets)),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "getAllTickets", null);
__decorate([
    common_1.Get('/support/ticket/:ticketId/replies'),
    swagger_1.Summary('Get replies to ticket'),
    common_1.Use(Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.ManageSupportTickets)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('ticketId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "getRepliesToTicket", null);
__decorate([
    common_1.Post('/support/ticket/:ticketId/reply'),
    swagger_1.Summary('Reply to a ticket'),
    common_1.Use(Auth_1.YesAuth, auth_1.csrf, middleware.staff.validate(model.staff.Permission.ManageSupportTickets)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('ticketId', Number)),
    __param(2, common_1.BodyParams('body', String)),
    __param(3, common_1.BodyParams('visibleToClient', Boolean)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, String, Boolean]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "replyToTicket", null);
__decorate([
    common_1.Get('/support/ticket/metadata'),
    swagger_1.Summary('Get ticket meta-data'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], StaffController.prototype, "getTicketMetaData", null);
__decorate([
    common_1.Patch('/support/ticket/:ticketId/status'),
    swagger_1.Summary('Update ticket_status'),
    common_1.Use(Auth_1.YesAuth, auth_1.csrf, middleware.staff.validate(model.staff.Permission.ManageSupportTickets)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('ticketId', Number)),
    __param(2, common_1.BodyParams('status', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "updateTicketStatus", null);
__decorate([
    common_1.Patch('/groups/:groupId/status'),
    swagger_1.Summary('Update a groups status'),
    common_1.Use(Auth_1.YesAuth, auth_1.csrf, middleware.staff.validate(model.staff.Permission.ManageGroup)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __param(2, common_1.BodyParams('status', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "updateGroupStatus", null);
__decorate([
    common_1.Get('/feed/friends/abuse-reports'),
    swagger_1.Summary('Get latest abuse reports for friend feed'),
    common_1.Use(Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.ReviewAbuseReports)),
    swagger_1.ReturnsArray(200, { type: model.reportAbuse.ReportedStatusEntry }),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "latestAbuseReports", null);
__decorate([
    common_1.Patch('/feed/friends/abuse-report/:reportId/'),
    swagger_1.Summary('Update a friends feed abuse-report status'),
    common_1.Use(Auth_1.YesAuth, auth_1.csrf, middleware.staff.validate(model.staff.Permission.ReviewAbuseReports)),
    swagger_1.Returns(200, { description: 'Abuse report has been updated' }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('reportId', Number)),
    __param(2, common_1.Required()),
    __param(2, common_1.BodyParams('status', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "updateAbuseReportStatus", null);
__decorate([
    common_1.Delete('/feed/friends/:userStatusId'),
    swagger_1.Summary('Delete a userStatusId'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    common_1.Use(Auth_1.YesAuth, auth_1.csrf, middleware.staff.validate(model.staff.Permission.ManagePublicUserInfo)),
    swagger_1.Returns(200, { description: 'Status Deleted' }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('userStatusId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "deleteUserStatusId", null);
__decorate([
    common_1.Get('/economy/trades/:tradeId/items'),
    swagger_1.Summary('Get the items involved in a specific tradeId'),
    swagger_1.Description('Requestee is authenticated user, requested is the partner involved with the trade'),
    swagger_1.Returns(200, { type: model.economy.TradeItemsResponse }),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidTradeId: TradeId is invalid or you do not have permission to view it\n' }),
    common_1.Use(Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.ManagePublicUserInfo)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('tradeId', Number)),
    __param(2, common_1.Required()),
    __param(2, swagger_1.Description('userId to impersonate')),
    __param(2, common_1.QueryParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "getTradeItems", null);
__decorate([
    common_1.Get('/economy/trades/:type'),
    swagger_1.Summary('Get user trades'),
    common_1.Use(Auth_1.YesAuth, middleware.staff.validate(model.staff.Permission.ManagePublicUserInfo)),
    swagger_1.ReturnsArray(200, { type: model.economy.TradeInfo }),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidTradeType: TradeType must be one of: inbound,outbound,completed,inactive\n' }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('type', String)),
    __param(2, common_1.Required()),
    __param(2, swagger_1.Description('userId to impersonate')),
    __param(2, common_1.QueryParams('userId', Number)),
    __param(3, common_1.QueryParams('offset', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, String, Number, Number]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "getTrades", null);
__decorate([
    common_1.Post('/user/:userId/game-dev'),
    swagger_1.Summary('Modify is_developer state of the {userId}'),
    common_1.Use(Auth_1.YesAuth, auth_1.csrf, middleware.staff.validate(model.staff.Permission.ManagePublicUserInfo)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.PathParams('userId', Number)),
    __param(2, common_1.Required()),
    __param(2, common_1.BodyParams('isDeveloper', Boolean)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Boolean]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "updateIsGameDevPermission", null);
__decorate([
    common_1.Delete('/user/session-impersonation'),
    swagger_1.Summary('Disable impersonation'),
    common_1.Use(Auth_1.YesAuth, auth_1.csrf, middleware.staff.validate(model.staff.Permission.ImpersonateUser)),
    __param(0, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "deleteImpersonation", null);
__decorate([
    common_1.Put('/user/session-impersonation'),
    swagger_1.Summary('Impersonate a user'),
    common_1.Use(Auth_1.YesAuth, auth_1.csrf, middleware.staff.validate(model.staff.Permission.ImpersonateUser)),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Req()),
    __param(2, common_1.Required()),
    __param(2, common_1.BodyParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Object, Number]),
    __metadata("design:returntype", Promise)
], StaffController.prototype, "createImpersonation", null);
StaffController = __decorate([
    common_1.Controller('/staff'),
    __metadata("design:paramtypes", [])
], StaffController);
exports.StaffController = StaffController;

