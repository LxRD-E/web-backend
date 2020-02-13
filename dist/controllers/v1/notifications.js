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
        const messages = await this.notification.getMessages(userData.userId, numericOffset);
        return messages;
    }
    async markAsRead(userData, numericId) {
        await this.notification.markAsRead(userData.userId, numericId);
        return {
            'success': true,
        };
    }
    async countNotifications(userData) {
        const notifications = await this.notification.countUnreadMessages(userData.userId);
        return {
            'count': notifications,
        };
    }
    async getFriendRequests(userData, numericOffset) {
        const notifications = await this.user.getFriendRequests(userData.userId, numericOffset);
        return notifications;
    }
};
__decorate([
    common_1.UseBefore(Auth_1.YesAuth),
    common_1.Get('/messages'),
    swagger_1.Summary('Get all messages'),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.QueryParams('offset', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.SessionUserInfo, Number]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getMessages", null);
__decorate([
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    common_1.Patch('/message/:id/read'),
    swagger_1.Summary('Mark message as read'),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('id', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.SessionUserInfo, Number]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "markAsRead", null);
__decorate([
    common_1.Get('/count'),
    swagger_1.Summary('Count all unread notifications'),
    common_1.UseBefore(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.SessionUserInfo]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "countNotifications", null);
__decorate([
    common_1.UseBefore(Auth_1.YesAuth),
    common_1.Get('/requests'),
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

