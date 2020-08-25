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
const controller_1 = require("../controller");
const common_1 = require("@tsed/common");
const auth_1 = require("../../dal/auth");
const Auth_1 = require("../../middleware/Auth");
const swagger_1 = require("@tsed/swagger");
const RecaptchaV2_1 = require("../../middleware/RecaptchaV2");
let SupportController = class SupportController extends controller_1.default {
    constructor() {
        super();
    }
    async getMyTickets(userInfo) {
        return await this.support.getTicketsByUser(userInfo.userId);
    }
    async getTicketById(userInfo, ticketId) {
        let ticketInfo = await this.support.getTicketById(ticketId);
        if (ticketInfo.userId !== userInfo.userId) {
            throw new this.BadRequest('InvalidTicketId');
        }
        return ticketInfo;
    }
    async getTicketReplies(userInfo, ticketId) {
        let ticketInfo = await this.support.getTicketById(ticketId);
        if (ticketInfo.userId !== userInfo.userId) {
            throw new this.BadRequest('InvalidTicketId');
        }
        return await this.support.getTicketReplies(ticketId);
    }
    async createTicket(userInfo, title, body) {
        if (title.length > 255 || title.length < 3) {
            throw new this.BadRequest('InvalidTitle');
        }
        if (body.length > 4096 || body.length < 10) {
            throw new this.BadRequest('InvalidBody');
        }
        await this.support.createTicket(userInfo.userId, title, body);
        return {
            success: true,
        };
    }
    async closeTicket(userInfo, ticketId) {
        let ticketInfo = await this.support.getTicketById(ticketId);
        if (ticketInfo.userId !== userInfo.userId) {
            throw new this.BadRequest('InvalidTicketId');
        }
        await this.support.updateTicketStatus(ticketId, model.support.TicketStatus.Closed);
        return {
            success: true,
        };
    }
    async replyToTicket(userInfo, ticketId, body) {
        if (body.length > 4096 || body.length < 5) {
            throw new this.BadRequest('InvalidBody');
        }
        let ticketInfo = await this.support.getTicketById(ticketId);
        if (ticketInfo.userId !== userInfo.userId) {
            throw new this.BadRequest('InvalidTicketId');
        }
        if (ticketInfo.ticketStatus !== model.support.TicketStatus.PendingCustomerResponse) {
            throw new this.BadRequest('TicketStatusDoesNotAllowReply');
        }
        await this.support.updateTicketStatus(ticketId, model.support.TicketStatus.PendingSupportResponse);
        await this.support.replyToTicket(ticketId, userInfo.userId, body);
        return {
            success: true,
        };
    }
};
__decorate([
    common_1.Get('/my/tickets'),
    swagger_1.Summary('Fetch user-created tickets'),
    common_1.Use(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "getMyTickets", null);
__decorate([
    common_1.Get('/ticket/:ticketId/info'),
    swagger_1.Summary('Get ticket data for the {ticketId}'),
    common_1.Use(Auth_1.YesAuth),
    swagger_1.Returns(200, { type: model.support.SupportTicket }),
    swagger_1.Returns(400, controller_1.default.cError('InvalidTicketId: TicketId is invalid or does not belong to the authenticated user')),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('ticketId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession, Number]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "getTicketById", null);
__decorate([
    common_1.Get('/ticket/:ticketId/replies'),
    swagger_1.Summary('Get replies to ticket'),
    common_1.Use(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('ticketId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "getTicketReplies", null);
__decorate([
    common_1.Post('/ticket/create'),
    swagger_1.Summary('Create a ticket'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, RecaptchaV2_1.default),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.BodyParams('title', String)),
    __param(2, common_1.BodyParams('body', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, String, String]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "createTicket", null);
__decorate([
    common_1.Post('/ticket/:ticketId/close'),
    swagger_1.Summary('Close a ticket'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('ticketId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "closeTicket", null);
__decorate([
    common_1.Post('/ticket/:ticketId/reply'),
    swagger_1.Summary('Reply to a ticket'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('ticketId', Number)),
    __param(2, common_1.BodyParams('body', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, String]),
    __metadata("design:returntype", Promise)
], SupportController.prototype, "replyToTicket", null);
SupportController = __decorate([
    common_1.Controller('/support'),
    __metadata("design:paramtypes", [])
], SupportController);
exports.default = SupportController;

