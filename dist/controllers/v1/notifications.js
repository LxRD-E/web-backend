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
const model = require("../../models/models");
const common_1 = require("@tsed/common");
const controller_1 = require("../controller");
const Auth_1 = require("../../middleware/Auth");
const swagger_1 = require("@tsed/swagger");
const auth_1 = require("../../dal/auth");
let NotificationsController = class NotificationsController extends controller_1.default {
    constructor() {
        super();
    }
    async getMessages(userData, numericOffset = 0) {
        return await this.notification.getMessages(userData.userId, numericOffset);
    }
    async markAsRead(userData, numericId) {
        await this.notification.markAsRead(userData.userId, numericId);
        return {
            'success': true,
        };
    }
    async multiMarkAsRead(userData, ids) {
        if (ids.length >= 100 || ids.length <= 0) {
            throw new this.BadRequest('InvalidIds');
        }
        await this.notification.multiMarkAsRead(userData.userId, ids);
        return {
            'success': true,
        };
    }
    async countNotifications(userData) {
        const notificationsCount = await this.notification.countUnreadMessages(userData.userId);
        const friendRequestCount = await this.notification.countInboundFriendRequests(userData.userId);
        return {
            'unreadMessageCount': notificationsCount,
            'friendRequestCount': friendRequestCount,
        };
    }
    async getFriendRequests(userData, numericOffset) {
        return await this.user.getFriendRequests(userData.userId, numericOffset);
    }
};
__decorate([
    common_1.Get('/messages'),
    swagger_1.Summary('Get all messages'),
    common_1.Use(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.QueryParams('offset', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.SessionUserInfo, Number]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getMessages", null);
__decorate([
    common_1.Patch('/message/:id/read'),
    swagger_1.Summary('Mark message as read'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('id', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.SessionUserInfo, Number]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "markAsRead", null);
__decorate([
    common_1.Post('/message/multi-mark-as-read'),
    swagger_1.Summary('Mark multiple message as read'),
    swagger_1.Description('Maxiumum amount of 100 ids can be specified'),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidIds: IDs are invalid\n' }),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.BodyParams('ids', Array)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.SessionUserInfo, Array]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "multiMarkAsRead", null);
__decorate([
    common_1.Get('/count'),
    swagger_1.Summary('Count all unread notifications'),
    common_1.Use(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.SessionUserInfo]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "countNotifications", null);
__decorate([
    common_1.Get('/requests'),
    common_1.Use(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.QueryParams('offset', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.SessionUserInfo, Number]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getFriendRequests", null);
NotificationsController = __decorate([
    common_1.Controller('/notifications'),
    __metadata("design:paramtypes", [])
], NotificationsController);
exports.NotificationsController = NotificationsController;

