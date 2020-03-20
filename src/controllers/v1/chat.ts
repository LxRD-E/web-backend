import { wss } from '../../start/websockets';

/**
 * Imports
 */
// Express
import { Response, Request } from 'express';
// Models
import * as model from '../../models/models';
import { filterOffset, filterLimit, filterId, filterSort } from '../../helpers/Filter';
import { Redis } from 'ioredis';
import controller from '../controller';
import { Locals, UseBefore, Get, PathParams, BodyParams, Put, UseBeforeEach, Controller, QueryParams, Patch, Post, Use } from '@tsed/common';
import { YesAuth } from '../../middleware/Auth';
import { csrf } from '../../dal/auth';
import { Summary, Returns, Description } from '@tsed/swagger';

/**
 * Chat Controller
 */
@Controller('/chat')
export class ChatController extends controller {
    constructor() {
        super();
    }

    @Post('/metadata')
    @Summary('Grab CSRF Token for chat websocket connection')
    @Description('Might be replaced with a more efficient option in the future')
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public getCsrfTokenForWebsocket() {return {success: true}}
    /**
     * Get a user's latest conversation partners user ids
     */
    @Get('/latest')
    @Summary('Get latest conversation userIds')
    @UseBefore(YesAuth)
    public async getLatestConversationUserIds(
        @Locals('userInfo') userInfo: model.user.UserInfo,
    ): Promise<model.chat.ChatMessage[]> {
        const ids = await this.chat.getLatestConversationUserIds(userInfo.userId);
        const results = [];
        for (const id of ids) {
            const history = await this.chat.getConversationByUserId(userInfo.userId, id, 0, 1);
            results.push(history[0]);
        }
        return results;
    }
    /**
     * Get Chat History between Auth User and specified user ID
     * @param userId 
     * @param offset 
     */
    @Get('/:userId/history')
    @Summary('Get chat history between authenticated user and userId')
    @Returns(400, {type: model.Error, description: 'InvalidUserId: UserId is invalid\n'})
    @Use(YesAuth)
    public async getChatHistory(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) numericId: number, 
        @QueryParams('offset', Number) goodOffset: number = 0
    ) {
        // Check if friends
        try {
            const friends = await this.user.getFriendshipStatus(userInfo.userId, numericId);
            if (!friends.areFriends) {
                throw false;
            }
        }catch(e) {
            throw new this.BadRequest('InvalidUserId');
        }
        const history = await this.chat.getConversationByUserId(userInfo.userId, numericId, goodOffset);
        return history;
    }
    /**
     * Send a chat message
     * @param userId 
     * @param content 
     */
    @Put('/:userId/send')
    @Returns(400, {type: model.Error, description: 'InvalidMessage: Message is not valid\nInvalidUserId: userId is invalid'})
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async sendChatMessage(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) numericId: number, 
        @BodyParams('content', String) content: string
    ) {
        if (!content || content.length < 1 || content.length > 255) {
            throw new this.BadRequest('InvalidMessage');
        }
        // Check if friends
        try {
            const friends = await this.user.getFriendshipStatus(userInfo.userId, numericId);
            if (!friends.areFriends) {
                throw false;
            }
        }catch(e) {
            throw new this.BadRequest('InvalidUserId');
        }
        const message = await this.chat.createMessage(numericId, userInfo.userId, content);
        await this.chat.publishMessage(numericId, message);
        return {success: true};
    }
    /**
     * Send typeing status
     * @param userId 
     */
    @Put('/:userId/typing')
    @Returns(400, {type: model.Error, description: 'InvalidStatus: Status must be one of: 0,1\nInvalidUserId: userId is not valid\n'})
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async sendTypingStatus(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) numericId: number, 
        @BodyParams('typing', String) status: string
    ) {
        const numericStatus = filterId(status) as number;
        if (numericStatus !== 1 && numericStatus !== 0) {
            throw new this.BadRequest('InvalidStatus');
        }
        // Check if friends
        try {
            const friends = await this.user.getFriendshipStatus(userInfo.userId, numericId);
            if (!friends.areFriends) {
                throw false;
            }
        }catch(e) {
            throw new this.BadRequest('InvalidUserId');
        }
        await this.chat.publishTypingStatus(numericId, userInfo.userId, numericStatus);
        return {success: true};
    }

    /**
     * Listen for Chat Events
     */
    @UseBefore(YesAuth)
    public async listenForChatEvents(
        @Locals('userInfo') userInfo: model.user.UserInfo,
    ) {
        const messages = await this.chat.subscribeToMessages(userInfo.userId);
        return messages;
    }

    /**
     * Count Unread Messages
     */
    @Get('/unread/count')
    @UseBefore(YesAuth)
    public async countUnreadMessages(
        @Locals('userInfo') userInfo: model.user.UserInfo,
    ) {
        const unread = await this.chat.countUnreadMessages(userInfo.userId);
        return {'total': unread};
    }

    /**
     * Mark an Entire Conversation as read
     * @param userId 
     */
    @Patch('/:userId/read')
    @UseBeforeEach(YesAuth)
    @UseBefore(csrf)
    public async markConversationAsRead(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) numericId: number
    ) {
        await this.chat.markConversationAsRead(userInfo.userId, numericId);
        return {success: true};
    }
}


wss.on('connection', async function connection(ws, request: any) {
    if (request.url !== '/chat/websocket.aspx') {
        // let someone else handle it
        console.log('Invalid request URL for websocket');
        return;
    }
    // If no session, close
    const sess = request.session;
    if (!sess) {
        console.log("No session for websocket");
        ws.close();
        return;
    }
    console.log('Websocket OK, startin conn info');
    // We ignore incomming requests for now
    ws.on('message', function incoming(msg) {
        // try to decode
        let decodedMessage: any = {};
        try {
            decodedMessage = JSON.parse(msg.toString());
        }catch(e) {
            ws.close();
        }
        if (decodedMessage && decodedMessage.ping) {
            ws.send(JSON.stringify({
                'pong': Math.floor(new Date().getTime() / 1000),
            }), (err) => {
                if (err) {
                    console.error(err);
                }
            });
        }else{
            ws.close();
        }
    });
    // Setup Listener
    const userInfo = new model.user.UserInfo;
    userInfo.userId = sess.userdata.id;
    let listener: Redis;
    try {
        console.log('Setting up REDIS');
        // Listen for events
        listener = await new ChatController().listenForChatEvents(userInfo);
        listener.on('message', (channel, message): void => {
            console.log('MEssage recieved to websocket. Sending message to clients...');
            ws.send(message);
        });
    }catch(e) {
        console.log('Closing ws conn  due to redis error',e);
        ws.close();
    }
    ws.on('close', function() {
        console.log('Websocket conn closed - disconnecting redis');
        // Close Redis Sub
        if (listener && listener.disconnect) {
            listener.disconnect();
        }
    });
});
 