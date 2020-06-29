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
let ValidateUserId = class ValidateUserId extends controller_1.default {
    async use(userId, session) {
        let info;
        try {
            info = await this.user.getInfo(userId, ["accountStatus"]);
        }
        catch (e) {
            if (e && e.message === 'InvalidUserId') {
                throw new this.BadRequest('InvalidUserId');
            }
            throw e;
        }
        if (session && session.staff >= 1) {
            return;
        }
        if (info.accountStatus === model.user.accountStatus.deleted) {
            throw new this.BadRequest('InvalidUserId');
        }
    }
};
__decorate([
    __param(0, common_1.PathParams('userId', Number)),
    __param(1, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, model.UserSession]),
    __metadata("design:returntype", Promise)
], ValidateUserId.prototype, "use", null);
ValidateUserId = __decorate([
    common_1.Middleware()
], ValidateUserId);
exports.ValidateUserId = ValidateUserId;

