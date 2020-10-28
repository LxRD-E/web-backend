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
const Auth_1 = require("../../middleware/Auth");
const auth_1 = require("../../dal/auth");
const controller_1 = require("../controller");
const common_1 = require("@tsed/common");
const swagger_1 = require("@tsed/swagger");
const TwoStepCheck_1 = require("../../middleware/TwoStepCheck");
const middleware = require("../../middleware/middleware");
let TradeAdsController = class TradeAdsController extends controller_1.default {
    constructor() {
        super();
    }
    async getMetadata() {
        return {
            isEnabled: model.tradeAds.isEnabled,
        };
    }
    async search(userInfo, isRunning = 1, onlyShowCompletable = 0, userId, limit = 100, offset = 0) {
        if (isRunning !== 0 && isRunning !== 1) {
            isRunning = 1;
        }
        if (onlyShowCompletable !== 0 && onlyShowCompletable !== 1) {
            onlyShowCompletable = 0;
        }
        if (limit > 100 || limit < 1) {
            limit = 100;
        }
        let request = new model.tradeAds.TradeAdsSearchRequest();
        request.limit = limit;
        if (onlyShowCompletable) {
            request.allowedRequestedCatalogIds = await this.user.getUniqueOwnedCollectibleCatalogIds(userInfo.userId);
        }
        if (typeof userId === 'number') {
            request.userId = userId;
        }
        request.isRunning = isRunning;
        request.offset = offset;
        return this.tradeAds.search(request);
    }
    async createTradeAd(req, userInfo, body) {
        if (!model.economy.trade.isEnabled) {
            throw new this.ServiceUnavailable('Unavailable');
        }
        const forUpdate = [
            'users',
            'trade_ad_items',
            'trade_ads',
            'user_inventory',
        ];
        await this.transaction(this, forUpdate, async function (trx) {
            let offerPrimary = 0;
            if (body.offerPrimary) {
                offerPrimary = body.offerPrimary;
            }
            let requestPrimary = 0;
            if (body.requestPrimary) {
                requestPrimary = body.requestPrimary;
            }
            let requestItems = body.requestItems;
            let offerItems = body.offerItems;
            if (offerPrimary > userInfo.primaryBalance) {
                throw new this.Conflict('NotEnoughPrimaryCurrencyForOffer');
            }
            if (offerPrimary >= model.economy.trade.maxOfferPrimary) {
                throw new this.BadRequest('PrimaryOfferTooLarge');
            }
            if (requestPrimary >= model.economy.trade.maxRequestPrimary) {
                throw new this.BadRequest('PrimaryRequestTooLarge');
            }
            if (offerPrimary <= 0) {
                offerPrimary = 0;
            }
            if (requestPrimary <= 0) {
                requestPrimary = 0;
            }
            const localInfo = await trx.user.getInfo(userInfo.userId, ['tradingEnabled']);
            if (localInfo.tradingEnabled === model.user.tradingEnabled.false) {
                throw new this.Conflict('CannotTradeWithUser');
            }
            if (!Array.isArray(requestItems) ||
                !Array.isArray(offerItems) ||
                offerItems.length < 1 ||
                offerItems.length > model.economy.trade.maxItemsPerSide ||
                requestItems.length < 1 ||
                requestItems.length > model.economy.trade.maxItemsPerSide) {
                throw new this.BadRequest('InvalidItemsSpecified');
            }
            const safeRequestedItems = [];
            for (const item of requestItems) {
                if (!item) {
                    throw new this.BadRequest('InvalidItemsSpecified');
                }
                const info = await trx.catalog.getInfo(item.catalogId);
                if (info.collectible === model.catalog.collectible.false) {
                    throw new this.BadRequest('InvalidItemsSpecified');
                }
                safeRequestedItems.push({
                    'catalogId': info.catalogId,
                    'userInventoryId': undefined,
                });
            }
            const safeOfferItems = [];
            for (const item of offerItems) {
                if (!item || !item.userInventoryId) {
                    throw new this.BadRequest('InvalidItemsSpecified');
                }
                const info = await trx.catalog.getItemByUserInventoryId(item.userInventoryId);
                if (info.userId !== userInfo.userId) {
                    throw new this.BadRequest('InvalidItemsSpecified');
                }
                if (info.collectible === model.catalog.collectible.false) {
                    throw new this.BadRequest('InvalidItemsSpecified');
                }
                safeOfferItems.push({
                    'userInventoryId': item.userInventoryId,
                    'catalogId': info.catalogId,
                });
            }
            const count = await trx.tradeAds.countOpenTradeAdsByUser(userInfo.userId);
            if (count >= 5) {
                throw new this.Conflict('TooManyPendingTrades');
            }
            const tradeId = await trx.tradeAds.createTradeAd(userInfo.userId, offerPrimary, requestPrimary);
            await trx.tradeAds.addItemsToTrade(tradeId, model.economy.tradeSides.Requested, safeRequestedItems);
            await trx.tradeAds.addItemsToTrade(tradeId, model.economy.tradeSides.Requester, safeOfferItems);
            let ip = req.ip;
            if (req.headers['cf-connecting-ip']) {
                ip = req.headers['cf-connecting-ip'];
            }
            await trx.user.logUserIp(userInfo.userId, ip, model.user.ipAddressActions.TradeAdCreated);
        });
        return {
            'success': true,
        };
    }
    async deleteAd() {
    }
    async acceptAd() {
    }
};
__decorate([
    common_1.Get('/metadata'),
    swagger_1.Summary('Trade ads metadata'),
    swagger_1.Returns(200, { type: model.tradeAds.MetaDataResponse }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TradeAdsController.prototype, "getMetadata", null);
__decorate([
    common_1.Get('/search'),
    swagger_1.Summary('Search all trade ads'),
    common_1.Use(middleware.YesAuth, middleware.tradeAds.ValidateFeatureFlag),
    swagger_1.Returns(200, { type: model.tradeAds.TradeAdsSearchResponse }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, swagger_1.Description('Only show trade ads that are running (1 = true, 0 = false, defaults to true)')),
    __param(1, common_1.QueryParams('isRunning', Number)),
    __param(2, swagger_1.Description('Only show trade ads that can be completed by the authenticated user (1 = true, 0 = false, defaults to false)')),
    __param(2, common_1.QueryParams('onlyShowCompletable', Number)),
    __param(3, swagger_1.Description('Only show trade ads created by this userId')),
    __param(3, common_1.QueryParams('userId', Number)),
    __param(4, common_1.QueryParams('limit', Number)),
    __param(5, common_1.QueryParams('offset', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession, Number, Number, Number, Number, Number]),
    __metadata("design:returntype", Promise)
], TradeAdsController.prototype, "search", null);
__decorate([
    common_1.Put('/ad/create'),
    swagger_1.Summary('Create a trade ad'),
    swagger_1.Description('offerItems should be array of userInventoryIds, while requestItems should be array of catalogIds'),
    swagger_1.Returns(400, {
        type: model.Error,
        description: 'InvalidItemsSpecified: One or more of the userInventoryId(s) are invalid\nPrimaryRequestTooLarge: Primary Currency Request is too large\nPrimaryOfferTooLarge: Primary Currency offer is too large\n'
    }),
    swagger_1.Returns(409, {
        type: model.Error,
        description: 'CannotTradeWithUser: Authenticated user has trading disabled\nTooManyPendingTrades: You have too many pending trades\nNotEnoughPrimaryCurrencyForOffer: User does not have enough currency for this offer\n'
    }),
    swagger_1.Returns(503, { type: model.Error, description: 'Unavailable: Feature is unavailable\n' }),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, TwoStepCheck_1.default('TradeRequest'), middleware.tradeAds.ValidateFeatureFlag),
    __param(0, common_1.Req()),
    __param(1, common_1.Locals('userInfo')),
    __param(2, common_1.Required()),
    __param(2, common_1.BodyParams(model.tradeAds.CreateTradeAdRequest)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, model.UserSession, model.tradeAds.CreateTradeAdRequest]),
    __metadata("design:returntype", Promise)
], TradeAdsController.prototype, "createTradeAd", null);
__decorate([
    common_1.Delete('/ad/:adId'),
    swagger_1.Summary('Delete a trade ad'),
    swagger_1.Description('This action can only be performed on trade ads that are currently running, i.e., if the trade ad was already accepted then it cannot be completed'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TradeAdsController.prototype, "deleteAd", null);
__decorate([
    common_1.Post('/ad/:adId/accept'),
    swagger_1.Summary('Accept a trade advertisment'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TradeAdsController.prototype, "acceptAd", null);
TradeAdsController = __decorate([
    common_1.Controller('/trade-ads'),
    __metadata("design:paramtypes", [])
], TradeAdsController);
exports.default = TradeAdsController;

