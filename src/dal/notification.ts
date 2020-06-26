/**
 * Imports
 */
import * as Notifications from '../models/v1/notification';

import _init from './_init';

class NotificationsDAL extends _init {
    /**
     * Get a user's Messages
     * @param userId
     * @param offset
     */
    public async getMessages(userId: number, offset: number): Promise<Notifications.UserMessages[]> {
        return this.knex("user_messages").select("id as messageId", "userid_from as userId", "message_subject as subject", "message_body as body", "message_date as date", "message_read as read").where({
            'userid_to': userId,
        }).orderBy('id', 'desc').limit(25).offset(offset);
    }

    /**
     * Get a message by it's ID
     */
    public async getMessageById(messageId: number): Promise<Notifications.UserMessages> {
        const message = await this.knex("user_messages").select("id as messageId","userid_from as userId","message_subject as subject","message_body as body","message_date as date","message_read as read").where({
            'id': messageId,
        }).limit(1);
        return message[0];
    }

    /**
     * Mark a Message as read
     * @param userId 
     * @param messageId 
     */
    public async markAsRead(userIdTo: number, messageId: number): Promise<void> {
        await this.knex("user_messages").update({
            'message_read': Notifications.read.true,
        }).where({'id':messageId,'userid_to':userIdTo});
    }

    /**
     * Mark multiple messages as read
     * @param userId 
     * @param messageIds 
     */
    public async multiMarkAsRead(userIdTo: number, messageIds: number[]): Promise<void> {
        let promise = this.knex("user_messages").update({
            'message_read': Notifications.read.true,
        });
        for (const id of messageIds) {
            promise = promise.orWhere({
                'id': id,
                'userid_to': userIdTo,
            });
        }
        await promise;
    }

    /**
     * Count a user's unread messages
     * @param userIdTo 
     */
    public async countUnreadMessages(userIdTo: number): Promise<number> {
        const messages = await this.knex("user_messages").count("id as Total").where({
            'userid_to': userIdTo,
            'message_read': Notifications.read.false,
        }).orderBy('id', 'desc').limit(99);
        return messages[0]["Total"] as number;
    }

    /**
     * Count a user's inbound friend requests
     * @param userIdTo 
     */
    public async countInboundFriendRequests(userIdTo: number): Promise<number> {
        const requests = await this.knex("friend_request").count("id as Total").where({
            'userid_requestee': userIdTo,
        }).limit(99);
        return requests[0]["Total"] as number || 0;
    }

    /**
     * Send a message to a user
     */
    public async createMessage(userIdTo: number, userIdFrom: number, subject: string, body: string): Promise<void> {
        await this.knex('user_messages').insert({
            'userid_to': userIdTo,
            'userid_from': userIdFrom,
            'message_subject': subject,
            'message_body': body,
            'message_date': this.moment().format('YYYY-MM-DD HH:mm:ss'),
            'message_read': Notifications.read.false,
        });
    }
}

export default NotificationsDAL;
