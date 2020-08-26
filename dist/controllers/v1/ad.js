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
const config_1 = require("../../helpers/config");
let AdController = class AdController extends controller_1.default {
    constructor() {
        super();
    }
    async getCreatedAds(userInfo) {
        return await this.ad.getUserAds(userInfo.userId);
    }
    async getAdvertisement(adDisplayType) {
        if (!model.ad.AdDisplayType[adDisplayType]) {
            throw new this.BadRequest('InvalidAdDisplayType');
        }
        let ad;
        try {
            ad = await this.ad.getRandomAd(adDisplayType);
        }
        catch (e) {
            throw new this.Conflict('NoAdvertisementAvailable');
        }
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
        if (!url) {
            throw new this.BadRequest('InvalidAdId');
        }
        await this.ad.incrementAdClickCount(adId);
        res.redirect(config_1.default.baseUrl.www + url);
    }
    async createAdvertisement(userInfo, uploadedFiles, title = '', adType, adRedirectId, adDisplayType) {
        if (!model.ad.AdDisplayType[adDisplayType]) {
            throw new this.BadRequest('InvalidAdDisplayType');
        }
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
        if (adDisplayType === model.ad.AdDisplayType.Leaderboard) {
            imageInfo.resize(728, 90);
        }
        else if (adDisplayType === model.ad.AdDisplayType.Skyscraper) {
            imageInfo.resize(160, 600);
        }
        else {
            throw new Error('Ad type specified (' + adDisplayType + ') is not supported by AdController.createAdvertisement()');
            ;
        }
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
        let adId = await this.ad.createAd(userInfo.userId, 'https://cdn.blockshub.net/thumbnails/' + randomName, title, adType, adRedirectId, adDisplayType);
        await this.ad.uploadGeneralThumbnail(randomName, imageData, mime);
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
        await this.economy.createTransaction(userInfo.userId, 1, amount, model.economy.currencyType.primary, model.economy.transactionType.PurchaseOfAdvertisment, 'Purchase of Advertisement', model.catalog.creatorType.User, model.catalog.creatorType.User);
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
    swagger_1.ReturnsArray(200, { type: model.ad.FullAdvertisementDetails }),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo]),
    __metadata("design:returntype", Promise)
], AdController.prototype, "getCreatedAds", null);
__decorate([
    common_1.Get('/random/:adDisplayType'),
    swagger_1.Summary('Get a semi-random advertisement to display to the user'),
    swagger_1.Description('Advertisements are not targeted to comply with COPPA. Ads are purely based off of user bid amounts, i.e, if one user bids 10 primary and another user bids 1, you have a 90% chance of seeing the first ad and a 10% chance of seeing the second ad.'),
    swagger_1.Returns(200, { type: model.ad.Advertisement }),
    swagger_1.Returns(409, { type: model.Error, description: 'NoAdvertisementAvailable: Account status does not permit advertisement, or no ads are available to display to the user\n' }),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidAdDisplayType: AdDisplayId is invalid\n' }),
    __param(0, swagger_1.Description('The type of ad to grab')),
    __param(0, common_1.PathParams('adDisplayType', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdController.prototype, "getAdvertisement", null);
__decorate([
    common_1.Get('/:adId/click'),
    swagger_1.Summary('Click an ad. Redirects to ad location'),
    swagger_1.Returns(302, { description: 'See header value: location\n' }),
    common_1.Status(302),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidAdId: adId is not currently running or is invalid\n' }),
    __param(0, common_1.PathParams('adId', Number)),
    __param(1, common_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdController.prototype, "clickAd", null);
__decorate([
    common_1.Post('/create'),
    swagger_1.Summary('Create an advertisement.'),
    swagger_1.Description('If group or group item, user must be owner of group. If catalog item, user must be creator'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    swagger_1.Returns(200, { description: 'Add Created' }),
    swagger_1.Returns(400, { type: model.Error, description: 'NoFileSpecified: Please specify a body.uploadedFiles\nInvalidAdType: Ad Type is invalid\nInvalidAdTitle: Ad title is invalid, too long, or too short\nInvalidPermissions: You do not have permission to advertise this asset\n' }),
    swagger_1.Returns(409, { type: model.Error, description: 'Cooldown: You cannot create an ad right now\n' }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, swagger_1.Description('File can be a JPG, JPEG, or PNG. We may expand this in the future')),
    __param(1, multipartfiles_1.MultipartFile()),
    __param(2, common_1.BodyParams('title', String)),
    __param(3, common_1.Required()),
    __param(3, swagger_1.Description('The type of ad being advertised. 1 = CatalogItem, 2 = Group, 3 = ForumThread')),
    __param(3, common_1.BodyParams('adType', Number)),
    __param(4, common_1.Required()),
    __param(4, swagger_1.Description('The ID of the adType. For instance, if you want to advertise Forum Thread id 28, this value would be 28')),
    __param(4, common_1.BodyParams('adRedirectId', Number)),
    __param(5, common_1.Required()),
    __param(5, swagger_1.Description('The type of ad to create')),
    __param(5, common_1.BodyParams('adDisplayType', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Array, String, Number, Number, Number]),
    __metadata("design:returntype", Promise)
], AdController.prototype, "createAdvertisement", null);
__decorate([
    common_1.Post('/:adId/bid'),
    swagger_1.Summary('Bid money on an advertisement'),
    swagger_1.Description('User must be creator of ad'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidCurrencyAmount: Currency Amount must be between 1 and 100,000\nInvalidAdId: adId is invalid or not managed by authenticated user\nModerationStatusConflict: Ad moderation status does not allow it to run\n' }),
    swagger_1.Returns(409, { type: model.Error, description: 'AdAlreadyRunning: This ad cannot be run since it is already running\nNotEnoughCurrency: Authenticated user does not have enough currency for this purchase\n' }),
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

