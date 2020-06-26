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
const config_1 = require("../../helpers/config");
const UserModel = require("../../models/v1/user");
const Auth_1 = require("../../middleware/Auth");
let WWWController = class WWWController extends controller_1.default {
    constructor() {
        super();
    }
    performanceTest() {
        return 'BWS OK';
    }
    redirectToDiscord() { }
    async Index(userInfo, res) {
        if (userInfo) {
            return res.redirect(302, '/dashboard');
        }
        return new Www_1.WWWTemplate({
            title: "Homepage",
            userInfo: userInfo,
        });
    }
    async Terms(userInfo) {
        return new Www_1.WWWTemplate({
            title: "Terms of Service",
            userInfo: userInfo,
        });
    }
    async buyCurrency() {
        let count = 0;
        try {
            count = await this.catalog.countAllItemsForSale();
        }
        catch (e) {
            count = 1500;
        }
        let wwwTemp = new Www_1.WWWTemplate({
            title: 'Currency',
        });
        wwwTemp.page.catalogCount = count;
        wwwTemp.page.clientId = config_1.default.paypal.clientid;
        return wwwTemp;
    }
};
__decorate([
    common_1.Get('/perf.txt'),
    swagger_1.Summary('Perf'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WWWController.prototype, "performanceTest", null);
__decorate([
    common_1.Get('/discord'),
    common_1.Redirect('https://discord.gg/CAjZfcZ'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WWWController.prototype, "redirectToDiscord", null);
__decorate([
    common_1.Get("/"),
    common_1.Render('index'),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserModel.SessionUserInfo, Object]),
    __metadata("design:returntype", Promise)
], WWWController.prototype, "Index", null);
__decorate([
    common_1.Get("/terms"),
    common_1.Render('terms'),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserModel.SessionUserInfo]),
    __metadata("design:returntype", Promise)
], WWWController.prototype, "Terms", null);
__decorate([
    common_1.Get('/currency'),
    common_1.UseBefore(Auth_1.YesAuth),
    common_1.Render('currency'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WWWController.prototype, "buyCurrency", null);
WWWController = __decorate([
    swagger_1.Hidden(),
    common_1.Controller("/"),
    __metadata("design:paramtypes", [])
], WWWController);
exports.WWWController = WWWController;

