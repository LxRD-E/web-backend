import {wss} from '../../start/websockets';
/**
 * Imports
 */
// Models
import * as model from '../../models/models';
import * as NodeWS from 'ws';
import {filterId} from '../../helpers/Filter';
import {Redis} from 'ioredis';
import controller from '../controller';
import {
    BodyParams,
    Controller,
    Get,
    Locals,
    Patch,
    PathParams,
    Post,
    Put,
    QueryParams,
    Use,
    UseBefore,
    UseBeforeEach
} from '@tsed/common';
import {YesAuth} from '../../middleware/Auth';
import {csrf} from '../../dal/auth';
import {Description, Returns, Summary} from '@tsed/swagger';

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
    @Use(csrf, YesAuth)
    public getCsrfTokenForWebsocket() {return {success: true}}

    @Get('/latest')
    @Summary('Get latest conversation userIds')
    @Use(YesAuth)
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
        const friends = await this.user.getFriendshipStatus(userInfo.userId, numericId);
        if (!friends.areFriends) {
            throw new this.BadRequest('InvalidUserId');
        }
        return await this.chat.getConversationByUserId(userInfo.userId, numericId, goodOffset);
    }

    @Put('/:userId/send')
    @Returns(400, {type: model.Error, description: 'InvalidMessage: Message is not valid\nInvalidUserId: userId is invalid'})
    @Use(csrf, YesAuth)
    public async sendChatMessage(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) numericId: number, 
        @BodyParams('content', String) content: string
    ) {
        if (!content || content.length < 1 || content.length > 255) {
            throw new this.BadRequest('InvalidMessage');
        }
        // Check if friends
        const friends = await this.user.getFriendshipStatus(userInfo.userId, numericId);
        if (!friends.areFriends) {
            throw new this.BadRequest('InvalidUserId');
        }
        const message = await this.chat.createMessage(numericId, userInfo.userId, content);
        await this.chat.publishMessage(numericId, message);
        return {success: true};
    }

    @Put('/:userId/typing')
    @Returns(400, {type: model.Error, description: 'InvalidStatus: Status must be one of: 0,1\nInvalidUserId: userId is not valid\n'})
    @Use(csrf, YesAuth)
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
        const friends = await this.user.getFriendshipStatus(userInfo.userId, numericId);
        if (!friends.areFriends) {
            throw new this.BadRequest('InvalidUserId');
        }
        await this.chat.publishTypingStatus(numericId, userInfo.userId, numericStatus);
        return {success: true};
    }

    /**
     * # Not a controller method
     * Listen for chat events. Callback is called on new chat event. Delivery is not guaranteed.
     */
    public async listenForChatEvents(
        userId: number,
        cbOnChatEvents: (msg: string) => any,
    ) {
        return this.chat.subscribeToMessages(userId, cbOnChatEvents);
        // return await this.chat.subscribeToMessages(userId);
    }

    @Get('/unread/count')
    @Use(YesAuth)
    public async countUnreadMessages(
        @Locals('userInfo') userInfo: model.user.UserInfo,
    ) {
        const unread = await this.chat.countUnreadMessages(userInfo.userId);
        return {'total': unread};
    }

    @Patch('/:userId/read')
    @Use(csrf, YesAuth)
    public async markConversationAsRead(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userId', Number) numericId: number
    ) {
        await this.chat.markConversationAsRead(userInfo.userId, numericId);
        return {success: true};
    }

    public static async chatWebsocketConnection(ws: NodeWS, userId: number) {
        // We ignore all non-"ping" requests for now
        ws.on('message', function incoming(msg) {
            let str = msg.toString();
            if (str.length > 250) {
                ws.close();
                return;
            }
            // try to decode
            let decodedMessage: Partial<{ping?: number}> = {};
            try {
                decodedMessage = JSON.parse(str);
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
        let connector: model.chat.IChatMessageDisconnector;
        try {
            console.log('Setting up REDIS');
            // Listen for events
            connector = await new ChatController().listenForChatEvents(userId, str => {
                ws.send(str);
            });
            /*
            listener.on('message', (channel, message): void => {
                console.log('Message received to websocket. Sending message to clients...');
                ws.send(message);
            });
            */
        }catch(e) {
            console.log('Closing ws conn due to redis error',e);
            ws.close();
        }
        ws.on('close', function() {
            console.log('Websocket conn closed - disconnecting callback');
            connector.disconnect();
        });
    }
}

/**
 * TODO: convert to some decorator library
 */
wss.on('connection', async function connection(ws, request: any) {
    if (request.url !== '/chat/websocket.aspx') {
        // let someone else handle it
        return;
    }
    // If no session, close
    const sess = request.session;
    if (!sess || sess && !sess.userdata || sess && sess.userdata && !sess.userdata.id) {
        console.log("No session for websocket");
        ws.close();
        return;
    }
    // Setup Listener
    await ChatController.chatWebsocketConnection(ws, sess.userdata.id);
});
 