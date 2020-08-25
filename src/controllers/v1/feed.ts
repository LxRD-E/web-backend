/**
 * Imports
 */
// TSed
import {
    BodyParams,
    Controller,
    Delete,
    Get,
    Locals,
    Patch,
    PathParams,
    Post,
    QueryParams,
    Req,
    Required,
    Res,
    Use,
    UseBeforeEach
} from "@tsed/common";
import { Description, Returns, ReturnsArray, Summary } from "@tsed/swagger"; // import swagger Ts.ED module
// Models
import * as model from '../../models/models';
// Middleware
import * as middleware from '../../middleware/middleware';
// Auth stuff
import { csrf } from '../../dal/auth';
// Autoload
import controller from '../controller';
import { YesAuth } from "../../middleware/Auth";
import moment = require('moment');

/**
 * Feed Controller
 */
@Controller('/feed')
@Description('User friend and groups feed')
export default class FeedController extends controller {

    constructor() {
        super();
    }

    @Get('/preview-proxy')
    @Summary('Image preview proxy')
    @Use(YesAuth)
    public async imageProxyGrabber(
        @Req() req: Req,
        @Res() res: Res,
        @Required()
        @QueryParams('url', String) url: string
    ) {
        /*
        let refererValue: string|undefined = req.headers['referer'];
        if (!refererValue) {
            throw new Error('No Referer Specified');
        }
        let goodReferers = [
            'https://blockshub.net',
            'http://blockshub.net',
            'https://www.blockshub.net',
            'http://www.blockshub.net',
            'http://localhost:3000',
            'http://localhost.:3000',
        ];
        refererValue = refererValue.toLowerCase();
        let goodReferer = false;
        for (const referer of goodReferers) {
            if (refererValue.slice(0, referer.length) === referer) {
                goodReferer = true;
                break;
            }
        }
        if (!goodReferer) {
            throw new Error('Referer is not from valid origin');
        }
         */
        // first, decode it
        let imageUrl = this.auth.decodeImageProxyQuery(url);
        // fetch the image
        let imageBuffer = await this.auth.fetchImageAndResize(imageUrl);
        // return it

        res.set({
            'expires': moment().add(1, 'years').format("ddd, DD MMM YYYY hh:mm:ss [GMT]"),
            'cache-control': 'public, max-age=31536000',
            'content-type': imageBuffer.type,
        });
        res.send(imageBuffer.image).end();
    }

