/**
 * Imports
 */
import redis from '../helpers/ioredis_pubsub';
// Interface Info
import * as model from '../models/models';
import {Redis} from 'ioredis';

import _init from './_init';

let publisher: Redis;
let subscriber: Redis;
let _pendingMsgCallbacks: any[] = [];
if (process.env.NODE_ENV !== 'test') {
    publisher = redis();
    subscriber = redis();
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
/**
 * Chat Data Access Layer
 */
class ChatDAL extends _init {
    public publisher: Redis;
    public subscriber: Redis;
    private callbacksForNewMessages: model.chat.IChatMessageCallbacks[] = [];
    constructor() {
        super();
        this.publisher = publisher;
        this.subscriber = subscriber;
        const _internalCallbackForMsgEventFromRedis = (str: any) => {
            let decoded: {userIdTo: number; userIdFrom: number; [key: string]: any;}
            try {
                decoded = JSON.parse(str);
            }catch(e) {
                console.error(e);
                return;
            }
            let newArr: model.chat.IChatMessageCallbacks[] = [];
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
        }
        _pendingMsgCallbacks.push((str: any) => {
            _internalCallbackForMsgEventFromRedis(str);
        });
    }
    /**
     * Get chat message history between two users. Returns empty array if no history exists
     * @param userIdTo 
     * @param userIdFrom 
     * @param offset 
     */
    public async getConversationByUserId(userIdTo: number, userIdFrom: number, offset: number, limit = 25): Promise<model.chat.ChatMessage[]> {
        return this.knex('chat_messages').select('id as chatMessageId', 'userid_from as userIdFrom', 'userid_to as userIdTo', 'content', 'date_created as dateCreated', 'read').where({
            'userid_to': userIdTo,
            'userid_from': userIdFrom
        }).orWhere({
            'userid_to': userIdFrom,
            'userid_from': userIdTo
        }).limit(limit).offset(offset).orderBy('id', 'desc');
    }

    /**
     * Send a Chat Message. Returns message so it can be published via redis
     */
    public async createMessage(userIdTo: number, userIdFrom: number, content: string): Promise<model.chat.ChatMessage> {
        const dateStamp = this.moment().format('YYYY-MM-DD HH:mm:ss');
        const info = {
            'chatMessageId': 0,
            'userIdFrom': userIdFrom,
            'userIdTo': userIdTo,
            'dateCreated': dateStamp,
            'content': content,
            'read': 0,
        }
        const message = await this.knex('chat_messages').insert({
            'userid_from': userIdFrom,
            'userid_to': userIdTo,
            'date_created': dateStamp,
            'content': content,
            'read': model.chat.MessageRead.false,
        });
        info['chatMessageId'] = message[0] as number;
        return info;
    }

    /**
     * Get the Latest Unread Conversation userIds
     * @param userIdTo 
     */
    public async getLatestConversationUserIds(userIdTo: number): Promise<number[]> {
        const results = await this.knex('chat_messages').select('userid_from','id','userid_to').where({'userid_to': userIdTo}).orWhere({'userid_from': userIdTo}).orderBy('id', 'desc');
        const userIds = [] as number[];
        for (const result of results) {
            if (result.userid_from === userIdTo) {
                userIds.push(result.userid_to);
            }else{
                userIds.push(result.userid_from);
            }
        }
        return [...new Set(userIds)] as number[];
    }

    /**
     * Publish a message to any listeners via redis
     */
    public async publishMessage(userIdTo: number, messageObject: model.chat.ChatMessage): Promise<void> {
        await this.publisher.publish('ChatMessage', JSON.stringify(messageObject));
    }

    /**
     * Publish a typing status message to any listeners via redis
     */
    public async publishTypingStatus(userIdTo: number, userIdFrom: number, isTyping: number): Promise<void> {
        await this.publisher.publish('ChatMessage', JSON.stringify({
            typing: isTyping,
            userIdFrom: userIdFrom,
            userIdTo: userIdTo,
        }));
    }

    /**
     * Count unread messages
     * @param userId 
     */
    public async countUnreadMessages(userId: number): Promise<number> {
        const total = await this.knex('chat_messages').count('id as Total').where({'userid_to': userId,'read':model.chat.MessageRead.false});
        return total[0]['Total'] as number;
    }

    /**
     * Mark a Conversation as Read
     * @param userIdTo 
     * @param userIdFrom 
     */
    public async markConversationAsRead(userIdTo: number, userIdFrom: number): Promise<void> {
        await this.knex('chat_messages').update({'read': model.chat.MessageRead.true}).where({'userid_to': userIdTo,'userid_from':userIdFrom});
    }

    /**
     * Subscribe to message events. Callback will be called when a new message is received. Call disconnect() to disable the callback
     * @param userIdTo
     * @param callback
     */
    public subscribeToMessages(userIdTo: number, callback: (msg: any) => any): model.chat.IChatMessageDisconnector {
        let obj = {
            userIdTo: userIdTo,
            callback: callback,
            connected: true,
        }
        this.callbacksForNewMessages.push(obj);
        return {
            disconnect: () => {
                obj.connected = false;
            }
        };
    }
}

export default ChatDAL;
