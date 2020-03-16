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
const controller_1 = require("../controller");
const Auth_1 = require("../../middleware/Auth");
let WWWAdsController = class WWWAdsController extends controller_1.default {
    constructor() {
        super();
    }
    async adsDashboard(userInfo) {
        return new this.WWWTemplate({ title: 'Ads Dashboard' });
    }
    async createCatalogAd(userInfo, catalogId) {
        let info = await this.catalog.getInfo(catalogId);
        if (info.creatorType === model.catalog.creatorType.User && info.creatorId !== userInfo.userId) {
            throw new this.BadRequest('InvalidCatalogId');
        }
        else if (info.creatorType === model.catalog.creatorType.Group) {
            let groupInfo = await this.group.getInfo(info.creatorId);
            if (groupInfo.groupOwnerUserId !== userInfo.userId) {
                throw new this.BadRequest('InvalidCatalogId');
            }
        }
        let ViewData = new this.WWWTemplate({ title: 'Create Catalog Ad', page: {
                catalogInfo: info,
                adDisplayTypes: model.ad.AdDisplayType,
            } });
        return ViewData;
    }
    async createGroupAd(userInfo, groupId) {
        let info = await this.group.getInfo(groupId);
        if (info.groupStatus === model.group.groupStatus.locked || info.groupOwnerUserId !== userInfo.userId) {
            throw new this.BadRequest('InvalidGroupId');
        }
        return new this.WWWTemplate({ title: 'Create Group Ad', page: {
                groupInfo: info,
                adDisplayTypes: model.ad.AdDisplayType,
            } });
    }
    async createThreadAd(userInfo, threadId) {
        let info = await this.forum.getThreadById(threadId);
        if (info.userId !== userInfo.userId || info.threadDeleted !== model.forum.threadDeleted.false) {
            throw new this.BadRequest('InvalidThreadId');
        }
        return new this.WWWTemplate({ title: 'Create Thread Ad', page: {
                threadInfo: info,
                adDisplayTypes: model.ad.AdDisplayType,
            } });
    }
};
__decorate([
    common_1.Get('/ads'),
    swagger_1.Summary('Ads dashboard'),
    common_1.Use(Auth_1.YesAuth),
    common_1.Render('ad/dashboard'),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo]),
    __metadata("design:returntype", Promise)
], WWWAdsController.prototype, "adsDashboard", null);
__decorate([
    common_1.Get('/ad/catalog/create/:catalogId'),
    common_1.Render('ad/catalog_create'),
    common_1.Use(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('catalogId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], WWWAdsController.prototype, "createCatalogAd", null);
__decorate([
    common_1.Get('/ad/group/create/:groupId'),
    common_1.Render('ad/group_create'),
    common_1.Use(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], WWWAdsController.prototype, "createGroupAd", null);
__decorate([
    common_1.Get('/ad/thread/create/:threadId'),
    common_1.Render('ad/thread_create'),
    common_1.Use(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('threadId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], WWWAdsController.prototype, "createThreadAd", null);
WWWAdsController = __decorate([
    common_1.Controller("/"),
    __metadata("design:paramtypes", [])
], WWWAdsController);
exports.WWWAdsController = WWWAdsController;

