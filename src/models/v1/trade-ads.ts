import { PropertyType, Required } from "@tsed/common";
import { Description } from "@tsed/swagger";

export const isEnabled = false;

export class MetaDataResponse {
    @Required()
    @Description('Are trade ads enabled featureflag')
    public isEnabled: boolean;
}

export class TradeAdsSearchRequest {
    allowedRequestedCatalogIds?: number[];
    isRunning: 0 | 1;
    orderByColumn?: string;
    orderBy?: 'asc' | 'desc';
    limit: number;
    offset: number;
    userId?: number;
}

export class TradeAdItem {
    tradeAdId: number;
    userInventoryId: number | null;
    catalogId: number;
    side: 1 | 2;
}

export class MinimalTradeAdEntry {
    tradeAdId: number;
    userId: number;
    date: string;
    isRunning: 0 | 1;
    primaryOffer: number;
    primaryRequest: number;
    requestItems: TradeAdItem[];
    offerItems: TradeAdItem[];
}

export class TradeAdsSearchResponse {
    total: number;
    data: any[];
}

export class GenericTradeAdItem {
    @PropertyType(Number)
    userInventoryId: number;
    @PropertyType(Number)
    catalogId: number;
    @PropertyType(Number)
    averagePrice: number;
}

export class CreateTradeAdRequest {
    @Required()
    @Description('An array of userInventoryIds that the authenticated user wishes to offer')
    @PropertyType(GenericTradeAdItem)
    offerItems: GenericTradeAdItem[];
    @Required()
    @Description('An array of catalogIds that the userId wants in return for their offer')
    @PropertyType(GenericTradeAdItem)
    requestItems: GenericTradeAdItem[];
    @Description('Primary currency in addition to the items that the user wishes to offer')
    offerPrimary?: number;
    @Description('Primary currency the authenticated user wishes to obtain')
    requestPrimary?: number;
}

export class TradeOfferItem {
    catalogId: number;
    userInventoryId: number;
}

export class TradeRequestItem {
    catalogId: number;
    userInventoryId: undefined;
}