    @Get('/friends/multi-get-og-info')
    @Summary('Multi-get og-tag info (thumbnails, titles, descriptions, videos, etc) for the specified {userStatusId}s')
    @Description('Currently only checks the first URL in the post, although it may be expanded to check for multiple URLs in the future')
    @Use(YesAuth)
    @ReturnsArray(200, { type: model.feed.MultiGetOgInfoResponse })
    public async multiGetOgTagInfo(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @QueryParams('ids', String) ids: string,
    ) {
        // urls to match for users of any age
        let urlsToMatch = [
            /https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z\d-_+]+)/g,
            /https:\/\/www\.roblox\.com\/([a-zA-Z\d-_+\/]+)/g,
            /https:\/\/www\.hindigamer\.club\/([a-zA-Z\d-_+\/]+)/g,
            /https:\/\/hindigamer\.club\/([a-zA-Z\d-_+\/]+)/g,
        ];
        // check age of user
        let userAgeInfo = await this.user.getInfo(userInfo.userId, ['birthDate']);
        let userAge = moment(userAgeInfo.birthDate);
        if (userInfo.staff >= 1 || userAge.isSameOrBefore(moment().subtract(18, 'years'))) {
            urlsToMatch = [
                /(https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/g
            ];
        } else if (userAge.isSameOrBefore(moment().subtract(13, 'years'))) {
            // urls to match for users 13+
            urlsToMatch.push(
                /https:\/\/discord\.gg\/([a-zA-Z\d-_+\/]+)/g,
                /https:\/\/discordapp\.com\/([a-zA-Z\d-_+\/]+)/g,
                /https:\/\/www\.facebook\.com\/([a-zA-Z\d-_+?&.]+)/g,
                /https:\/\/facebook\.com\/([a-zA-Z\d-_+?&.]+)/g,
            );
            if (userAge.isSameOrBefore(moment().subtract(18, 'years'))) {
                // allow any url
                urlsToMatch = [
                    /(https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/g
                ];
            }
        }
        // First, validate
        let idsArray = ids.split(',');
        let numberArrOfIDs = [];
        for (const id of idsArray) {
            let num = parseInt(id, 10);
            if (Number.isInteger(num)) {
                numberArrOfIDs.push(num);
            }
        }
        // check if no ids specified
        if (numberArrOfIDs.length === 0) {
            return []; // no ids specified
        }
        if (numberArrOfIDs.length > 15) {
            throw new this.BadRequest('TooManyIds');
        }
        // verify user has permission to view each id
        let urlsToGrab: { statusId: number; urls: string[] }[] = [];
        // multi grab status info
        let multiGetStatuses = await this.user.multiGetStatusById([...new Set(numberArrOfIDs)]);

        let jobsToProcess = [];
        // for each status, check db info and grab data (if applicable)
        for (const statusData of multiGetStatuses) {
            const processStatus = async (statusData: model.user.UserStatus) => {
                // check if friends
                if (userInfo.staff >= 1 === false) {
                    let info = await this.user.getFriendshipStatus(userInfo.userId, statusData.userId);
                    if (!info.areFriends && userInfo.userId !== statusData.userId) {
                        throw new this.BadRequest('InvalidStatusId'); // id invalid
                    }
                }

                let urls: string[] | undefined = undefined;
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

                // let url = statusData.status.match(/(https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?/g);
                if (urls) {
                    urlsToGrab.push({
                        statusId: statusData.statusId,
                        urls: urls,
                    });
                }
            }
            jobsToProcess.push(processStatus(statusData));
        }
        await Promise.all(jobsToProcess);
        return await this.auth.multiGetOgTagsForYoutubeLinks(urlsToGrab);
    }

    @Get('/friends')
    @Summary('Get the authenticated user\'s friends feed. Includes their own statuses.')
    @ReturnsArray(200, { type: model.user.UserStatusForAuthenticated })
    @Returns(401, { type: model.Error, description: 'LoginRequired: Login Required\n' })
    @UseBeforeEach(YesAuth)
    public async getFeedForFriends(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @QueryParams('offset') offset: number = 0,
        @QueryParams('limit', Number) limit = 100,
    ) {
        let friends = await this.user.getFriends(userInfo.userId, 0, 200, 'asc');
        const arrayOfIds: Array<number> = [];
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
        // Get reaction status for authenticated user, for each post
        let resultsForMultiGetReactionStatus = await this.user.multiGetReactionStatusForUser(userInfo.userId, idsForStatus, '❤️');
        for (const item of feed as any[]) {
            for (const reactionInfo of resultsForMultiGetReactionStatus) {
                if (reactionInfo.statusId === item.statusId) {
                    item.didReactWithHeart = reactionInfo.didReact;
                    break;
                }
            }
        }
        return feed;
    }

    @Get('/friends/:userStatusId/reactions')
    @Summary('Get a list of users who hearted the {userStatusId}. Only returns the first 25 users.')
    @Use(YesAuth, middleware.feed.ConfirmPermissionForStatus)
    public async getUsersWhoReactedToStatus(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userStatusId', Number) statusId: number,
    ) {
        // grab reactors
        let usersWhoReacted = await this.user.getUsersWhoReactedToStatus(statusId, '❤️');
        // return success
        return usersWhoReacted;
    }

    @Post('/friends/:userStatusId/comment')
    @Summary('Add a comment to the {userStatusId}')
    @Use(csrf, YesAuth, middleware.feed.ConfirmPermissionForStatus)
    public async addCommentToStatus(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userStatusId', Number) statusId: number,
        @BodyParams('comment', String) comment: string,
    ) {
        if (!comment || !comment.replace(/\s+/g, '') || comment.length > 4096) {
            throw new this.BadRequest('InvalidComment');
        }
        let canPost = await this.user.canUserPostCommentToStatus(userInfo.userId);
        if (!canPost) {
            throw new this.Conflict('Cooldown');
        }
        // add comment
        await this.user.addCommentToStatus(statusId, userInfo.userId, comment);
        // return success
        return {
            success: true,
        };
    }

    @Get('/friends/:userStatusId/comments')
    @Summary('Get comments to the {userStatusId}')
    @ReturnsArray(200, { type: model.user.UserStatusComment })
    @Use(YesAuth, middleware.feed.ConfirmPermissionForStatus)
    public async getCommentsForStatus(
        @PathParams('userStatusId', Number) statusId: number,
        @QueryParams('offset', Number) offset: number = 0,
        @QueryParams('limit', Number) limit: number = 25,
    ) {
        let comments = await this.user.getCommentsToStatus(statusId, offset, limit);
        return comments;
    }

    @Get('/friends/:userStatusId/comment/:commentId/replies')
    @Summary('Get replies to a {commentId}')
    @Use(YesAuth, middleware.feed.ConfirmPermissionForStatus)
    public async getRepliesToComment(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userStatusId', Number) statusId: number,
        @PathParams('commentId', Number) commentId: number,
        @QueryParams('limit', Number) limit: number = 100,
        @QueryParams('offset', Number) offset: number = 0,
    ) {
        let comments = await this.user.getRepliesToStatusComment(commentId, offset, limit);
        return comments;
    }

    @Post('/friends/:userStatusId/comment/:commentId/reply')
    @Summary('Post a reply to a {commentId}')
    @Use(csrf, YesAuth, middleware.feed.ConfirmPermissionForStatus)
    public async replyToUserStatusComment(
        @Locals('userInfo') userInfo: model.UserSession,
        @Required()
        @BodyParams('reply', String) reply: string,
        @PathParams('userStatusId', Number) statusId: number,
        @PathParams('commentId', Number) commentId: number,
    ) {
        // check reply
        if (!reply || !reply.replace(/\s+/g, '') || reply.length > 4096) {
            throw new this.BadRequest('InvalidReply');
        }
        let canPost = await this.user.canUserPostCommentToStatus(userInfo.userId);
        if (!canPost) {
            throw new this.Conflict('Cooldown');
        }
        // make sure comment exists
        try {
            await this.user.getUserStatusCommentById(commentId, statusId);
        } catch (e) {
            throw new this.BadRequest('InvalidCommentId');
        }
        // post
        await this.user.replyToUserStatusComment(commentId, userInfo.userId, reply);
        /// return success
        return {
            success: true,
        };
    }


    @Post('/friends/:userStatusId/react')
    @Summary('Add a heart reaction to the {userStatusId}')
    @Use(csrf, YesAuth, middleware.feed.ConfirmPermissionForStatus)
    public async addReactionToStatus(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userStatusId', Number) statusId: number,
        @BodyParams('reactionType', String) reactionType: string,
    ) {
        if (reactionType !== 'heart') {
            throw new this.BadRequest('InvalidReactionType');
        }
        // Check if already reacted
        if (await this.user.checkIfAlreadyReacted(statusId, userInfo.userId, '❤️')) {
            throw new this.Conflict('AlreadyReactedToStatus');
        }
        // add reaction
        await this.user.addReactionToStatus(statusId, userInfo.userId, '❤️');
        // return success
        return {
            success: true,
        };
    }

    @Delete('/friends/:userStatusId/react')
    @Summary('Delete your reaction to a {userStatusId}')
    @Use(csrf, YesAuth, middleware.feed.ConfirmPermissionForStatus)
    public async deleteReactionToStatus(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userStatusId', Number) statusId: number,
        @BodyParams('reactionType', String) reactionType: string,
    ) {
        if (reactionType !== 'heart') {
            throw new this.BadRequest('InvalidReactionType');
        }
        // Check if not already reacted
        if (!await this.user.checkIfAlreadyReacted(statusId, userInfo.userId, '❤️')) {
            throw new this.Conflict('NotReactedToStatus');
        }
        // delete reaction
        await this.user.removeReactionToStatus(statusId, userInfo.userId, '❤️');
        // return success
        return {
            success: true,
        };
    }

    @Get('/groups')
    @Summary('Get the authenticated user\'s groups feed.')
    @ReturnsArray(200, { type: model.group.groupShout })
    @Returns(401, { type: model.Error, description: 'LoginRequired: Login Required\n' })
    @UseBeforeEach(YesAuth)
    public async getFeedForGroups(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @QueryParams('offset') offset: number = 0,
        @QueryParams('limit', Number) limit = 100,
    ) {
        let groups = await this.user.getGroups(userInfo.userId);
        const arrayOfIds: Array<number> = [];
        groups.forEach(obj => arrayOfIds.push(obj.groupId));
        if (arrayOfIds.length === 0) {
            // Return empty array
            return [];
        }
        // grab perms of each groupId to make sure user can view shout
        let goodGroups: number[] = [];
        for (const item of arrayOfIds) {
            let permissions = await this.group.getUserRole(item, userInfo.userId);
            if (permissions.permissions.getShout) {
                goodGroups.push(item);
            }
        }
        let feed = await this.group.getShouts(goodGroups, limit, offset);
        return feed;
    }

    @Patch('/status')
    @Summary('Update the authenticated user\'s status')
    @Returns(200, { type: model.user.UserStatusUpdatedResponse })
    @Returns(400, { type: model.Error, description: 'InvalidStatus: Status is too long or too short\nCooldown: You cannot change your status right now\n' })
    @Use(csrf, YesAuth)
    public async updateStatus(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @BodyParams("status", String) newStatus: string
    ) {
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
}
