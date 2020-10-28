/**
 * Imports
 */
// Interfaces
import * as model from '../../models/models';
import { YesAuth } from '../../middleware/Auth';
import { csrf } from '../../dal/auth';
// Autoload
import controller from '../controller';
import {
    BodyParams,
    Controller,
    Delete,
    Get,
    Locals,
    PathParams,
    Post,
    Put,
    QueryParams,
    Req,
    Required,
    Use,
    UseBefore,
    UseBeforeEach
} from '@tsed/common';
import { Description, Returns, ReturnsArray, Summary } from '@tsed/swagger';
import TwoStepCheck from '../../middleware/TwoStepCheck';
import TwoStepMiddleware from '../../middleware/TwoStepCheck';
import * as middleware from '../../middleware/middleware';

/**
 * Trade Ads Controller
 */
@Controller('/trade-ads')
export default class TradeAdsController extends controller {
    constructor() {
        super();
    }

    @Get('/metadata')
    @Summary('Trade ads metadata')
    @Returns(200, { type: model.tradeAds.MetaDataResponse })
    public async getMetadata() {
        return {
            isEnabled: model.tradeAds.isEnabled,
        }
    }

    @Get('/search')
    @Summary('Search all trade ads')
    @Use(middleware.YesAuth, middleware.tradeAds.ValidateFeatureFlag)
    @Returns(200, { type: model.tradeAds.TradeAdsSearchResponse })
    public async search(
        @Locals('userInfo') userInfo: model.UserSession,

        @Description('Only show trade ads that are running (1 = true, 0 = false, defaults to true)')
        @QueryParams('isRunning', Number) isRunning: number = 1,

        @Description('Only show trade ads that can be completed by the authenticated user (1 = true, 0 = false, defaults to false)')
        @QueryParams('onlyShowCompletable', Number) onlyShowCompletable: number = 0,

        @Description('Only show trade ads created by this userId')
        @QueryParams('userId', Number) userId?: number,

        @QueryParams('limit', Number) limit: number = 100,
        @QueryParams('offset', Number) offset: number = 0,
    ) {
        // Default to 1 if invalid
        if (isRunning !== 0 && isRunning !== 1) {
            isRunning = 1;
        }
        // Default to 0 if invalid
        if (onlyShowCompletable !== 0 && onlyShowCompletable !== 1) {
            onlyShowCompletable = 0;
        }
        // default to 100 if invalid
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
        request.isRunning = isRunning as 0 | 1;
        request.offset = offset;
        return this.tradeAds.search(request);
    }

