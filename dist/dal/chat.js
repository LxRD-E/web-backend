"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_pubsub_1 = require("../helpers/ioredis_pubsub");
const Chat = require("../models/v1/chat");
const _init_1 = require("./_init");
class ChatDAL extends _init_1.default {
    async getConversationByUserId(userIdTo, userIdFrom, offset, limit = 25) {
        const conversation = await this.knex('chat_messages').select('id as chatMessageId', 'userid_from as userIdFrom', 'userid_to as userIdTo', 'content', 'date_created as dateCreated', 'read').where({ 'userid_to': userIdTo, 'userid_from': userIdFrom }).orWhere({ 'userid_to': userIdFrom, 'userid_from': userIdTo }).limit(limit).offset(offset).orderBy('id', 'desc');
        return conversation;
    }
    async createMessage(userIdTo, userIdFrom, content) {
        const dateStamp = this.moment().format('YYYY-MM-DD HH:mm:ss');
        const info = {
            'chatMessageId': 0,
            'userIdFrom': userIdFrom,
            'userIdTo': userIdTo,
            'dateCreated': dateStamp,
            'content': content,
            'read': 0,
        };
        const message = await this.knex('chat_messages').insert({
            'userid_from': userIdFrom,
            'userid_to': userIdTo,
            'date_created': dateStamp,
            'content': content,
            'read': Chat.MessageRead.false,
        });
        info['chatMessageId'] = message[0];
        return info;
    }
    async getLatestConversationUserIds(userIdTo) {
        const results = await this.knex('chat_messages').select('userid_from', 'id', 'userid_to').where({ 'userid_to': userIdTo }).orWhere({ 'userid_from': userIdTo }).orderBy('id', 'desc');
        const userIds = [];
        for (const result of results) {
            if (result.userid_from === userIdTo) {
                userIds.push(result.userid_to);
            }
            else {
                userIds.push(result.userid_from);
            }
        }
        const unique = [...new Set(userIds)];
        return unique;
    }
    async publishMessage(userIdTo, messageObject) {
        const listener = ioredis_pubsub_1.default();
        listener.on('connect', async () => {
            await listener.publish('ChatMessage' + userIdTo, JSON.stringify(messageObject));
        });
    }
    async publishTypingStatus(userIdTo, userIdFrom, isTyping) {
        const listener = ioredis_pubsub_1.default();
        listener.on('connect', async () => {
            await listener.publish('ChatMessage' + userIdTo, JSON.stringify({ 'typing': isTyping, 'userIdFrom': userIdFrom }));
        });
    }
    async countUnreadMessages(userId) {
        const total = await this.knex('chat_messages').count('id as Total').where({ 'userid_to': userId, 'read': Chat.MessageRead.false });
        return total[0]['Total'];
    }
    async markConversationAsRead(userIdTo, userIdFrom) {
        await this.knex('chat_messages').update({ 'read': Chat.MessageRead.true }).where({ 'userid_to': userIdTo, 'userid_from': userIdFrom });
    }
    subscribeToMessages(userIdTo) {
        return new Promise((resolve, reject) => {
            const listener = ioredis_pubsub_1.default();
            listener.on('connect', async () => {
                await listener.subscribe('ChatMessage' + userIdTo);
                resolve(listener);
            });
        });
    }
}
exports.default = ChatDAL;

