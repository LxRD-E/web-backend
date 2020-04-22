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
const economy = require("./economy");
const common_1 = require("@tsed/common");
const swagger_1 = require("@tsed/swagger");
exports.isEnabled = true;
exports.maxOpenPositions = 100;
class OpenCurrencyPositionsEntry {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], OpenCurrencyPositionsEntry.prototype, "positionId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], OpenCurrencyPositionsEntry.prototype, "userId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], OpenCurrencyPositionsEntry.prototype, "balance", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], OpenCurrencyPositionsEntry.prototype, "currencyType", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], OpenCurrencyPositionsEntry.prototype, "rate", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], OpenCurrencyPositionsEntry.prototype, "createdAt", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], OpenCurrencyPositionsEntry.prototype, "updatedAt", void 0);
exports.OpenCurrencyPositionsEntry = OpenCurrencyPositionsEntry;
class PositionFundingHistory {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], PositionFundingHistory.prototype, "amount", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], PositionFundingHistory.prototype, "userId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], PositionFundingHistory.prototype, "createdAt", void 0);
exports.PositionFundingHistory = PositionFundingHistory;
class HistoricalExchangeRecord {
}
__decorate([
    common_1.Required(),
    swagger_1.Description('Amount that was purchased'),
    __metadata("design:type", Number)
], HistoricalExchangeRecord.prototype, "amountPurchased", void 0);
__decorate([
    common_1.Required(),
    swagger_1.Description('Amount that was sold'),
    __metadata("design:type", Number)
], HistoricalExchangeRecord.prototype, "amountSold", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], HistoricalExchangeRecord.prototype, "createdAt", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], HistoricalExchangeRecord.prototype, "rate", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], HistoricalExchangeRecord.prototype, "buyerUserId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], HistoricalExchangeRecord.prototype, "sellerUserId", void 0);
exports.HistoricalExchangeRecord = HistoricalExchangeRecord;
class CurrencyPositionCreateSuccess {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], CurrencyPositionCreateSuccess.prototype, "positionId", void 0);
exports.CurrencyPositionCreateSuccess = CurrencyPositionCreateSuccess;