    @Put('/ad/create')
    @Summary('Create a trade ad')
    @Description('offerItems should be array of userInventoryIds, while requestItems should be array of catalogIds')
    @Returns(400, {
        type: model.Error,
        description: 'InvalidItemsSpecified: One or more of the userInventoryId(s) are invalid\nPrimaryRequestTooLarge: Primary Currency Request is too large\nPrimaryOfferTooLarge: Primary Currency offer is too large\n'
    })
    @Returns(409, {
        type: model.Error,
        description: 'CannotTradeWithUser: Authenticated user has trading disabled\nTooManyPendingTrades: You have too many pending trades\nNotEnoughPrimaryCurrencyForOffer: User does not have enough currency for this offer\n'
    })
    @Returns(503, { type: model.Error, description: 'Unavailable: Feature is unavailable\n' })
    @Use(csrf, YesAuth, TwoStepMiddleware('TradeRequest'), middleware.tradeAds.ValidateFeatureFlag)
    public async createTradeAd(
        @Req() req: Req,
        @Locals('userInfo') userInfo: model.UserSession,
        @Required()
        @BodyParams(model.tradeAds.CreateTradeAdRequest) body: model.tradeAds.CreateTradeAdRequest,
    ) {
        if (!model.economy.trade.isEnabled) {
            throw new this.ServiceUnavailable('Unavailable');
        }
        const forUpdate = [
            'users',
            'trade_ad_items',
            'trade_ads',
            'user_inventory',
        ]
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
            // Check offer primary
            if (offerPrimary > userInfo.primaryBalance) {
                throw new this.Conflict('NotEnoughPrimaryCurrencyForOffer');
            }
            // Check total offer
            if (offerPrimary >= model.economy.trade.maxOfferPrimary) {
                throw new this.BadRequest('PrimaryOfferTooLarge');
            }
            if (requestPrimary >= model.economy.trade.maxRequestPrimary) {
                throw new this.BadRequest('PrimaryRequestTooLarge');
            }
            // Reset if non-0
            if (offerPrimary <= 0) {
                offerPrimary = 0;
            }
            if (requestPrimary <= 0) {
                requestPrimary = 0;
            }
            const localInfo = await trx.user.getInfo(userInfo.userId, ['tradingEnabled']);
            // Check if user has Trading Disabled
            if (localInfo.tradingEnabled === model.user.tradingEnabled.false) {
                throw new this.Conflict('CannotTradeWithUser');
            }
            if (
                !Array.isArray(requestItems) ||
                !Array.isArray(offerItems) ||
                offerItems.length < 1 ||
                offerItems.length > model.economy.trade.maxItemsPerSide ||
                requestItems.length < 1 ||
                requestItems.length > model.economy.trade.maxItemsPerSide
            ) {
                throw new this.BadRequest('InvalidItemsSpecified');
            }
            const safeRequestedItems: model.tradeAds.TradeRequestItem[] = [];
            // Check Items User is Requesting
            for (const item of requestItems) {
                if (!item) {
                    throw new this.BadRequest('InvalidItemsSpecified');
                }
                // Verify item exists and is owned by partner
                const info = await trx.catalog.getInfo(item.catalogId);
                if (info.collectible === model.catalog.collectible.false) {
                    // Not collectible
                    throw new this.BadRequest('InvalidItemsSpecified');
                }
                safeRequestedItems.push({
                    'catalogId': info.catalogId,
                    'userInventoryId': undefined,
                });
            }
            const safeOfferItems: model.tradeAds.TradeOfferItem[] = [];
            // Check Items user is Providing
            for (const item of offerItems) {
                if (!item || !item.userInventoryId) {
                    throw new this.BadRequest('InvalidItemsSpecified');
                }
                // Verify item exists and is owned by authenticated user
                const info = await trx.catalog.getItemByUserInventoryId(item.userInventoryId);
                if (info.userId !== userInfo.userId) {
                    // Owned by someone else
                    throw new this.BadRequest('InvalidItemsSpecified');
                }
                if (info.collectible === model.catalog.collectible.false) {
                    // Not collectible
                    throw new this.BadRequest('InvalidItemsSpecified');
                }
                safeOfferItems.push({
                    'userInventoryId': item.userInventoryId,
                    'catalogId': info.catalogId,
                });
            }
            // Create Trade
            // Count open trade ads
            const count = await trx.tradeAds.countOpenTradeAdsByUser(userInfo.userId);
            // Confirm they aren't spamming trades
            if (count >= 5) {
                throw new this.Conflict('TooManyPendingTrades');
            }
            // Create
            const tradeId = await trx.tradeAds.createTradeAd(userInfo.userId, offerPrimary, requestPrimary);
            // Add Requested Items
            await trx.tradeAds.addItemsToTrade(tradeId, model.economy.tradeSides.Requested, safeRequestedItems);
            // Add Self Items
            await trx.tradeAds.addItemsToTrade(tradeId, model.economy.tradeSides.Requester, safeOfferItems);
            // Log ip
            let ip = req.ip;
            if (req.headers['cf-connecting-ip']) {
                ip = req.headers['cf-connecting-ip'] as string;
            }
            await trx.user.logUserIp(userInfo.userId, ip, model.user.ipAddressActions.TradeAdCreated);
        });
        // Return Success
        return {
            'success': true,
        };
    }

    @Delete('/ad/:adId')
    @Summary('Delete a trade ad')
    @Description('This action can only be performed on trade ads that are currently running, i.e., if the trade ad was already accepted then it cannot be completed')
    public async deleteAd() {

    }

    @Post('/ad/:adId/accept')
    @Summary('Accept a trade advertisment')
    public async acceptAd() {

    }
}
