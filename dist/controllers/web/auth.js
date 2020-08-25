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
const Www_1 = require("../../models/v2/Www");
const controller_1 = require("../controller");
const moment = require("moment");
const UserModel = require("../../models/v1/user");
const Auth_1 = require("../../middleware/Auth");
let WWWAuthController = class WWWAuthController extends controller_1.default {
    constructor() {
        super();
    }
    login() {
        return new Www_1.WWWTemplate({
            title: "Login",
        });
    }
    async signup(res, req, referralId) {
        let referral = undefined;
        if (referralId) {
            referral = await this.userReferral.getInfoById(referralId);
            let referer = req.headers['referer'];
            if (referer) {
                const badReferers = [
                    'brick-hill.com',
                    'finobe.com',
                ];
                for (const bad of badReferers) {
                    if (referer.indexOf(bad)) {
                        res.redirect('https://www.google.com');
                        return;
                    }
                }
            }
        }
        return new Www_1.WWWTemplate({
            title: "Signup",
            page: {
                referral,
            }
        });
    }
    dashboard(userInfo) {
        return new Www_1.WWWTemplate({
            title: "Dashboard",
            userInfo: userInfo,
        });
    }
    ModerationHistory(userInfo) {
        return new Www_1.WWWTemplate({
            title: "Moderation History",
            userInfo: userInfo,
        });
    }
    Avatar(userInfo) {
        return new Www_1.WWWTemplate({
            title: "Avatar",
            userInfo: userInfo,
        });
    }
    async emailVerification(userInfo, code) {
        return new this.WWWTemplate({ 'title': 'Email Verification', userInfo: userInfo, page: { 'code': code } });
    }
    resetPasswordRequest() {
        let ViewData = new this.WWWTemplate({
            title: 'Reset Your Password'
        });
        ViewData.page = {};
        return ViewData;
    }
    async resetPassword(res, code, userId) {
        let info;
        try {
            if (!userId) {
                throw false;
            }
            info = await this.user.getPasswordResetInfo(code);
            if (info.userId !== userId) {
                throw false;
            }
            if (moment().isSameOrAfter(moment(info.dateCreated).add(2, "hours"))) {
                throw false;
            }
        }
        catch (e) {
            return res.redirect("/404");
        }
        let ViewData = new this.WWWTemplate({
            title: 'Reset Password'
        });
        ViewData.page = {
            'code': code,
            'userId': userId,
        };
        return ViewData;
    }
    loadNotifications(userInfo) {
        return new this.WWWTemplate({
            title: 'Notifications',
            userInfo: userInfo,
        });
    }
    V1AuthenticationFlow(userInfo, returnUrl) {
        let parsedUrl = returnUrl.replace(/https:\/\//g, '');
        parsedUrl = parsedUrl.replace(/http:\/\//g, '');
        let positionOfFirstSlash = parsedUrl.indexOf('/');
        if (positionOfFirstSlash !== -1) {
            parsedUrl = parsedUrl.slice(0, positionOfFirstSlash);
        }
        return new Www_1.WWWTemplate({
            title: "Sign Into " + parsedUrl,
            userInfo: userInfo,
            page: {
                url: returnUrl,
                parsedUrl: parsedUrl,
            }
        });
    }
};
__decorate([
    common_1.Get('/login'),
    common_1.Use(Auth_1.NoAuth),
    common_1.Render('login'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WWWAuthController.prototype, "login", null);
__decorate([
    common_1.Get('/signup'),
    common_1.Use(Auth_1.NoAuth),
    common_1.Render('signup'),
    __param(0, common_1.Res()),
    __param(1, common_1.Req()),
    __param(2, common_1.QueryParams('r', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Number]),
    __metadata("design:returntype", Promise)
], WWWAuthController.prototype, "signup", null);
__decorate([
    common_1.Get('/dashboard'),
    common_1.Use(Auth_1.YesAuth),
    common_1.Render('dashboard'),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserModel.SessionUserInfo]),
    __metadata("design:returntype", void 0)
], WWWAuthController.prototype, "dashboard", null);
__decorate([
    common_1.Get('/moderation'),
    common_1.Use(Auth_1.YesAuth),
    common_1.Render('moderation'),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserModel.SessionUserInfo]),
    __metadata("design:returntype", void 0)
], WWWAuthController.prototype, "ModerationHistory", null);
__decorate([
    common_1.Get('/avatar'),
    common_1.Use(Auth_1.YesAuth),
    common_1.Render('avatar'),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserModel.SessionUserInfo]),
    __metadata("design:returntype", void 0)
], WWWAuthController.prototype, "Avatar", null);
__decorate([
    common_1.Get('/email/verify'),
    common_1.Use(Auth_1.YesAuth),
    common_1.Render('email_verify'),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.QueryParams('code', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserModel.SessionUserInfo, String]),
    __metadata("design:returntype", Promise)
], WWWAuthController.prototype, "emailVerification", null);
__decorate([
    common_1.Get('/request/password-reset'),
    common_1.Render('request_password_reset'),
    common_1.Use(Auth_1.NoAuth),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WWWAuthController.prototype, "resetPasswordRequest", null);
__decorate([
    common_1.Get('/reset/password'),
    common_1.Use(Auth_1.NoAuth),
    common_1.Render('reset_password'),
    __param(0, common_1.Res()),
    __param(1, common_1.QueryParams('code', String)),
    __param(2, common_1.QueryParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number]),
    __metadata("design:returntype", Promise)
], WWWAuthController.prototype, "resetPassword", null);
__decorate([
    common_1.Get('/notifications'),
    swagger_1.Summary('Notifications page'),
    common_1.Use(Auth_1.YesAuth),
    common_1.Render('notifications'),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserModel.SessionUserInfo]),
    __metadata("design:returntype", void 0)
], WWWAuthController.prototype, "loadNotifications", null);
__decorate([
    common_1.Get('/v1/authenticate-to-service'),
    common_1.Use(Auth_1.YesAuth),
    common_1.Render('authenticate-to-service'),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.QueryParams('returnUrl', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserModel.SessionUserInfo, String]),
    __metadata("design:returntype", void 0)
], WWWAuthController.prototype, "V1AuthenticationFlow", null);
WWWAuthController = __decorate([
    common_1.Controller("/"),
    __metadata("design:paramtypes", [])
], WWWAuthController);
exports.WWWAuthController = WWWAuthController;

