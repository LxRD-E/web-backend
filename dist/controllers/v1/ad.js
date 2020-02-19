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
const multipartfiles_1 = require("@tsed/multipartfiles");
const jimp = require("jimp");
const crypto = require("crypto");
let AdController = class AdController extends controller_1.default {
    constructor() {
        super();
    }
    async getCreatedAds(userInfo) {
        let userAds = await this.ad.getUserAds(userInfo.userId);
        return userAds;
    }
    async getAdvertisment() {
        let ad;
        try {
            ad = await this.ad.getRandomAd();
        }
        catch (e) {
            throw new this.Conflict('NoAdvertismentAvailable');
        }
        await this.ad.incrementAdViewCount(ad.adId);
        return ad;
    }
    async clickAd(adId, res) {
        let ad;
        try {
            ad = await this.ad.getAdById(adId);
        }
        catch {
            throw new this.BadRequest('InvalidAdId');
        }
        let url;
        if (ad.adType === model.ad.AdType.CatalogItem) {
            url = `/catalog/` + ad.adRedirectId + '/--';
        }
        else if (ad.adType === model.ad.AdType.Group) {
            url = `/groups/` + ad.adRedirectId + `/--`;
        }
        else if (ad.adType === model.ad.AdType.ForumThread) {
            url = `/forum/thread/${ad.adRedirectId}?page=1`;
        }
        await this.ad.incrementAdClickCount(adId);
        res.redirect(url);
    }
    async createAdvertisment(userInfo, uploadedFiles, title = '', adType, adRedirectId) {
        let canMakeAd = await this.ad.canUserCreateAd(userInfo.userId);
        if (!canMakeAd) {
            throw new this.Conflict('Cooldown');
        }
        let sortedFiles = await this.catalog.sortFileUploads(uploadedFiles);
        let file;
        let mime;
        let fileEnding = '';
        if (!sortedFiles.jpg) {
            if (!sortedFiles.png) {
                throw new this.BadRequest('NoFileSpecified');
            }
            else {
                mime = 'image/png';
                fileEnding = '.png';
                file = sortedFiles.png;
            }
        }
        else {
            mime = 'image/jpeg';
            fileEnding = '.jpg';
            file = sortedFiles.jpg;
        }
        let imageInfo = await jimp.read(file);
        await imageInfo.resize(728, 90);
        let imageData = await imageInfo.getBufferAsync(mime);
        if (!model.ad.AdType[adType]) {
            throw new this.BadRequest('InvalidAdType');
        }
        if (title.length > 256) {
            throw new this.BadRequest('InvalidAdTitle');
        }
        if (adType === model.ad.AdType.CatalogItem) {
            let asset = await this.catalog.getInfo(adRedirectId, ['creatorId', 'creatorType']);
            if (asset.creatorType === model.catalog.creatorType.User) {
                if (asset.creatorId !== userInfo.userId) {
                    throw new this.BadRequest('InvalidPermissions');
                }
            }
            else if (asset.creatorType === model.catalog.creatorType.Group) {
                let groupInfo = await this.group.getInfo(asset.creatorId);
                if (groupInfo.groupStatus === model.group.groupStatus.locked || groupInfo.groupOwnerUserId !== userInfo.userId) {
                    throw new this.BadRequest('InvalidPermissions');
                }
            }
            else {
                throw new Error('Invalid asset.creatorType for item ' + adRedirectId);
            }
        }
        else if (adType === model.ad.AdType.Group) {
            let groupInfo = await this.group.getInfo(adRedirectId);
            if (groupInfo.groupStatus === model.group.groupStatus.locked || groupInfo.groupOwnerUserId !== userInfo.userId) {
                throw new this.BadRequest('InvalidPermissions');
            }
        }
        else if (adType === model.ad.AdType.ForumThread) {
            let threadInfo = await this.forum.getThreadById(adRedirectId);
            if (threadInfo.userId !== userInfo.userId || threadInfo.threadDeleted !== model.forum.threadDeleted.false) {
                throw new this.BadRequest('InvalidPermissions');
            }
        }
        else {
            throw new Error('Invalid adType: ' + adType);
        }
        let randomName = crypto.randomBytes(32).toString('hex') + fileEnding;
        let adId = await this.ad.createAd(userInfo.userId, 'https://cdn.hindigamer.club/thumbnails/' + randomName, title, adType, adRedirectId, model.ad.AdDisplayType.Leaderboard);
        await this.ad.uploadAdImage(randomName, imageData, mime);
        return {
            success: true,
        };
    }
    async bidAd(userInfo, adId, amount) {
        if (amount < 1 || amount > 100000) {
            throw new this.BadRequest('InvalidCurrencyAmount');
        }
        let adData = await this.ad.getFullAdInfoById(adId);
        if (adData.userId !== userInfo.userId) {
            throw new this.BadRequest('InvalidAdId');
        }
        let canRun = false;
        if (adData.hasRunBefore === false) {
            canRun = true;
        }
        else {
            if (this.moment(adData.updatedAt).subtract(24, 'hours').isSameOrAfter(this.moment())) {
                canRun = false;
            }
            else {
                canRun = true;
            }
        }
        if (!canRun) {
            throw new this.Conflict('AdAlreadyRunning');
        }
        if (adData.moderationStatus !== model.ad.ModerationStatus.Approved) {
            throw new this.BadRequest('ModerationStatusConflict');
        }
        let userBal = await this.user.getInfo(userInfo.userId, ['primaryBalance']);
        if (userBal.primaryBalance >= amount) {
        }
        else {
            throw new this.Conflict('NotEnoughCurrency');
        }
        await this.economy.subtractFromUserBalance(userInfo.userId, amount, model.economy.currencyType.primary);
        await this.economy.createTransaction(userInfo.userId, 1, amount, model.economy.currencyType.primary, model.economy.transactionType.PurchaseOfAdvertisment, 'Purchase of Advertisment', model.catalog.creatorType.User, model.catalog.creatorType.User);
        await this.ad.placeBidOnAd(adId, amount);
        return {
            success: true,
        };
    }
};
__decorate([
    common_1.Get('/my/created-ads'),
    swagger_1.Summary('Get created ads by authenticated user'),
    common_1.Use(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo]),
    __metadata("design:returntype", Promise)
], AdController.prototype, "getCreatedAds", null);
__decorate([
    common_1.Get('/random'),
    swagger_1.Summary('Get a semi-random advertisement to display to the user'),
    swagger_1.Description('We do not target advertisments whatsoever. They are purely based off of user bid amounts, i.e, if one user bids 10 primary and another user bids 1, you have a 90% chance of seeing the first ad and a 10% chance of seeing the second ad.'),
    swagger_1.Returns(200, { type: model.ad.Advertisment }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdController.prototype, "getAdvertisment", null);
__decorate([
    common_1.Get('/:adId/click'),
    swagger_1.Summary('Click an ad. Redirects to ad location'),
    swagger_1.Returns(200, { type: model.ad.AdClickResponse }),
    __param(0, common_1.PathParams('adId', Number)),
    __param(1, common_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdController.prototype, "clickAd", null);
__decorate([
    common_1.Post('/create'),
    swagger_1.Summary('Create an advertisment.'),
    swagger_1.Description('If group or group item, user must be owner of group. If catalog item, user must be creator'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, multipartfiles_1.MultipartFile()),
    __param(2, common_1.BodyParams('title', String)),
    __param(3, common_1.Required()),
    __param(3, common_1.BodyParams('adType', Number)),
    __param(4, common_1.Required()),
    __param(4, common_1.BodyParams('adRedirectId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Array, String, Number, Number]),
    __metadata("design:returntype", Promise)
], AdController.prototype, "createAdvertisment", null);
__decorate([
    common_1.Post('/:adId/bid'),
    swagger_1.Summary('Bid money on an advertisment'),
    swagger_1.Description('User must be creator of ad'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('adId', Number)),
    __param(2, common_1.BodyParams('amount', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number]),
    __metadata("design:returntype", Promise)
], AdController.prototype, "bidAd", null);
AdController = __decorate([
    common_1.Controller('/ad'),
    __metadata("design:paramtypes", [])
], AdController);
exports.default = AdController;

