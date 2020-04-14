/**
 * Imports
 */
import redis from '../helpers/ioredis_pubsub';
// Interface Info
import * as model from '../models/models';
import { Redis } from 'ioredis';

import _init from './_init';

/**
 * Chat Data Access Layer
 */
class ChatDAL extends _init {
    /**
     * Get chat message history between two users. Returns empty array if no history exists
     * @param userIdTo 
     * @param userIdFrom 
     * @param offset 
     */
    public async getConversationByUserId(userIdTo: number, userIdFrom: number, offset: number, limit = 25): Promise<model.chat.ChatMessage[]> {
        const conversation = await this.knex('chat_messages').select('id as chatMessageId','userid_from as userIdFrom','userid_to as userIdTo','content', 'date_created as dateCreated','read').where({'userid_to':userIdTo,'userid_from':userIdFrom}).orWhere({'userid_to':userIdFrom,'userid_from':userIdTo}).limit(limit).offset(offset).orderBy('id', 'desc');
        return conversation;
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
        const unique = [...new Set(userIds)] as number[];
        return unique;
    }

    /**
     * Publish a message to any listeners via redis
     */
    public async publishMessage(userIdTo: number, messageObject: model.chat.ChatMessage): Promise<void> {
        const listener = redis();
        listener.on('connect', async () => {
            await listener.publish('ChatMessage'+userIdTo, JSON.stringify(messageObject));
        });
    }

    /**
     * Publish a typing status message to any listeners via redis
     */
    public async publishTypingStatus(userIdTo: number, userIdFrom: number, isTyping: number): Promise<void> {
        const listener = redis();
        listener.on('connect', async () => {
            console.log('Sending message');
            let key = 'ChatMessage'+userIdTo;
            console.log('Publishing to key:', key)
            await listener.publish(key, JSON.stringify({'typing':isTyping,'userIdFrom':userIdFrom}));
        });
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
     * Subscribe to message events. Returns a new redis instance that is subscribed. Call .on("message") to get messages
     * @param userIdTo 
     * @param userIdFrom 
     */
    public subscribeToMessages(userIdTo: number): Promise<Redis> {
        return new Promise((resolve, reject): void => {
            const listener = redis();
            listener.on('connect', async () => {
                let key = 'ChatMessage'+userIdTo;
                console.log('Subscribed to key:',key);
                await listener.subscribe(key);
                resolve(listener);
            });
        });
    }
}

export default ChatDAL;
