import * as economy from './economy';
import {Required} from "@tsed/common";
import {Description} from "@tsed/swagger";
export const isEnabled = true;
export const maxOpenPositions = 100;

export class OpenCurrencyPositionsEntry {
    @Required()
    positionId: number;
    @Required()
    userId: number;
    @Required()
    balance: number;
    @Required()
    currencyType: economy.currencyType;
    @Required()
    rate: number;
    @Required()
    createdAt: string;
    @Required()
    updatedAt: string;
}

export class PositionFundingHistory {
    @Required()
    amount: number;
    @Required()
    userId: number;
    @Required()
    createdAt: string;
}

export class HistoricalExchangeRecord {
    @Required()
    @Description('Amount that was purchased')
    amountPurchased: number;
    @Required()
    @Description('Amount that was sold')
    amountSold: number;
    @Required()
    createdAt: string;
    @Required()
    rate: number;
    @Required()
    buyerUserId: number;
    @Required()
    sellerUserId: number;
}

export class CurrencyPositionCreateSuccess {
    @Required()
    positionId: number;
}