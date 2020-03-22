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
const common_1 = require("@tsed/common");
const controller_1 = require("../../controllers/controller");
const model = require("../../models/models");
const swagger_1 = require("@tsed/swagger");
let ConfirmPermissionForStatus = class ConfirmPermissionForStatus extends controller_1.default {
    async use(userInfo, userStatusId) {
        let statusData;
        try {
            statusData = await this.user.getStatusById(userStatusId);
        }
        catch (e) {
            throw new this.BadRequest('InvalidStatusId');
        }
        let info = await this.user.getFriendshipStatus(userInfo.userId, statusData.userId);
        if (!info.areFriends && userInfo.userId !== statusData.userId) {
            throw new this.BadRequest('InvalidStatusId');
        }
    }
};
__decorate([
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.PathParams('userStatusId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], ConfirmPermissionForStatus.prototype, "use", null);
ConfirmPermissionForStatus = __decorate([
    common_1.Middleware(),
    swagger_1.Returns(400, { type: model.Error, description: 'Test Test 1234' })
], ConfirmPermissionForStatus);
exports.ConfirmPermissionForStatus = ConfirmPermissionForStatus;

