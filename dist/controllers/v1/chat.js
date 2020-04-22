"use strict";
/* istanbul ignore next */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
/* istanbul ignore next */
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
/* istanbul ignore next */
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
/* istanbul ignore next */
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/* istanbul ignore next */
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const websockets_1 = require("../../start/websockets");
const model = require("../../models/models");
const Filter_1 = require("../../helpers/Filter");
const controller_1 = require("../controller");
const common_1 = require("@tsed/common");
const Auth_1 = require("../../middleware/Auth");
const auth_1 = require("../../dal/auth");
const swagger_1 = require("@tsed/swagger");
let ChatController = class ChatController extends controller_1.default {
    constructor() {
        super();
    }
    getCsrfTokenForWebsocket() { return { success: true }; }
    async getLatestConversationUserIds(userInfo) {
        const ids = await this.chat.getLatestConversationUserIds(userInfo.userId);
        const results = [];
        for (const id of ids) {
            const history = await this.chat.getConversationByUserId(userInfo.userId, id, 0, 1);
            results.push(history[0]);
        }
        return results;
    }
    async getChatHistory(userInfo, numericId, goodOffset = 0) {
        try {
            const friends = await this.user.getFriendshipStatus(userInfo.userId, numericId);
            if (!friends.areFriends) {
                throw false;
            }
        }
        catch (e) {
            throw new this.BadRequest('InvalidUserId');
        }
        const history = await this.chat.getConversationByUserId(userInfo.userId, numericId, goodOffset);
        return history;
    }
    async sendChatMessage(userInfo, numericId, content) {
        if (!content || content.length < 1 || content.length > 255) {
            throw new this.BadRequest('InvalidMessage');
        }
        try {
            const friends = await this.user.getFriendshipStatus(userInfo.userId, numericId);
            if (!friends.areFriends) {
                throw false;
            }
        }
        catch (e) {
            throw new this.BadRequest('InvalidUserId');
        }
        const message = await this.chat.createMessage(numericId, userInfo.userId, content);
        await this.chat.publishMessage(numericId, message);
        return { success: true };
    }
    async sendTypingStatus(userInfo, numericId, status) {
        const numericStatus = Filter_1.filterId(status);
        if (numericStatus !== 1 && numericStatus !== 0) {
            throw new this.BadRequest('InvalidStatus');
        }
        try {
            const friends = await this.user.getFriendshipStatus(userInfo.userId, numericId);
            if (!friends.areFriends) {
                throw false;
            }
        }
        catch (e) {
            throw new this.BadRequest('InvalidUserId');
        }
        await this.chat.publishTypingStatus(numericId, userInfo.userId, numericStatus);
        return { success: true };
    }
    async listenForChatEvents(userInfo) {
        const messages = await this.chat.subscribeToMessages(userInfo.userId);
        return messages;
    }
    async countUnreadMessages(userInfo) {
        const unread = await this.chat.countUnreadMessages(userInfo.userId);
        return { 'total': unread };
    }
    async markConversationAsRead(userInfo, numericId) {
        await this.chat.markConversationAsRead(userInfo.userId, numericId);
        return { success: true };
    }
};
__decorate([
    common_1.Post('/metadata'),
    swagger_1.Summary('Grab CSRF Token for chat websocket connection'),
    swagger_1.Description('Might be replaced with a more efficient option in the future'),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "getCsrfTokenForWebsocket", null);
__decorate([
    common_1.Get('/latest'),
    swagger_1.Summary('Get latest conversation userIds'),
    common_1.UseBefore(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getLatestConversationUserIds", null);
__decorate([
    common_1.Get('/:userId/history'),
    swagger_1.Summary('Get chat history between authenticated user and userId'),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidUserId: UserId is invalid\n' }),
    common_1.Use(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('userId', Number)),
    __param(2, common_1.QueryParams('offset', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getChatHistory", null);
__decorate([
    common_1.Put('/:userId/send'),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidMessage: Message is not valid\nInvalidUserId: userId is invalid' }),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('userId', Number)),
    __param(2, common_1.BodyParams('content', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "sendChatMessage", null);
__decorate([
    common_1.Put('/:userId/typing'),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidStatus: Status must be one of: 0,1\nInvalidUserId: userId is not valid\n' }),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('userId', Number)),
    __param(2, common_1.BodyParams('typing', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "sendTypingStatus", null);
__decorate([
    common_1.UseBefore(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "listenForChatEvents", null);
__decorate([
    common_1.Get('/unread/count'),
    common_1.UseBefore(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "countUnreadMessages", null);
__decorate([
    common_1.Patch('/:userId/read'),
    common_1.UseBeforeEach(Auth_1.YesAuth),
    common_1.UseBefore(auth_1.csrf),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "markConversationAsRead", null);
ChatController = __decorate([
    common_1.Controller('/chat'),
    __metadata("design:paramtypes", [])
], ChatController);
exports.ChatController = ChatController;
websockets_1.wss.on('connection', async function connection(ws, request) {
    if (request.url !== '/chat/websocket.aspx') {
        console.log('Invalid request URL for websocket');
        return;
    }
    const sess = request.session;
    if (!sess) {
        console.log("No session for websocket");
        ws.close();
        return;
    }
    console.log('Websocket OK, startin conn info');
    ws.on('message', function incoming(msg) {
        let decodedMessage = {};
        try {
            decodedMessage = JSON.parse(msg.toString());
        }
        catch (e) {
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
        }
        else {
            ws.close();
        }
    });
    const userInfo = new model.user.UserInfo;
    userInfo.userId = sess.userdata.id;
    let listener;
    try {
        console.log('Setting up REDIS');
        listener = await new ChatController().listenForChatEvents(userInfo);
        listener.on('message', (channel, message) => {
            console.log('MEssage recieved to websocket. Sending message to clients...');
            ws.send(message);
        });
    }
    catch (e) {
        console.log('Closing ws conn  due to redis error', e);
        ws.close();
    }
    ws.on('close', function () {
        console.log('Websocket conn closed - disconnecting redis');
        if (listener && listener.disconnect) {
            listener.disconnect();
        }
    });
});

