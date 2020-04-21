"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@tsed/common");
const swagger_1 = require("@tsed/swagger");
const controller_1 = require("../controller");
const Auth_1 = require("../../middleware/Auth");
let WWWEconomyController = class WWWEconomyController extends controller_1.default {
    transactions() {
        return new this.WWWTemplate({
            title: 'Transactions',
        });
    }
    trades() {
        return new this.WWWTemplate({
            title: 'Trades',
        });
    }
};
__decorate([
    common_1.Get('/transactions'),
    swagger_1.Summary('Get user transaction history'),
    common_1.Render('transactions'),
    common_1.UseBefore(Auth_1.YesAuth),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WWWEconomyController.prototype, "transactions", null);
__decorate([
    common_1.Get('/trades'),
    swagger_1.Summary('Get list of user trades'),
    common_1.Render('trades'),
    common_1.UseBefore(Auth_1.YesAuth),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WWWEconomyController.prototype, "trades", null);
WWWEconomyController = __decorate([
    common_1.Controller('/')
], WWWEconomyController);
exports.WWWEconomyController = WWWEconomyController;
//# sourceMappingURL=economy.js.map