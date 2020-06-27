// Models
import * as model from '../../models/models';
// Middleware
import * as middleware from '../../middleware/middleware';
// Extra models
import {csrf} from '../../dal/auth';
import {YesAuth} from '../../middleware/Auth';
// Extender
import controller from '../controller';
// Tsed
import {
    BodyParams,
    Controller,
    Delete,
    Get,
    Locals,
    PathParams,
    Post,
    QueryParams,
    Required,
    Use
} from '@tsed/common';
import {Description, Returns, ReturnsArray, Summary} from '@tsed/swagger';

/**
 * P2P Currency Exchange Controller
 */
@Controller('/currency-exchange')
@Description('P2P Currency Exchange')
export default class CurrencyExchangeController extends controller {

    constructor()
    {
        super();
    }

    @Get('/metadata')
    @Summary('P2P Currency Exchange metadata')
    @Use(YesAuth)
    public metadata() {
        return {
            isEnabled: model.currencyExchange.isEnabled,
            maximumOpenPositions: model.currencyExchange.maxOpenPositions,
        };
    }

    @Get('/positions/currency-type/:currencyTypeId')
    @Summary('Get active positions by currencyTypeId, sorted by lowest rate')
    @Use(YesAuth, middleware.ValidatePaging)
    @ReturnsArray(200, {type: model.currencyExchange.OpenCurrencyPositionsEntry})
    @Returns(400, {type: model.Error, description: 'InvalidCurrency: Currency type is invalid\n'})
    public async getPositionsByCurrencyType(
        @PathParams('currencyTypeId', Number) currencyTypeId: number,
        @QueryParams('limit', Number) limit: number = 100,
        @QueryParams('offset', Number) offset: number = 0,
    ) {
        if (!model.economy.currencyType[currencyTypeId]) {
            throw new this.BadRequest('InvalidCurrency');
        }
        return await this.currencyExchange.getOpenPositionsByCurrency(currencyTypeId, limit, offset);
    }

    @Get('/positions/users/:userId')
    @Summary('Get the active currency positions for the specified {userId}')
    @Use(YesAuth, middleware.user.ValidateUserId, middleware.ValidatePaging)
    @ReturnsArray(200, {type: model.currencyExchange.OpenCurrencyPositionsEntry})
    public async getPositions(
        @PathParams('userId', Number) userId: number,
        @QueryParams('limit', Number) limit: number = 100,
        @QueryParams('offset', Number) offset: number = 0,
    ) {
        return await this.currencyExchange.getOpenPositionsByUserId(userId, limit, offset);
    }

    @Post('/positions/create')
    @Summary('Create a position')
    @Use(YesAuth, csrf)
    @Returns(200, {type: model.currencyExchange.CurrencyPositionCreateSuccess})
    @Returns(400, {type: model.Error, description: 'InvalidCurrency: Currency is invalid\nRateTooLarge: Rate is too large\nRateTooSmall: Rate is too small\nBalanceTooSmall: Balance is too small\nInvalidBalance: Balance is invalid\n'})
    @Returns(409, {type: model.Error, description: 'ReachedMaximumOpenPositions: You cannot create any positions since you have reached the max\n'})
    public async createPosition(
        @Locals('userInfo') userInfo: model.UserSession,
        @Required()
        @Description('Balance to sell')
        @BodyParams('balance', Number) balance: number,
        @Required()
        @Description('Currency to sell')
        @BodyParams('currency', Number) currency: number,
        @Required()
        @Description('Rate to sell at. Maximum of 2 decimal places (other decimals will be chopped off)')
        @BodyParams('rate', Number) rate: number,
    ) {
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
        // Now the fun part OwO
        let positionId: number;
        const forUpdate = [
            'users',
            'currency_exchange_position',
            'currency_exchange_fund',
        ];
        return await this.transaction(this, forUpdate,async function (trx) {
            // Check if already created max positions
            let allPositions = await trx.currencyExchange.getOpenPositionsByUserId(userInfo.userId, 100, 0);
            if (allPositions.length >= 100) {
                throw new this.Conflict('ReachedMaximumOpenPositions');
            }
            // update balance
            try {
                await trx.economy.subtractFromUserBalance(userInfo.userId, balance, currency);
            }catch(e) {
                if (typeof e === 'number')
                    throw new trx.BadRequest(model.economy.userBalanceErrors[e]);
                throw e;
            }
            // create position
            rate = Math.trunc(rate * 100) / 100;
            positionId = await trx.currencyExchange.createPosition(userInfo.userId, balance, currency, rate);
            // Record funding
            await trx.currencyExchange.recordPositionFunding(positionId, balance);
            // create transaction for user
            await trx.economy.createTransaction(userInfo.userId, 1, -balance, currency, model.economy.transactionType.PurchaseOfCurrencyExchangePosition, 'Purchase of Currency Exchange Position', model.catalog.creatorType.User, model.catalog.creatorType.User);

            return {
                positionId: positionId,
            };
        });
    }

