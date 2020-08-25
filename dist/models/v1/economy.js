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
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@tsed/common");
const swagger_1 = require("@tsed/swagger");
exports.RESELL_ITEM_FEE = 30;
exports.SELL_ITEM_FEE = 30;
exports.trade = {
    maxItemsPerSide: 10,
    maxRequestPrimary: 1000000,
    maxOfferPrimary: 1000000,
    isEnabled: true,
};
class FeeMetaData {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], FeeMetaData.prototype, "fee", void 0);
exports.FeeMetaData = FeeMetaData;
exports.MINIMUM_CURRENCY_CONVERSION_PRIMARY_TO_SECONDARY = 1;
exports.MINIMUM_CURRENCY_CONVERSION_SECONDARY_TO_PRIMARY = 10;
exports.CONVERSION_ONE_PRIMARY_TO_SECONDARY_RATE = 10;
exports.CONVERSION_ONE_SECONDARY_TO_PRIMARY_RATE = 0.1;
exports.CONVERSION_SECONDARY_TO_PRIMARY_MAX = 100000;
exports.CONVERSION_PRIMARY_TO_SECONDARY_MAX = 100000;
class CurrencyConversionMetadataPerCurrency {
}
__decorate([
    common_1.Required(),
    swagger_1.Description('Minimum amount of currency that can be converted at once'),
    __metadata("design:type", Number)
], CurrencyConversionMetadataPerCurrency.prototype, "minimumAmount", void 0);
__decorate([
    common_1.Required(),
    swagger_1.Description('The maximum amount of currency that can be converted at once'),
    __metadata("design:type", Number)
], CurrencyConversionMetadataPerCurrency.prototype, "maxAmount", void 0);
__decorate([
    common_1.Required(),
    swagger_1.Description('The current rate of one currency to the other currency'),
    __metadata("design:type", Number)
], CurrencyConversionMetadataPerCurrency.prototype, "rate", void 0);
class CurrencyConversionMetadata {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Boolean)
], CurrencyConversionMetadata.prototype, "isEnabled", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", CurrencyConversionMetadataPerCurrency)
], CurrencyConversionMetadata.prototype, "primaryToSecondary", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", CurrencyConversionMetadataPerCurrency)
], CurrencyConversionMetadata.prototype, "secondaryToPrimary", void 0);
exports.CurrencyConversionMetadata = CurrencyConversionMetadata;
class userTransactions {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], userTransactions.prototype, "transactionId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], userTransactions.prototype, "userId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], userTransactions.prototype, "amount", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], userTransactions.prototype, "currency", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], userTransactions.prototype, "date", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], userTransactions.prototype, "transactionType", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], userTransactions.prototype, "description", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], userTransactions.prototype, "catalogId", void 0);
__decorate([
    common_1.PropertyType(Number),
    __metadata("design:type", Object)
], userTransactions.prototype, "userInventoryId", void 0);
exports.userTransactions = userTransactions;
class GroupTransactions extends userTransactions {
}
exports.GroupTransactions = GroupTransactions;
class TradeInfo {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], TradeInfo.prototype, "tradeId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], TradeInfo.prototype, "userId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], TradeInfo.prototype, "date", void 0);
exports.TradeInfo = TradeInfo;
class TradeItems {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], TradeItems.prototype, "tradeId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], TradeItems.prototype, "userInventoryId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], TradeItems.prototype, "catalogId", void 0);
__decorate([
    common_1.Required(),
    common_1.AllowTypes('number', 'null'),
    __metadata("design:type", Object)
], TradeItems.prototype, "serial", void 0);
__decorate([
    common_1.Required(),
    swagger_1.Description('Average sales price of the item'),
    __metadata("design:type", Number)
], TradeItems.prototype, "averageSalesPrice", void 0);
exports.TradeItems = TradeItems;
var currencyType;
(function (currencyType) {
    currencyType[currencyType["primary"] = 1] = "primary";
    currencyType[currencyType["secondary"] = 2] = "secondary";
})(currencyType = exports.currencyType || (exports.currencyType = {}));
var transactionType;
(function (transactionType) {
    transactionType[transactionType["DailyStipendPrimary"] = 1] = "DailyStipendPrimary";
    transactionType[transactionType["DailyStipendSecondary"] = 2] = "DailyStipendSecondary";
    transactionType[transactionType["PurchaseOfItem"] = 3] = "PurchaseOfItem";
    transactionType[transactionType["Trade"] = 4] = "Trade";
    transactionType[transactionType["SaleOfItem"] = 5] = "SaleOfItem";
    transactionType[transactionType["CurrencyConversionOfPrimaryToSecondary"] = 6] = "CurrencyConversionOfPrimaryToSecondary";
    transactionType[transactionType["CurrencyConversionOfSecondaryToPrimary"] = 7] = "CurrencyConversionOfSecondaryToPrimary";
    transactionType[transactionType["PurchaseOfGroup"] = 8] = "PurchaseOfGroup";
    transactionType[transactionType["Refund"] = 9] = "Refund";
    transactionType[transactionType["CSDonation"] = 10] = "CSDonation";
    transactionType[transactionType["RealWorldPurchaseOfCurrency"] = 11] = "RealWorldPurchaseOfCurrency";
    transactionType[transactionType["SpendGroupFunds"] = 12] = "SpendGroupFunds";
    transactionType[transactionType["UsernameChange"] = 13] = "UsernameChange";
    transactionType[transactionType["CurrencyPurchaseBonusItemRecieved"] = 14] = "CurrencyPurchaseBonusItemRecieved";
    transactionType[transactionType["CurrencyPurchaseBonusItemRefund"] = 15] = "CurrencyPurchaseBonusItemRefund";
    transactionType[transactionType["PurchaseOfAdvertisment"] = 16] = "PurchaseOfAdvertisment";
    transactionType[transactionType["PurchaseOfCurrencyExchangePosition"] = 17] = "PurchaseOfCurrencyExchangePosition";
    transactionType[transactionType["CurrencyExchangeTransactionPurchase"] = 18] = "CurrencyExchangeTransactionPurchase";
    transactionType[transactionType["CurrencyExchangeTransactionSale"] = 19] = "CurrencyExchangeTransactionSale";
    transactionType[transactionType["CurrencyExchangePositionClose"] = 20] = "CurrencyExchangePositionClose";
    transactionType[transactionType["ReferralUserCurrencyPurchase"] = 21] = "ReferralUserCurrencyPurchase";
})(transactionType = exports.transactionType || (exports.transactionType = {}));
var membershipType;
(function (membershipType) {
    membershipType[membershipType["NoMembership"] = 0] = "NoMembership";
    membershipType[membershipType["Membership"] = 1] = "Membership";
})(membershipType = exports.membershipType || (exports.membershipType = {}));
var tradeSides;
(function (tradeSides) {
    tradeSides[tradeSides["Requester"] = 1] = "Requester";
    tradeSides[tradeSides["Requested"] = 2] = "Requested";
})(tradeSides = exports.tradeSides || (exports.tradeSides = {}));
var tradeType;
(function (tradeType) {
    tradeType[tradeType["outbound"] = 0] = "outbound";
    tradeType[tradeType["inbound"] = 0] = "inbound";
    tradeType[tradeType["completed"] = 1] = "completed";
    tradeType[tradeType["inactive"] = 2] = "inactive";
})(tradeType = exports.tradeType || (exports.tradeType = {}));
var tradeStatus;
(function (tradeStatus) {
    tradeStatus[tradeStatus["Pending"] = 0] = "Pending";
    tradeStatus[tradeStatus["Accepted"] = 1] = "Accepted";
    tradeStatus[tradeStatus["Declined"] = 2] = "Declined";
})(tradeStatus = exports.tradeStatus || (exports.tradeStatus = {}));
var userBalanceErrors;
(function (userBalanceErrors) {
    userBalanceErrors[userBalanceErrors["InvalidUserId"] = 0] = "InvalidUserId";
    userBalanceErrors[userBalanceErrors["NotEnoughCurrency"] = 1] = "NotEnoughCurrency";
    userBalanceErrors[userBalanceErrors["InvalidCurrencyType"] = 2] = "InvalidCurrencyType";
})(userBalanceErrors = exports.userBalanceErrors || (exports.userBalanceErrors = {}));
class TradeItemsResponse {
}
__decorate([
    common_1.Required(),
    common_1.PropertyType(TradeItems),
    __metadata("design:type", Array)
], TradeItemsResponse.prototype, "requested", void 0);
__decorate([
    common_1.Required(),
    common_1.PropertyType(TradeItems),
    __metadata("design:type", Array)
], TradeItemsResponse.prototype, "offer", void 0);
exports.TradeItemsResponse = TradeItemsResponse;

