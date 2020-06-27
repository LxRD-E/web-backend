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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const model = require("../../models/models");
const middleware = require("../../middleware/middleware");
const auth_1 = require("../../dal/auth");
const Auth_1 = require("../../middleware/Auth");
const controller_1 = require("../controller");
const common_1 = require("@tsed/common");
const swagger_1 = require("@tsed/swagger");
let CurrencyExchangeController = class CurrencyExchangeController extends controller_1.default {
    constructor() {
        super();
    }
    metadata() {
        return {
            isEnabled: model.currencyExchange.isEnabled,
            maximumOpenPositions: model.currencyExchange.maxOpenPositions,
        };
    }
    async getPositionsByCurrencyType(currencyTypeId, limit = 100, offset = 0) {
        if (!model.economy.currencyType[currencyTypeId]) {
            throw new this.BadRequest('InvalidCurrency');
        }
        return await this.currencyExchange.getOpenPositionsByCurrency(currencyTypeId, limit, offset);
    }
    async getPositions(userId, limit = 100, offset = 0) {
        return await this.currencyExchange.getOpenPositionsByUserId(userId, limit, offset);
    }
    async createPosition(userInfo, balance, currency, rate) {
        if (!model.economy.currencyType[currency]) {
            throw new this.BadRequest('InvalidCurrency');
        }
        if (rate > 100) {
            throw new this.BadRequest('RateTooLarge');
        }
        if (rate < 0.05) {
            throw new this.BadRequest('RateTooSmall');
        }
        if (balance < 10) {
            throw new this.BadRequest('BalanceTooSmall');
        }
        if (!Number.isInteger(balance)) {
            throw new this.BadRequest('InvalidBalance');
        }
        let positionId;
        const forUpdate = [
            'users',
            'currency_exchange_position',
            'currency_exchange_fund',
        ];
        return await this.transaction(this, forUpdate, async function (trx) {
            let allPositions = await trx.currencyExchange.getOpenPositionsByUserId(userInfo.userId, 100, 0);
            if (allPositions.length >= 100) {
                throw new this.Conflict('ReachedMaximumOpenPositions');
            }
            try {
                await trx.economy.subtractFromUserBalance(userInfo.userId, balance, currency);
            }
            catch (e) {
                if (typeof e === 'number')
                    throw new trx.BadRequest(model.economy.userBalanceErrors[e]);
                throw e;
            }
            rate = Math.trunc(rate * 100) / 100;
            positionId = await trx.currencyExchange.createPosition(userInfo.userId, balance, currency, rate);
            await trx.currencyExchange.recordPositionFunding(positionId, balance);
            await trx.economy.createTransaction(userInfo.userId, 1, -balance, currency, model.economy.transactionType.PurchaseOfCurrencyExchangePosition, 'Purchase of Currency Exchange Position', model.catalog.creatorType.User, model.catalog.creatorType.User);
            return {
                positionId: positionId,
            };
        });
    }
    async historicalCharts(currencyType) {
        if (!model.economy.currencyType[currencyType]) {
            throw new this.BadRequest('InvalidCurrency');
        }
        return await this.currencyExchange.getHistoricalExchangeRecords(currencyType);
    }
    async getPositionById(positionId) {
        return await this.currencyExchange.getPositionById(positionId);
    }
    async purchasePosition(userInfo, positionId, amount) {
        const forUpdate = [
            'users',
            'currency_exchange_position',
            'currency_exchange_record',
        ];
        let exitDueToUserBeingTerminated = false;
        await this.transaction(this, forUpdate, async function (trx) {
            let data = await trx.currencyExchange.getPositionById(positionId);
            if (data.userId === userInfo.userId) {
                throw new this.Conflict('CannotPurchaseOwnedPosition');
            }
            if (data.balance < amount) {
                throw new this.Conflict('NotEnoughInPositionBalance');
            }
            let userBalance = await trx.user.getInfo(userInfo.userId, ['primaryBalance', 'secondaryBalance']);
            let totalUserIsPaying = data.rate * amount;
            if (totalUserIsPaying < 1) {
                throw new this.Conflict('PurchaseAmountTooLow');
            }
            if (!Number.isInteger(totalUserIsPaying)) {
                throw new this.Conflict('InvalidPurchaseAmount');
            }
            if (!Number.isInteger(amount)) {
                throw new this.Conflict('InvalidPurchaseAmount');
            }
            let sellerData = await trx.user.getInfo(data.userId, ['accountStatus']);
            if (sellerData.accountStatus !== model.user.accountStatus.ok) {
                await trx.currencyExchange.subtractFromPositionBalance(data.positionId, data.balance);
                await trx.economy.addToUserBalanceV2(data.userId, data.balance, data.currencyType);
                await trx.currencyExchange.recordPositionFunding(data.positionId, -data.balance);
                await trx.economy.createTransaction(data.userId, data.userId, data.balance, data.currencyType, model.economy.transactionType.CurrencyExchangePositionClose, 'Currency Exchange Position Closure', model.catalog.creatorType.User, model.catalog.creatorType.User);
                exitDueToUserBeingTerminated = true;
            }
            if (exitDueToUserBeingTerminated) {
                return;
            }
            let totalUserIsGetting = amount;
            let userIsGiving;
            let userIsGetting;
            if (data.currencyType === model.economy.currencyType.primary) {
                userIsGiving = model.economy.currencyType.secondary;
                userIsGetting = model.economy.currencyType.primary;
            }
            else if (data.currencyType === model.economy.currencyType.secondary) {
                userIsGiving = model.economy.currencyType.primary;
                userIsGetting = model.economy.currencyType.secondary;
            }
            else {
                throw new Error('InvalidType');
            }
            if (userIsGiving === model.economy.currencyType.primary) {
                if (userBalance.primaryBalance < totalUserIsPaying) {
                    throw new this.Conflict('NotEnoughCurrency');
                }
            }
            else if (userIsGiving === model.economy.currencyType.secondary) {
                if (userBalance.secondaryBalance < totalUserIsPaying) {
                    throw new this.Conflict('NotEnoughCurrency');
                }
            }
            console.log('Ok, continuing');
            await trx.currencyExchange.subtractFromPositionBalance(data.positionId, totalUserIsGetting);
            await trx.economy.subtractFromUserBalanceV2(userInfo.userId, totalUserIsPaying, userIsGiving);
            await trx.economy.addToUserBalanceV2(userInfo.userId, totalUserIsGetting, userIsGetting);
            await trx.economy.addToUserBalanceV2(data.userId, totalUserIsPaying, userIsGiving);
            await trx.currencyExchange.recordCurrencyExchange(data.positionId, userInfo.userId, totalUserIsGetting, totalUserIsPaying);
            await trx.economy.createTransaction(userInfo.userId, data.userId, -totalUserIsPaying, userIsGiving, model.economy.transactionType.CurrencyExchangeTransactionPurchase, 'Purchase of Currency on Exchange', model.catalog.creatorType.User, model.catalog.creatorType.User);
            await trx.economy.createTransaction(userInfo.userId, data.userId, totalUserIsGetting, userIsGetting, model.economy.transactionType.CurrencyExchangeTransactionPurchase, 'Purchase of Currency on Exchange', model.catalog.creatorType.User, model.catalog.creatorType.User);
            await trx.economy.createTransaction(data.userId, userInfo.userId, totalUserIsPaying, userIsGiving, model.economy.transactionType.CurrencyExchangeTransactionSale, 'Sale of Currency on Exchange', model.catalog.creatorType.User, model.catalog.creatorType.User);
        });
        if (exitDueToUserBeingTerminated) {
            throw new this.Conflict('PositionNoLongerAvailable');
        }
        return {};
    }
    async getPositionFundingHistoryById(positionId) {
        return await this.currencyExchange.getPositionFunding(positionId);
    }
    async closePosition(userInfo, positionId) {
        const forUpdate = [
            'users',
            'currency_exchange_fund',
            'currency_exchange_position',
        ];
        await this.transaction(this, forUpdate, async function (trx) {
            let data = await trx.currencyExchange.getPositionById(positionId);
            if (data.userId !== userInfo.userId) {
                throw new this.Conflict('UserIsNotOwnerOfPosition');
            }
            if (data.balance === 0) {
                throw new this.Conflict('PositionAlreadyClosed');
            }
            await trx.currencyExchange.recordPositionFunding(positionId, -data.balance);
            await trx.currencyExchange.subtractFromPositionBalance(positionId, data.balance);
            await trx.economy.addToUserBalanceV2(userInfo.userId, data.balance, data.currencyType);
            await trx.economy.createTransaction(userInfo.userId, userInfo.userId, data.balance, data.currencyType, model.economy.transactionType.CurrencyExchangePositionClose, 'Currency Exchange Position Closure', model.catalog.creatorType.User, model.catalog.creatorType.User);
        });
        return {};
    }
};
__decorate([
    common_1.Get('/metadata'),
    swagger_1.Summary('P2P Currency Exchange metadata'),
    common_1.Use(Auth_1.YesAuth),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CurrencyExchangeController.prototype, "metadata", null);
__decorate([
    common_1.Get('/positions/currency-type/:currencyTypeId'),
    swagger_1.Summary('Get active positions by currencyTypeId, sorted by lowest rate'),
    common_1.Use(Auth_1.YesAuth, middleware.ValidatePaging),
    swagger_1.ReturnsArray(200, { type: model.currencyExchange.OpenCurrencyPositionsEntry }),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidCurrency: Currency type is invalid\n' }),
    __param(0, common_1.PathParams('currencyTypeId', Number)),
    __param(1, common_1.QueryParams('limit', Number)),
    __param(2, common_1.QueryParams('offset', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", Promise)
], CurrencyExchangeController.prototype, "getPositionsByCurrencyType", null);
__decorate([
    common_1.Get('/positions/users/:userId'),
    swagger_1.Summary('Get the active currency positions for the specified {userId}'),
    common_1.Use(Auth_1.YesAuth, middleware.user.ValidateUserId, middleware.ValidatePaging),
    swagger_1.ReturnsArray(200, { type: model.currencyExchange.OpenCurrencyPositionsEntry }),
    __param(0, common_1.PathParams('userId', Number)),
    __param(1, common_1.QueryParams('limit', Number)),
    __param(2, common_1.QueryParams('offset', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", Promise)
], CurrencyExchangeController.prototype, "getPositions", null);
__decorate([
    common_1.Post('/positions/create'),
    swagger_1.Summary('Create a position'),
    common_1.Use(Auth_1.YesAuth, auth_1.csrf),
    swagger_1.Returns(200, { type: model.currencyExchange.CurrencyPositionCreateSuccess }),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidCurrency: Currency is invalid\nRateTooLarge: Rate is too large\nRateTooSmall: Rate is too small\nBalanceTooSmall: Balance is too small\nInvalidBalance: Balance is invalid\n' }),
    swagger_1.Returns(409, { type: model.Error, description: 'ReachedMaximumOpenPositions: You cannot create any positions since you have reached the max\n' }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, swagger_1.Description('Balance to sell')),
    __param(1, common_1.BodyParams('balance', Number)),
    __param(2, common_1.Required()),
    __param(2, swagger_1.Description('Currency to sell')),
    __param(2, common_1.BodyParams('currency', Number)),
    __param(3, common_1.Required()),
    __param(3, swagger_1.Description('Rate to sell at. Maximum of 2 decimal places (other decimals will be chopped off)')),
    __param(3, common_1.BodyParams('rate', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession, Number, Number, Number]),
    __metadata("design:returntype", Promise)
], CurrencyExchangeController.prototype, "createPosition", null);
__decorate([
    common_1.Get('/positions/charts/:currencyType'),
    swagger_1.Summary('Get historical exchange charts'),
    common_1.Use(Auth_1.YesAuth),
    swagger_1.ReturnsArray(200, { type: model.currencyExchange.HistoricalExchangeRecord }),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidCurrency: Currency is not valid\n' }),
    __param(0, common_1.PathParams('currencyType', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CurrencyExchangeController.prototype, "historicalCharts", null);
__decorate([
    common_1.Get('/positions/:positionId'),
    swagger_1.Summary('Get a position by the {positionId}'),
    common_1.Use(Auth_1.YesAuth),
    __param(0, common_1.PathParams('positionId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CurrencyExchangeController.prototype, "getPositionById", null);
__decorate([
    common_1.Post('/positions/:positionId/purchase'),
    swagger_1.Summary('Purchase all (or part) of a position'),
    swagger_1.Returns(409, { type: model.Error, description: 'NotEnoughInPositionBalance: The amount exceeds the positions balance\nPurchaseAmountTooLow: Purchase amount is too low (varies based off rate. rate multiplied by amount should be more than 0 and a valid integer)\nInvalidPurchaseAmount: Purchase amount is invalid\nNotEnoughCurrency: User cannot afford this purchase\nCannotPurchaseOwnedPosition: You cannot purchase your own position\nPositionNoLongerAvailable: Position is no longer available\n' }),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, swagger_1.Description('The positionId to purchase')),
    __param(1, common_1.PathParams('positionId', Number)),
    __param(2, common_1.Required()),
    __param(2, swagger_1.Description('The amount of the {positionId} to purchase')),
    __param(2, common_1.BodyParams('amount', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession, Number, Number]),
    __metadata("design:returntype", Promise)
], CurrencyExchangeController.prototype, "purchasePosition", null);
__decorate([
    common_1.Get('/positions/:positionId/funding'),
    swagger_1.Summary('Get the funding history of the {positionId}'),
    common_1.Use(Auth_1.YesAuth),
    swagger_1.ReturnsArray(200, { type: model.currencyExchange.PositionFundingHistory }),
    __param(0, common_1.PathParams('positionId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CurrencyExchangeController.prototype, "getPositionFundingHistoryById", null);
__decorate([
    common_1.Delete('/positions/:positionId'),
    swagger_1.Summary('Close a position and return balance to owner'),
    common_1.Use(Auth_1.YesAuth, auth_1.csrf),
    swagger_1.Returns(409, { type: model.Error, description: 'UserIsNotOwnerOfPosition: User is unauthorized\nPositionAlreadyClosed: Position is already clsoed\n' }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('positionId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession, Number]),
    __metadata("design:returntype", Promise)
], CurrencyExchangeController.prototype, "closePosition", null);
CurrencyExchangeController = __decorate([
    common_1.Controller('/currency-exchange'),
    swagger_1.Description('P2P Currency Exchange'),
    __metadata("design:paramtypes", [])
], CurrencyExchangeController);
exports.default = CurrencyExchangeController;