    @Get('/positions/charts/:currencyType')
    @Summary('Get historical exchange charts')
    @Use(YesAuth)
    @ReturnsArray(200, {type: model.currencyExchange.HistoricalExchangeRecord})
    @Returns(400, {type: model.Error, description: 'InvalidCurrency: Currency is not valid\n'})
    public async historicalCharts(
        @PathParams('currencyType', Number) currencyType: number,
    ) {
        if (!model.economy.currencyType[currencyType]) {
            throw new this.BadRequest('InvalidCurrency');
        }
        return await this.currencyExchange.getHistoricalExchangeRecords(currencyType);
    }

    @Get('/positions/:positionId')
    @Summary('Get a position by the {positionId}')
    @Use(YesAuth)
    public async getPositionById(
        @PathParams('positionId', Number) positionId: number
    ) {
        return await this.currencyExchange.getPositionById(positionId);
    }

    @Post('/positions/:positionId/purchase')
    @Summary('Purchase all (or part) of a position')
    @Returns(409, {type: model.Error, description: 'NotEnoughInPositionBalance: The amount exceeds the positions balance\nPurchaseAmountTooLow: Purchase amount is too low (varies based off rate. rate multiplied by amount should be more than 0 and a valid integer)\nInvalidPurchaseAmount: Purchase amount is invalid\nNotEnoughCurrency: User cannot afford this purchase\nCannotPurchaseOwnedPosition: You cannot purchase your own position\nPositionNoLongerAvailable: Position is no longer available\n'})
    @Use(csrf, YesAuth)
    public async purchasePosition(
        @Locals('userInfo') userInfo: model.UserSession,
        @Required()
        @Description('The positionId to purchase')
        @PathParams('positionId', Number) positionId: number,
        @Required()
        @Description('The amount of the {positionId} to purchase')
        @BodyParams('amount', Number) amount: number,
    ) {
        const forUpdate = [
            'users',
            'currency_exchange_position',
            'currency_exchange_record',
        ];
        let exitDueToUserBeingTerminated = false;
        await this.transaction(this, forUpdate,async function (trx) {
            let data = await trx.currencyExchange.getPositionById(positionId);
            if (data.userId === userInfo.userId) {
                throw new this.Conflict('CannotPurchaseOwnedPosition');
            }
            if (data.balance < amount) {
                throw new this.Conflict('NotEnoughInPositionBalance');
            }
            let userBalance = await trx.user.getInfo(userInfo.userId, ['primaryBalance','secondaryBalance']);

            // If authenticated user is buying primary (with their secondary)
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
            // Grab seller data
            let sellerData = await trx.user.getInfo(data.userId, ['accountStatus']);
            // If seller is not OK
            if (sellerData.accountStatus !== model.user.accountStatus.ok) {
                // Close the position
                await trx.currencyExchange.subtractFromPositionBalance(data.positionId, data.balance);
                // Refund to seller
                await trx.economy.addToUserBalanceV2(data.userId, data.balance, data.currencyType);
                // Record negative funding
                await trx.currencyExchange.recordPositionFunding(data.positionId, -data.balance);
                // Record transaction
                await trx.economy.createTransaction(data.userId, data.userId, data.balance, data.currencyType, model.economy.transactionType.CurrencyExchangePositionClose, 'Currency Exchange Position Closure', model.catalog.creatorType.User, model.catalog.creatorType.User);
                // Throw an error
                exitDueToUserBeingTerminated = true;
            }
            if (exitDueToUserBeingTerminated) {
                return;
            }
            let totalUserIsGetting = amount;
            let userIsGiving: model.economy.currencyType;
            let userIsGetting: model.economy.currencyType;
            if (data.currencyType === model.economy.currencyType.primary) {
                userIsGiving = model.economy.currencyType.secondary;
                userIsGetting = model.economy.currencyType.primary;
            }else if (data.currencyType === model.economy.currencyType.secondary) {
                userIsGiving = model.economy.currencyType.primary;
                userIsGetting = model.economy.currencyType.secondary;
            }else{
                throw new Error('InvalidType');
            }

            if (userIsGiving === model.economy.currencyType.primary) {
                if (userBalance.primaryBalance < totalUserIsPaying) {
                    throw new this.Conflict('NotEnoughCurrency');
                }
            }else if (userIsGiving === model.economy.currencyType.secondary) {
                if (userBalance.secondaryBalance < totalUserIsPaying) {
                    throw new this.Conflict('NotEnoughCurrency');
                }
            }
            console.log('Ok, continuing');
            // Subtract from position balance
            await trx.currencyExchange.subtractFromPositionBalance(data.positionId, totalUserIsGetting);
            // Subtract from user balance
            await trx.economy.subtractFromUserBalanceV2(userInfo.userId, totalUserIsPaying, userIsGiving);
            // Add to user balance
            await trx.economy.addToUserBalanceV2(userInfo.userId, totalUserIsGetting, userIsGetting);
            // Add to position holder balance
            await trx.economy.addToUserBalanceV2(data.userId,  totalUserIsPaying, userIsGiving);
            // Record exchange transaction
            await trx.currencyExchange.recordCurrencyExchange(data.positionId, userInfo.userId, totalUserIsGetting, totalUserIsPaying);
            // Record transactions for both parties
            await trx.economy.createTransaction(userInfo.userId, data.userId, -totalUserIsPaying, userIsGiving, model.economy.transactionType.CurrencyExchangeTransactionPurchase, 'Purchase of Currency on Exchange', model.catalog.creatorType.User, model.catalog.creatorType.User);
            await trx.economy.createTransaction(userInfo.userId, data.userId, totalUserIsGetting, userIsGetting, model.economy.transactionType.CurrencyExchangeTransactionPurchase, 'Purchase of Currency on Exchange', model.catalog.creatorType.User, model.catalog.creatorType.User)
            await trx.economy.createTransaction(data.userId, userInfo.userId, totalUserIsPaying, userIsGiving, model.economy.transactionType.CurrencyExchangeTransactionSale, 'Sale of Currency on Exchange',model.catalog.creatorType.User, model.catalog.creatorType.User);
            // Finished
        });
        if (exitDueToUserBeingTerminated) {
            throw new this.Conflict('PositionNoLongerAvailable');
        }
        return {};
    }

