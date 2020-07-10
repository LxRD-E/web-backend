import { Required, PropertyType, AllowTypes } from "@tsed/common";
import { Description } from "@tsed/swagger";

export const RESELL_ITEM_FEE = 30;
export const SELL_ITEM_FEE = 30;
export const trade = {
    maxItemsPerSide: 10,
    maxRequestPrimary: 1000000,
    maxOfferPrimary: 1000000,
    isEnabled: true,
}

export class FeeMetaData {
    @Required()
    fee: number;
}

export const MINIMUM_CURRENCY_CONVERSION_PRIMARY_TO_SECONDARY = 1;
export const MINIMUM_CURRENCY_CONVERSION_SECONDARY_TO_PRIMARY = 10;

export const CONVERSION_ONE_PRIMARY_TO_SECONDARY_RATE = 10;
export const CONVERSION_ONE_SECONDARY_TO_PRIMARY_RATE = 0.1;

export const CONVERSION_SECONDARY_TO_PRIMARY_MAX = 100000;
export const CONVERSION_PRIMARY_TO_SECONDARY_MAX = 100000;

class CurrencyConversionMetadataPerCurrency {
    @Required()
    @Description('Minimum amount of currency that can be converted at once')
    minimumAmount: number;

    @Required()
    @Description('The maximum amount of currency that can be converted at once')
    maxAmount: number;
    @Required()
    @Description('The current rate of one currency to the other currency')
    rate: number;
}

export class CurrencyConversionMetadata {
    @Required()
    isEnabled: boolean;
    @Required()
    primaryToSecondary: CurrencyConversionMetadataPerCurrency;
    @Required()
    secondaryToPrimary: CurrencyConversionMetadataPerCurrency;
}

/**
 * Transactions Interface
 */
export class userTransactions {
    /**
     * Unique Transaction ID
     */
    @Required()
    transactionId: number;
    /**
     * The Other User ID Involved with the Transaction
     */
    @Required()
    userId: number;
    @Required()
    amount: number;
    @Required()
    currency: currencyType;
    @Required()
    date: string;
    @Required()
    transactionType: transactionType;
    /**
     * Short human-readible string describing the transaction
     */
    @Required()
    description: string;
    /**
     * Catalog ID involved with the Transaction, if applicable
     */
    @Required()
    catalogId: number;
    /**
     * User Inventory ID Inolved with the Transaction, if applicable
     */
    @PropertyType(Number)
    userInventoryId: number|null;
}

export class GroupTransactions extends userTransactions {
}

export class TradeInfo {
    @Required()
    tradeId: number;
    /**
     * Partner's ID
     */
    @Required()
    userId: number;
    @Required()
    date: string;
}

export interface ExtendedTradeInfo {
    tradeId: number;
    userIdOne: number;
    userIdTwo: number;
    date: string;
    status: tradeStatus;
    userIdOnePrimary: number;
    userIdTwoPrimary: number;
}

export class TradeItems {
    @Required()
    tradeId: number;
    @Required()
    userInventoryId: number;
    @Required()
    catalogId: number;
    @Required()
    @AllowTypes('number','null')
    serial: number|null;
    @Required()
    @Description('Average sales price of the item')
    averageSalesPrice: number;
}

/**
 * Currencies
 */
export enum currencyType {
    'primary' = 1,
    'secondary' = 2,
}

/**
 * Types of Transactions
 */
export enum transactionType {
    /**
     * Daily Stipend of Primary Currency (membership users)
     */
    'DailyStipendPrimary' = 1,
    /**
     * Daily Stipend of Secondary Currency
     */
    'DailyStipendSecondary',
    /**
     * Purchased an in-game item, such as a collectible or shirt
     */
    'PurchaseOfItem',
    /**
     * Earned through Trade System
     */
    'Trade',
    /**
     * Sold an item, such as a shirt or collectible item
     */
    'SaleOfItem',
    /**
     * Converted Primary to Secondary
     */
    'CurrencyConversionOfPrimaryToSecondary',
    /**
     * Converted Secondary to Primary
     */
    'CurrencyConversionOfSecondaryToPrimary',
    /**
     * Purchased a Group
     */
    'PurchaseOfGroup',
    /**
     * Recieved an automatic refund
     */
    'Refund',
    /**
     * Donation from Customer Service
     */
    'CSDonation',
    /**
     * Purchased Currency via PayPal/Stripe
     */
    'RealWorldPurchaseOfCurrency',
    /**
     * Spend Group Funds
     */
    'SpendGroupFunds',
    /**
     * Username Change
     */
    'UsernameChange',
    /**
     * Bonus Item Recieved when purchasing currency
     */
    'CurrencyPurchaseBonusItemRecieved',
    /**
     * Refund due to item not being available or user already owning item. Refund is half the sale price
     */
    'CurrencyPurchaseBonusItemRefund',
    /**
     * Purchase of advertisment
     */
    'PurchaseOfAdvertisment',
    /**
     * Purchase of currency exchange position
     */
    'PurchaseOfCurrencyExchangePosition',
    /**
     * Purchase of p2p currency exchange transaction
     */
    'CurrencyExchangeTransactionPurchase',
    /**
     * Sale of p2p currency exchange transaction
     */
    'CurrencyExchangeTransactionSale',
    /**
     * Transfer for currency exchange
     */
    'CurrencyExchangePositionClose',
    'ReferralUserCurrencyPurchase',
}
export interface TradeItemObject {
    catalogId: number;
    userInventoryId: number;
}
/**
 * Membership Types
 */
export enum membershipType {
    'NoMembership' = 0,
    'Membership'
}
/**
 * Sides to a Trade
 */
export enum tradeSides {
    'Requester' = 1,
    'Requested'
}
/**
 * Types of Trades
 */
export enum tradeType {
    'outbound' = 0,
    'inbound' = 0,
    'completed' = 1,
    'inactive' = 2,
}
/**
 * Status of a Trade
 */
export enum tradeStatus {
    'Pending' = 0,
    'Accepted',
    'Declined',
}

export enum userBalanceErrors {
    'InvalidUserId' = 0,
    'NotEnoughCurrency',
    'InvalidCurrencyType',
}

export class TradeItemsResponse {
    @Required()
    @PropertyType(TradeItems)
    'requested': TradeItems[];
    @Required()
    @PropertyType(TradeItems)
    'offer': TradeItems[];
}