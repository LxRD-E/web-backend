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
const swagger_1 = require("@tsed/swagger");
const controller_1 = require("../controller");
const middleware = require("../../middleware/middleware");
const model = require("../../models/models");
let UserReferralController = class UserReferralController extends controller_1.default {
    constructor() {
        super();
    }
    async getReferralCodeInfo(referralId) {
        return await this.userReferral.getInfoById(referralId);
    }
    getAuthenticatedUserReferralData(sess) {
        return this.userReferral.getReferralUsedByUser(sess.userId);
    }
    getReferralCode(sess) {
        return this.userReferral.getReferralCodeCreatedByUser(sess.userId);
    }
    createReferralCode(sess) {
        return this.userReferral.createReferralCode(sess.userId);
    }
    async getUserReferralUses(referralId, limit = 100, offset = 0) {
        return this.userReferral.getReferralCodeUses(referralId, offset, limit);
    }
    getUserReferralContestEntry(sess) {
        return this.userReferral.getReferralContestStatusForUser(sess.userId);
    }
};
__decorate([
    common_1.Get('/code/:referralId/info'),
    swagger_1.Summary('Get referral code information by the {referralId}'),
    swagger_1.Returns(200, {
        type: model.userReferral.UserReferralInfo,
    }),
    swagger_1.Returns(404, controller_1.default.cError('InvalidReferralId: referralId is invalid or does not exist')),
    __param(0, common_1.PathParams('referralId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], UserReferralController.prototype, "getReferralCodeInfo", null);
__decorate([
    common_1.Get('/my/referral'),
    swagger_1.Summary('Get the authenticated users referral info (who referred the authenticated user)'),
    swagger_1.Returns(200, {
        type: model.userReferral.UserReferralInfo,
    }),
    swagger_1.Returns(404, controller_1.default.cError('NotFound: User was not referred or referral code was deleted')),
    common_1.Use(middleware.YesAuth),
    __param(0, middleware.UserInfo()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession]),
    __metadata("design:returntype", void 0)
], UserReferralController.prototype, "getAuthenticatedUserReferralData", null);
__decorate([
    common_1.Get('/my/referral-code'),
    swagger_1.Summary('Get the referral code created by the authenticated user'),
    swagger_1.Returns(200, {
        type: model.userReferral.ExtendedUserReferralInfo,
    }),
    swagger_1.Returns(400, controller_1.cError('NotFound: Referral does not exist')),
    common_1.Use(middleware.YesAuth),
    __param(0, middleware.UserInfo()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession]),
    __metadata("design:returntype", void 0)
], UserReferralController.prototype, "getReferralCode", null);
__decorate([
    common_1.Put('/my/referral-code'),
    swagger_1.Summary('Create a referral code to use to refer other users'),
    swagger_1.Returns(200, {
        type: model.userReferral.UserReferralInfo,
    }),
    swagger_1.Returns(409, controller_1.cError('ReferralAlreadyExists: A referral for this user already exists')),
    common_1.Use(middleware.YesAuth, middleware.csrf),
    __param(0, middleware.UserInfo()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession]),
    __metadata("design:returntype", void 0)
], UserReferralController.prototype, "createReferralCode", null);
__decorate([
    common_1.Get('/code/:referralId/uses'),
    swagger_1.Summary('Get a page of referral code uses'),
    swagger_1.Returns(200, {
        type: model.userReferral.UserReferralUseResult
    }),
    swagger_1.Returns(404, controller_1.cError('InvalidReferralId: Referral ID is invalid or does not exist')),
    swagger_1.Returns(400, controller_1.cError(...controller_1.paging)),
    common_1.Use(middleware.YesAuth, middleware.ValidatePaging, middleware.userReferral.ValidateId),
    __param(0, common_1.Required()),
    __param(0, common_1.PathParams('referralId', Number)),
    __param(1, common_1.QueryParams('limit', Number)),
    __param(2, common_1.QueryParams('offset', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", Promise)
], UserReferralController.prototype, "getUserReferralUses", null);
__decorate([
    common_1.Get('/my/referral-contest/entry'),
    swagger_1.Summary('Get the referral contest entry for the {userId}'),
    swagger_1.Returns(200, {
        type: model.userReferral.UserReferralContestEntry
    }),
    swagger_1.Returns(404, controller_1.cError('NotFound: A contest entry could not be located')),
    common_1.Use(middleware.YesAuth),
    __param(0, middleware.UserInfo()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession]),
    __metadata("design:returntype", void 0)
], UserReferralController.prototype, "getUserReferralContestEntry", null);
UserReferralController = __decorate([
    common_1.Controller('/user-referral'),
    swagger_1.Description('Endpoints regarding user referral system'),
    __metadata("design:paramtypes", [])
], UserReferralController);
exports.UserReferralController = UserReferralController;

