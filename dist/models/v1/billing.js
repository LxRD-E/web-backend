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
class CurrencyProducts {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], CurrencyProducts.prototype, "currencyProductId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], CurrencyProducts.prototype, "usdPrice", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], CurrencyProducts.prototype, "currencyAmount", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], CurrencyProducts.prototype, "bonusCatalogId", void 0);
exports.CurrencyProducts = CurrencyProducts;
var TransactionType;
(function (TransactionType) {
    TransactionType[TransactionType["Currency"] = 0] = "Currency";
})(TransactionType = exports.TransactionType || (exports.TransactionType = {}));

