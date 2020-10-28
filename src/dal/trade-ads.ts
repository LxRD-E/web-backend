import * as model from '../models/models';
import _init from './_init';

/**
 * Trade Ads DAL
 */
export default class TradeAdsDAL extends _init {

    /**
     * Search trade ads
     * @param request 
     */
    public async search(request: model.tradeAds.TradeAdsSearchRequest): Promise<model.tradeAds.TradeAdsSearchResponse> {
        if (!request.limit) {
            request.limit = 100;
        }
        let resp = new model.tradeAds.TradeAdsSearchResponse();
        // set defaults
        resp.total = 0;
        resp.data = [];

        let extraWhereClauseForSearch: any = {};
        if (typeof request.userId === 'number') {
            extraWhereClauseForSearch['userid_one'] = request.userId;
        }

        let tradeIds: number[] = [];
        if (request.allowedRequestedCatalogIds) {
            let tradeAdIdQuery = this.knex('trade_ad_items').select('trade_ad_id', 'catalog_id', 'side', 'userinventory_id');
            for (const item of request.allowedRequestedCatalogIds) {
                tradeAdIdQuery.orWhere({
                    'catalog_id': item,
                    'side': 2,
                })
            }
            let ids = await tradeAdIdQuery;
            let unique: number[] = [];
            for (const id of ids) {
                if (unique.includes(id) === false) {
                    unique.push(id);
                }
            }
            resp.total = unique.length;
            let _currentOffset = 0;
            for (const id of unique) {
                if (tradeIds.includes(id)) {
                    continue;
                }
                let tradeItems = await this.knex('trade_ad_items').select('catalog_id', 'side', 'trade_ad_id').where({
                    'trade_ad_id': id,
                    'side': 2,
                });
                let ok = true;
                for (const item of tradeItems) {
                    if (!request.allowedRequestedCatalogIds.includes(item.catalog_id)) {
                        ok = false;
                    }
                }
                _currentOffset++;
                if (_currentOffset < request.offset) {
                    continue; // skip it
                }
                if (ok) {
                    tradeIds.push(id);
                }
                if (tradeIds.length >= request.limit) {
                    break;
                }
            }
        } else {
            let trades = await this.knex('trade_ads').select('id', 'is_running').where({
                'is_running': request.isRunning,
            }).limit(request.limit).andWhere(extraWhereClauseForSearch).offset(request.offset) as { id: number; is_running: 0 | 1 }[]
            let count = await this.knex('trade_ads').count('id as total').where({
                'is_running': request.isRunning,
            })
            resp.total = count[0]['total'] as number;
            trades.forEach(val => {
                tradeIds.push(val.id);
            })
        }

        // get trade information
        for (const id of tradeIds) {
            let info = await this.knex('trade_ads').select('id as tradeAdId', 'is_running as isRunning', 'date', 'userid_one as userId', 'userid_one_primary as offerPrimary', 'userid_two_primary as requestPrimary').where({
                'id': id,
            }).andWhere(extraWhereClauseForSearch)
            if (!info || !info[0]) {
                continue;
            }
            let items = await this.knex('trade_ad_items').select('trade_ad_items.trade_ad_id as tradeAdId', 'trade_ad_items.catalog_id as catalogId', 'trade_ad_items.userinventory_id as userInventoryId', 'trade_ad_items.side', 'catalog.average_price as averagePrice').where({
                'trade_ad_id': id,
            }).innerJoin('catalog', 'catalog.id', 'trade_ad_items.catalog_id') as { tradeAdId: number; catalogId: number; userInventoryId: number; side: 1 | 2; averagePrice: number; }[];
            info[0].requestItems = items.filter(val => {
                return val.side === 2;
            })
            info[0].offerItems = items.filter(val => {
                return val.side === 1;
            })
            resp.data.push(info[0]);
        }

        return resp;
    }

    /**
     * Count the amount of open trade ads by the {userId}
     * @param userId 
     */
    public async countOpenTradeAdsByUser(userId: number): Promise<number> {
        let count = await this.knex('trade_ads').count('id as total').where({
            'is_running': 1,
            'userid_one': userId,
        });
        return count[0]['total'] as number || 0;
    }

    public async createTradeAd(userIdOne: number, offerPrimary: number, requestPrimary: number): Promise<number> {
        const tradeData = await this.knex("trade_ads").insert({
            'userid_one': userIdOne,
            'userid_two': null,
            'is_running': 1,
            'userid_one_primary': offerPrimary,
            'userid_two_primary': requestPrimary,
        });
        if (!tradeData[0]) {
            throw false;
        }
        return tradeData[0] as number;
    }

    /**
     * Add item(s) to a trade ad
     * @param tradeId 
     * @param side 
     * @param items 
     */
    public async addItemsToTrade(tradeId: number, side: model.economy.tradeSides, items: model.tradeAds.TradeOfferItem[] | model.tradeAds.TradeRequestItem[]): Promise<void> {
        // This isn't that good in terms of performance, but it seems to be more stable
        for (const item of items) {
            await this.knex("trade_ad_items").insert({
                'trade_ad_id': tradeId,
                'userinventory_id': item.userInventoryId || null,
                'catalog_id': item.catalogId,
                'side': side,
            });
        }
    }
}
