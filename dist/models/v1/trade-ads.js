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
exports.isEnabled = false;
class MetaDataResponse {
}
__decorate([
    common_1.Required(),
    swagger_1.Description('Are trade ads enabled featureflag'),
    __metadata("design:type", Boolean)
], MetaDataResponse.prototype, "isEnabled", void 0);
exports.MetaDataResponse = MetaDataResponse;
class TradeAdsSearchRequest {
}
exports.TradeAdsSearchRequest = TradeAdsSearchRequest;
class TradeAdItem {
}
exports.TradeAdItem = TradeAdItem;
class MinimalTradeAdEntry {
}
exports.MinimalTradeAdEntry = MinimalTradeAdEntry;
class TradeAdsSearchResponse {
}
exports.TradeAdsSearchResponse = TradeAdsSearchResponse;
class GenericTradeAdItem {
}
__decorate([
    common_1.PropertyType(Number),
    __metadata("design:type", Number)
], GenericTradeAdItem.prototype, "userInventoryId", void 0);
__decorate([
    common_1.PropertyType(Number),
    __metadata("design:type", Number)
], GenericTradeAdItem.prototype, "catalogId", void 0);
__decorate([
    common_1.PropertyType(Number),
    __metadata("design:type", Number)
], GenericTradeAdItem.prototype, "averagePrice", void 0);
exports.GenericTradeAdItem = GenericTradeAdItem;
class CreateTradeAdRequest {
}
__decorate([
    common_1.Required(),
    swagger_1.Description('An array of userInventoryIds that the authenticated user wishes to offer'),
    common_1.PropertyType(GenericTradeAdItem),
    __metadata("design:type", Array)
], CreateTradeAdRequest.prototype, "offerItems", void 0);
__decorate([
    common_1.Required(),
    swagger_1.Description('An array of catalogIds that the userId wants in return for their offer'),
    common_1.PropertyType(GenericTradeAdItem),
    __metadata("design:type", Array)
], CreateTradeAdRequest.prototype, "requestItems", void 0);
__decorate([
    swagger_1.Description('Primary currency in addition to the items that the user wishes to offer'),
    __metadata("design:type", Number)
], CreateTradeAdRequest.prototype, "offerPrimary", void 0);
__decorate([
    swagger_1.Description('Primary currency the authenticated user wishes to obtain'),
    __metadata("design:type", Number)
], CreateTradeAdRequest.prototype, "requestPrimary", void 0);
exports.CreateTradeAdRequest = CreateTradeAdRequest;
class TradeOfferItem {
}
exports.TradeOfferItem = TradeOfferItem;
class TradeRequestItem {
}
exports.TradeRequestItem = TradeRequestItem;

