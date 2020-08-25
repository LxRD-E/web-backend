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
const model = require("../../models/models");
const middleware = require("../../middleware/middleware");
const auth_1 = require("../../dal/auth");
const controller_1 = require("../controller");
const Auth_1 = require("../../middleware/Auth");
let ReportAbuseController = class ReportAbuseController extends controller_1.default {
    constructor() {
        super();
    }
    getReportAbuseReasons() {
        return model.reportAbuse.ReportReason;
    }
    async reportUserStatus(userInfo, userStatusId, reason, res) {
        res.status(200).send({
            success: true,
        });
        try {
            await this.reportAbuse.reportUserStatusId(userStatusId, userInfo.userId, reason);
        }
        catch (e) {
            console.error(e);
        }
    }
};
__decorate([
    common_1.Get('/metadata/reasons'),
    swagger_1.Summary('Get report abuse reasons'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ReportAbuseController.prototype, "getReportAbuseReasons", null);
__decorate([
    common_1.Post('/feed/friends/:userStatusId'),
    swagger_1.Summary('Report a userStatusId as abusive'),
    swagger_1.Description('Note this endpoint will always return OK, even if content could not be reported'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.feed.ConfirmPermissionForStatus, middleware.reportAbuse.ConfirmReportReasonValid),
    swagger_1.Returns(200, { description: 'User status reported' }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.PathParams('userStatusId', Number)),
    __param(2, common_1.Required()),
    __param(2, common_1.BodyParams('reason', Number)),
    __param(3, common_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], ReportAbuseController.prototype, "reportUserStatus", null);
ReportAbuseController = __decorate([
    common_1.Controller('/report-abuse'),
    swagger_1.Description('Report website content as rule-breaking'),
    __metadata("design:paramtypes", [])
], ReportAbuseController);
exports.default = ReportAbuseController;

