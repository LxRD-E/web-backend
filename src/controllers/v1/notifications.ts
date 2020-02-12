/**
 * Imports
 */
// models
import * as model from '../../models/models';
// Autoload
import { Controller, UseBefore, Get, QueryParams, Locals, PathParams, Patch, UseBeforeEach } from '@tsed/common';
import controller from '../controller';
import { YesAuth } from '../../middleware/Auth';
import { Summary } from '@tsed/swagger';
import { csrf } from '../../dal/auth';
/*
 * Notifications Controller
 */
@Controller('/notifications')
export class NotificationsController extends controller {
    constructor() {
        super();
    }
    /**
     * Get the Authenticated User's Messages
     * @param offset 
     */
    @UseBefore(YesAuth)
    @Get('/messages')
    @Summary('Get all messages')
    public async getMessages(
        @Locals('userInfo') userData: model.user.SessionUserInfo,
        @QueryParams('offset', Number) numericOffset: number = 0,
    ) {
        const messages = await this.notification.getMessages(userData.userId, numericOffset);
        return messages;
    }

    /**
     * Mark a Message as read
     * @param messageId 
     */
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    @Patch('/message/:id/read')
    @Summary('Mark message as read')
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

    /**
     * Count user's unread messages
     */
    @Get('/count')
    @Summary('Count all unread notifications')
    @UseBefore(YesAuth)
    public async countNotifications(
        @Locals('userInfo') userData: model.user.SessionUserInfo,
    ) {
        const notifications = await this.notification.countUnreadMessages(userData.userId);
        return {
            'count': notifications,
        };

    }

    /**
     * Get the authenticated user's friend requests
     */
    @UseBefore(YesAuth)
    @Get('/requests')
    public async getFriendRequests(
        @Locals('userInfo') userData: model.user.SessionUserInfo,
        @QueryParams('offset', Number) numericOffset: number
    ) {
        const notifications = await this.user.getFriendRequests(userData.userId, numericOffset);
        return notifications;
    }
}
