/**
 * Imports
 */
// models
import * as model from '../../models/models';
// Autoload
import {BodyParams, Controller, Get, Locals, Patch, PathParams, Post, QueryParams, Required, Use} from '@tsed/common';
import controller from '../controller';
import {YesAuth} from '../../middleware/Auth';
import {Description, Returns, Summary} from '@tsed/swagger';
import {csrf} from '../../dal/auth';

/*
 * Notifications Controller
 */
@Controller('/notifications')
export class NotificationsController extends controller {
    constructor() {
        super();
    }

    @Get('/messages')
    @Summary('Get all messages')
    @Use(YesAuth)
    public async getMessages(
        @Locals('userInfo') userData: model.user.SessionUserInfo,
        @QueryParams('offset', Number) numericOffset: number = 0,
    ) {
        return await this.notification.getMessages(userData.userId, numericOffset);
    }

    @Patch('/message/:id/read')
    @Summary('Mark message as read')
    @Use(csrf, YesAuth)
    public async markAsRead(
        @Locals('userInfo') userData: model.user.SessionUserInfo,
        @PathParams('id', Number) numericId: number
    ) {
        // Update status
        await this.notification.markAsRead(userData.userId, numericId);
        return {
            'success': true,
        };
    }

    @Post('/message/multi-mark-as-read')
    @Summary('Mark multiple message as read')
    @Description('Maxiumum amount of 100 ids can be specified')
    @Returns(400, {type: model.Error, description: 'InvalidIds: IDs are invalid\n'})
    @Use(csrf, YesAuth)
    public async multiMarkAsRead(
        @Locals('userInfo') userData: model.user.SessionUserInfo,
        @Required()
        @BodyParams('ids', Array) ids: number[],
    ) {
        if (ids.length >= 100 || ids.length <= 0) {
            throw new this.BadRequest('InvalidIds');
        }
        // Update statuses
        await this.notification.multiMarkAsRead(userData.userId, ids);
        // Return OK
        return {
            'success': true,
        };
    }

    @Get('/count')
    @Summary('Count all unread notifications')
    @Use(YesAuth)
    public async countNotifications(
        @Locals('userInfo') userData: model.user.SessionUserInfo,
    ) {
        const notificationsCount = await this.notification.countUnreadMessages(userData.userId);
        const friendRequestCount = await this.notification.countInboundFriendRequests(userData.userId);
        return {
            'unreadMessageCount': notificationsCount,
            'friendRequestCount': friendRequestCount,
        };

    }

    @Get('/requests')
    @Use(YesAuth)
    public async getFriendRequests(
        @Locals('userInfo') userData: model.user.SessionUserInfo,
        @QueryParams('offset', Number) numericOffset: number
    ) {
        return await this.user.getFriendRequests(userData.userId, numericOffset);
    }
}
