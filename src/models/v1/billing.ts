import { Required } from "@tsed/common";

export class CurrencyProducts {
    @Required()
    currencyProductId: number;
    @Required()
    usdPrice: number;
    @Required()
    currencyAmount: number;
    @Required()
    bonusCatalogId: number;
}
export enum TransactionType {
    'Currency' = 0,
}

export interface Transaction {
    usdPrice: number;
}