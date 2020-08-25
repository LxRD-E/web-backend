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
const common_1 = require("@tsed/common");
const swagger_1 = require("@tsed/swagger");
const model = require("../../models/models");
const middleware = require("../../middleware/middleware");
const auth_1 = require("../../dal/auth");
const controller_1 = require("../controller");
const Auth_1 = require("../../middleware/Auth");
const moment = require("moment");
let FeedController = class FeedController extends controller_1.default {
    constructor() {
        super();
    }
    async imageProxyGrabber(req, res, url) {
        let imageUrl = this.auth.decodeImageProxyQuery(url);
        let imageBuffer = await this.auth.fetchImageAndResize(imageUrl);
        res.set({
            'expires': moment().add(1, 'years').format("ddd, DD MMM YYYY hh:mm:ss [GMT]"),
            'cache-control': 'public, max-age=31536000',
            'content-type': imageBuffer.type,
        });
        res.send(imageBuffer.image).end();
    }
    async multiGetOgTagInfo(userInfo, ids) {
        let urlsToMatch = [
            /https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z\d-_+]+)/g,
            /https:\/\/www\.roblox\.com\/([a-zA-Z\d-_+\/]+)/g,
            /https:\/\/www\.hindigamer\.club\/([a-zA-Z\d-_+\/]+)/g,
            /https:\/\/hindigamer\.club\/([a-zA-Z\d-_+\/]+)/g,
        ];
        let userAgeInfo = await this.user.getInfo(userInfo.userId, ['birthDate']);
        let userAge = moment(userAgeInfo.birthDate);
        if (userInfo.staff >= 1 || userAge.isSameOrBefore(moment().subtract(18, 'years'))) {
            urlsToMatch = [
                /(https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/g
            ];
        }
        else if (userAge.isSameOrBefore(moment().subtract(13, 'years'))) {
            urlsToMatch.push(/https:\/\/discord\.gg\/([a-zA-Z\d-_+\/]+)/g, /https:\/\/discordapp\.com\/([a-zA-Z\d-_+\/]+)/g, /https:\/\/www\.facebook\.com\/([a-zA-Z\d-_+?&.]+)/g, /https:\/\/facebook\.com\/([a-zA-Z\d-_+?&.]+)/g);
            if (userAge.isSameOrBefore(moment().subtract(18, 'years'))) {
                urlsToMatch = [
                    /(https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/g
                ];
            }
        }
        let idsArray = ids.split(',');
        let numberArrOfIDs = [];
        for (const id of idsArray) {
            let num = parseInt(id, 10);
            if (Number.isInteger(num)) {
                numberArrOfIDs.push(num);
            }
        }
        if (numberArrOfIDs.length === 0) {
            return [];
        }
        if (numberArrOfIDs.length > 15) {
            throw new this.BadRequest('TooManyIds');
        }
        let urlsToGrab = [];
        let multiGetStatuses = await this.user.multiGetStatusById([...new Set(numberArrOfIDs)]);
        let jobsToProcess = [];
        for (const statusData of multiGetStatuses) {
            const processStatus = async (statusData) => {
                if (userInfo.staff >= 1 === false) {
                    let info = await this.user.getFriendshipStatus(userInfo.userId, statusData.userId);
                    if (!info.areFriends && userInfo.userId !== statusData.userId) {
                        throw new this.BadRequest('InvalidStatusId');
                    }
                }
                let urls = undefined;
                for (const matchItem of urlsToMatch) {
                    if (!statusData.status) {
                        continue;
                    }
                    let matchDataUrl = statusData.status.match(matchItem);
                    if (matchDataUrl && matchDataUrl[0]) {
                        urls = matchDataUrl;
                        break;
                    }
                }
                if (urls) {
                    urlsToGrab.push({
                        statusId: statusData.statusId,
                        urls: urls,
                    });
                }
            };
            jobsToProcess.push(processStatus(statusData));
        }
        await Promise.all(jobsToProcess);
        return await this.auth.multiGetOgTagsForYoutubeLinks(urlsToGrab);
    }
    async getFeedForFriends(userInfo, offset = 0, limit = 100) {
        let friends = await this.user.getFriends(userInfo.userId, 0, 200, 'asc');
        const arrayOfIds = [];
        friends.forEach((obj) => {
            arrayOfIds.push(obj.userId);
        });
        arrayOfIds.push(userInfo.userId);
        if (arrayOfIds.length === 0) {
            return [];
        }
        let feed = await this.user.multiGetStatus(arrayOfIds, offset, limit);
        let idsForStatus = [];
        for (const id of feed) {
            idsForStatus.push(id.statusId);
        }
        let resultsForMultiGetReactionStatus = await this.user.multiGetReactionStatusForUser(userInfo.userId, idsForStatus, '❤️');
        for (const item of feed) {
            for (const reactionInfo of resultsForMultiGetReactionStatus) {
                if (reactionInfo.statusId === item.statusId) {
                    item.didReactWithHeart = reactionInfo.didReact;
                    break;
                }
            }
        }
        return feed;
    }
    async getUsersWhoReactedToStatus(userInfo, statusId) {
        let usersWhoReacted = await this.user.getUsersWhoReactedToStatus(statusId, '❤️');
        return usersWhoReacted;
    }
    async addCommentToStatus(userInfo, statusId, comment) {
        if (!comment || !comment.replace(/\s+/g, '') || comment.length > 4096) {
            throw new this.BadRequest('InvalidComment');
        }
        let canPost = await this.user.canUserPostCommentToStatus(userInfo.userId);
        if (!canPost) {
            throw new this.Conflict('Cooldown');
        }
        await this.user.addCommentToStatus(statusId, userInfo.userId, comment);
        return {
            success: true,
        };
    }
    async getCommentsForStatus(statusId, offset = 0, limit = 25) {
        let comments = await this.user.getCommentsToStatus(statusId, offset, limit);
        return comments;
    }
    async getRepliesToComment(userInfo, statusId, commentId, limit = 100, offset = 0) {
        let comments = await this.user.getRepliesToStatusComment(commentId, offset, limit);
        return comments;
    }
    async replyToUserStatusComment(userInfo, reply, statusId, commentId) {
        if (!reply || !reply.replace(/\s+/g, '') || reply.length > 4096) {
            throw new this.BadRequest('InvalidReply');
        }
        let canPost = await this.user.canUserPostCommentToStatus(userInfo.userId);
        if (!canPost) {
            throw new this.Conflict('Cooldown');
        }
        try {
            await this.user.getUserStatusCommentById(commentId, statusId);
        }
        catch (e) {
            throw new this.BadRequest('InvalidCommentId');
        }
        await this.user.replyToUserStatusComment(commentId, userInfo.userId, reply);
        return {
            success: true,
        };
    }
    async addReactionToStatus(userInfo, statusId, reactionType) {
        if (reactionType !== 'heart') {
            throw new this.BadRequest('InvalidReactionType');
        }
        if (await this.user.checkIfAlreadyReacted(statusId, userInfo.userId, '❤️')) {
            throw new this.Conflict('AlreadyReactedToStatus');
        }
        await this.user.addReactionToStatus(statusId, userInfo.userId, '❤️');
        return {
            success: true,
        };
    }
    async deleteReactionToStatus(userInfo, statusId, reactionType) {
        if (reactionType !== 'heart') {
            throw new this.BadRequest('InvalidReactionType');
        }
        if (!await this.user.checkIfAlreadyReacted(statusId, userInfo.userId, '❤️')) {
            throw new this.Conflict('NotReactedToStatus');
        }
        await this.user.removeReactionToStatus(statusId, userInfo.userId, '❤️');
        return {
            success: true,
        };
    }
    async getFeedForGroups(userInfo, offset = 0, limit = 100) {
        let groups = await this.user.getGroups(userInfo.userId);
        const arrayOfIds = [];
        groups.forEach(obj => arrayOfIds.push(obj.groupId));
        if (arrayOfIds.length === 0) {
            return [];
        }
        let goodGroups = [];
        for (const item of arrayOfIds) {
            let permissions = await this.group.getUserRole(item, userInfo.userId);
            if (permissions.permissions.getShout) {
                goodGroups.push(item);
            }
        }
        let feed = await this.group.getShouts(goodGroups, limit, offset);
        return feed;
    }
    async updateStatus(userInfo, newStatus) {
        if (newStatus.length > 255 || newStatus.length < 1) {
            throw new this.BadRequest('InvalidStatus');
        }
        const latestUpdate = await this.user.getUserLatestStatus(userInfo.userId);
        if (latestUpdate && !moment().isSameOrAfter(moment(latestUpdate.date).add(1, "minutes"))) {
            throw new this.BadRequest('Cooldown');
        }
        let statusId = await this.user.updateStatus(userInfo.userId, newStatus);
        return { statusId: statusId };
    }
};
__decorate([
    common_1.Get('/preview-proxy'),
    swagger_1.Summary('Image preview proxy'),
    common_1.Use(Auth_1.YesAuth),
    __param(0, common_1.Req()),
    __param(1, common_1.Res()),
    __param(2, common_1.Required()),
    __param(2, common_1.QueryParams('url', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], FeedController.prototype, "imageProxyGrabber", null);
__decorate([
    common_1.Get('/friends/multi-get-og-info'),
    swagger_1.Summary('Multi-get og-tag info (thumbnails, titles, descriptions, videos, etc) for the specified {userStatusId}s'),
    swagger_1.Description('Currently only checks the first URL in the post, although it may be expanded to check for multiple URLs in the future'),
    common_1.Use(Auth_1.YesAuth),
    swagger_1.ReturnsArray(200, { type: model.feed.MultiGetOgInfoResponse }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.QueryParams('ids', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, String]),
    __metadata("design:returntype", Promise)
], FeedController.prototype, "multiGetOgTagInfo", null);
__decorate([
    common_1.Get('/friends'),
    swagger_1.Summary('Get the authenticated user\'s friends feed. Includes their own statuses.'),
    swagger_1.ReturnsArray(200, { type: model.user.UserStatusForAuthenticated }),
    swagger_1.Returns(401, { type: model.Error, description: 'LoginRequired: Login Required\n' }),
    common_1.UseBeforeEach(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.QueryParams('offset')),
    __param(2, common_1.QueryParams('limit', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Object]),
    __metadata("design:returntype", Promise)
], FeedController.prototype, "getFeedForFriends", null);
__decorate([
    common_1.Get('/friends/:userStatusId/reactions'),
    swagger_1.Summary('Get a list of users who hearted the {userStatusId}. Only returns the first 25 users.'),
    common_1.Use(Auth_1.YesAuth, middleware.feed.ConfirmPermissionForStatus),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('userStatusId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], FeedController.prototype, "getUsersWhoReactedToStatus", null);
__decorate([
    common_1.Post('/friends/:userStatusId/comment'),
    swagger_1.Summary('Add a comment to the {userStatusId}'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.feed.ConfirmPermissionForStatus),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('userStatusId', Number)),
    __param(2, common_1.BodyParams('comment', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, String]),
    __metadata("design:returntype", Promise)
], FeedController.prototype, "addCommentToStatus", null);
__decorate([
    common_1.Get('/friends/:userStatusId/comments'),
    swagger_1.Summary('Get comments to the {userStatusId}'),
    swagger_1.ReturnsArray(200, { type: model.user.UserStatusComment }),
    common_1.Use(Auth_1.YesAuth, middleware.feed.ConfirmPermissionForStatus),
    __param(0, common_1.PathParams('userStatusId', Number)),
    __param(1, common_1.QueryParams('offset', Number)),
    __param(2, common_1.QueryParams('limit', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", Promise)
], FeedController.prototype, "getCommentsForStatus", null);
__decorate([
    common_1.Get('/friends/:userStatusId/comment/:commentId/replies'),
    swagger_1.Summary('Get replies to a {commentId}'),
    common_1.Use(Auth_1.YesAuth, middleware.feed.ConfirmPermissionForStatus),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('userStatusId', Number)),
    __param(2, common_1.PathParams('commentId', Number)),
    __param(3, common_1.QueryParams('limit', Number)),
    __param(4, common_1.QueryParams('offset', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number, Number, Number]),
    __metadata("design:returntype", Promise)
], FeedController.prototype, "getRepliesToComment", null);
__decorate([
    common_1.Post('/friends/:userStatusId/comment/:commentId/reply'),
    swagger_1.Summary('Post a reply to a {commentId}'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.feed.ConfirmPermissionForStatus),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.BodyParams('reply', String)),
    __param(2, common_1.PathParams('userStatusId', Number)),
    __param(3, common_1.PathParams('commentId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession, String, Number, Number]),
    __metadata("design:returntype", Promise)
], FeedController.prototype, "replyToUserStatusComment", null);
__decorate([
    common_1.Post('/friends/:userStatusId/react'),
    swagger_1.Summary('Add a heart reaction to the {userStatusId}'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.feed.ConfirmPermissionForStatus),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('userStatusId', Number)),
    __param(2, common_1.BodyParams('reactionType', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, String]),
    __metadata("design:returntype", Promise)
], FeedController.prototype, "addReactionToStatus", null);
__decorate([
    common_1.Delete('/friends/:userStatusId/react'),
    swagger_1.Summary('Delete your reaction to a {userStatusId}'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.feed.ConfirmPermissionForStatus),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('userStatusId', Number)),
    __param(2, common_1.BodyParams('reactionType', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, String]),
    __metadata("design:returntype", Promise)
], FeedController.prototype, "deleteReactionToStatus", null);
__decorate([
    common_1.Get('/groups'),
    swagger_1.Summary('Get the authenticated user\'s groups feed.'),
    swagger_1.ReturnsArray(200, { type: model.group.groupShout }),
    swagger_1.Returns(401, { type: model.Error, description: 'LoginRequired: Login Required\n' }),
    common_1.UseBeforeEach(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.QueryParams('offset')),
    __param(2, common_1.QueryParams('limit', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Object]),
    __metadata("design:returntype", Promise)
], FeedController.prototype, "getFeedForGroups", null);
__decorate([
    common_1.Patch('/status'),
    swagger_1.Summary('Update the authenticated user\'s status'),
    swagger_1.Returns(200, { type: model.user.UserStatusUpdatedResponse }),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidStatus: Status is too long or too short\nCooldown: You cannot change your status right now\n' }),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.BodyParams("status", String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, String]),
    __metadata("design:returntype", Promise)
], FeedController.prototype, "updateStatus", null);
FeedController = __decorate([
    common_1.Controller('/feed'),
    swagger_1.Description('User friend and groups feed'),
    __metadata("design:paramtypes", [])
], FeedController);
exports.default = FeedController;