    @Get('/positions/:positionId/funding')
    @Summary('Get the funding history of the {positionId}')
    @Use(YesAuth)
    @ReturnsArray(200, {type: model.currencyExchange.PositionFundingHistory})
    public async getPositionFundingHistoryById(
        @PathParams('positionId', Number) positionId: number
    ) {
        return await this.currencyExchange.getPositionFunding(positionId);
    }

    @Delete('/positions/:positionId')
    @Summary('Close a position and return balance to owner')
    @Use(YesAuth, csrf)
    @Returns(409, {type: model.Error, description: 'UserIsNotOwnerOfPosition: User is unauthorized\nPositionAlreadyClosed: Position is already clsoed\n'})
    public async closePosition(
        @Locals('userInfo') userInfo: model.UserSession,
        @PathParams('positionId', Number) positionId: number,
    ) {
        const forUpdate = [
            'users',
            'currency_exchange_fund',
            'currency_exchange_position',
        ];
        await this.transaction(this, forUpdate,async function (trx) {
            let data = await trx.currencyExchange.getPositionById(positionId);
            if (data.userId !== userInfo.userId) {
                throw new this.Conflict('UserIsNotOwnerOfPosition');
            }
            if (data.balance === 0) {
                throw new this.Conflict('PositionAlreadyClosed');
            }
            // Record negative funding
            await trx.currencyExchange.recordPositionFunding(positionId, -data.balance);
            // Update position balance
            await trx.currencyExchange.subtractFromPositionBalance(positionId, data.balance);
            // Transfer funding to user
            await trx.economy.addToUserBalanceV2(userInfo.userId, data.balance, data.currencyType);
            // Record transaction
            await trx.economy.createTransaction(userInfo.userId, userInfo.userId, data.balance, data.currencyType, model.economy.transactionType.CurrencyExchangePositionClose, 'Currency Exchange Position Closure', model.catalog.creatorType.User, model.catalog.creatorType.User);
            // Return
        });
        return {};
    }
}
