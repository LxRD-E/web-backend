"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_pubsub_1 = require("../helpers/ioredis_pubsub");
const model = require("../models/models");
const _init_1 = require("./_init");
let publisher;
let subscriber;
let _pendingMsgCallbacks = [];
if (process.env.NODE_ENV !== 'test') {
    publisher = ioredis_pubsub_1.default();
    subscriber = ioredis_pubsub_1.default();
    subscriber.on('connect', async () => {
        await subscriber.subscribe('ChatMessage');
        subscriber.on('message', (channel, str) => {
            console.log(str);
            _pendingMsgCallbacks.forEach(cb => {
                cb(str);
            });
        });
    });
}
class ChatDAL extends _init_1.default {
    constructor() {
        super();
        this.callbacksForNewMessages = [];
        this.publisher = publisher;
        this.subscriber = subscriber;
        const _internalCallbackForMsgEventFromRedis = (str) => {
            let decoded;
            try {
                decoded = JSON.parse(str);
            }
            catch (e) {
                console.error(e);
                return;
            }
            let newArr = [];
            this.callbacksForNewMessages.forEach(item => {
                if (!item.connected) {
                    return;
                }
                newArr.push(item);
                if (item.userIdTo === decoded.userIdTo) {
                    item.callback(str);
                }
            });
            this.callbacksForNewMessages = newArr;
        };
        _pendingMsgCallbacks.push((str) => {
            _internalCallbackForMsgEventFromRedis(str);
        });
    }
    async getConversationByUserId(userIdTo, userIdFrom, offset, limit = 25) {
        return this.knex('chat_messages').select('id as chatMessageId', 'userid_from as userIdFrom', 'userid_to as userIdTo', 'content', 'date_created as dateCreated', 'read').where({
            'userid_to': userIdTo,
            'userid_from': userIdFrom
        }).orWhere({
            'userid_to': userIdFrom,
            'userid_from': userIdTo
        }).limit(limit).offset(offset).orderBy('id', 'desc');
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
            'read': model.chat.MessageRead.false,
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
        return [...new Set(userIds)];
    }
    async publishMessage(userIdTo, messageObject) {
        await this.publisher.publish('ChatMessage', JSON.stringify(messageObject));
    }
    async publishTypingStatus(userIdTo, userIdFrom, isTyping) {
        await this.publisher.publish('ChatMessage', JSON.stringify({
            typing: isTyping,
            userIdFrom: userIdFrom,
            userIdTo: userIdTo,
        }));
    }
    async countUnreadMessages(userId) {
        const total = await this.knex('chat_messages').count('id as Total').where({ 'userid_to': userId, 'read': model.chat.MessageRead.false });
        return total[0]['Total'];
    }
    async markConversationAsRead(userIdTo, userIdFrom) {
        await this.knex('chat_messages').update({ 'read': model.chat.MessageRead.true }).where({ 'userid_to': userIdTo, 'userid_from': userIdFrom });
    }
    subscribeToMessages(userIdTo, callback) {
        let obj = {
            userIdTo: userIdTo,
            callback: callback,
            connected: true,
        };
        this.callbacksForNewMessages.push(obj);
        return {
            disconnect: () => {
                obj.connected = false;
            }
        };
    }
}
exports.default = ChatDAL;

