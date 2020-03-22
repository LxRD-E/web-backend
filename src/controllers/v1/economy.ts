/**
 * Imports
 */
// Interfaces
import { filterOffset, filterId } from '../../helpers/Filter';
import * as model from '../../models/models';
import { YesAuth } from '../../middleware/Auth';
import { csrf } from '../../dal/auth';
// Autoload
import controller from '../controller';
import { Controller, Get, QueryParams, PathParams, BodyParams, Post, Patch, Put, Delete, Locals, UseBeforeEach, UseBefore, Required, HeaderParams, Err, Use, Req } from '@tsed/common';
import { Summary, Returns, ReturnsArray, Description } from '@tsed/swagger';
import TwoStepCheck from '../../middleware/TwoStepCheck';
/**
 * Auth Controller
 */
@Controller('/economy')
export default class EconomyController extends controller {
    constructor() {
        super();
    }

    @Get('/metadata/collectible-resale-fee')
    @Summary('Get item resale fee percenatage for collectibles')
    @Returns(200, {type: model.economy.FeeMetaData})
    public getResellFeeCollectible() {
        return {
            fee: model.economy.RESELL_ITEM_FEE,
        };
    }

    @Get('/metadata/sell-fee')
    @Summary('Get item resale fee percenatage for normal items (shirts, pants, etc)')
    @Returns(200, {type: model.economy.FeeMetaData})
    public getSellFee() {
        return {
            fee: model.economy.SELL_ITEM_FEE,
        };
    }

    @Get('/metadata/currency-conversion-rate')
    @Summary('Get currency conversion metadata')
    @Returns(200, {type: model.economy.CurrencyConversionMetadata})
    public getCurrencyConversionMetadata() {
        return {
            primaryToSecondary: {
                minimumAmount: model.economy.MINIMUM_CURRENCY_CONVERSION_PRIMARY_TO_SECONDARY,
                rate: model.economy.CONVERSION_ONE_PRIMARY_TO_SECONDARY_RATE,
                maxAmount: model.economy.CONVERSION_PRIMARY_TO_SECONDARY_MAX,
            },
            secondaryToPrimary: {
                minimumAmount: model.economy.MINIMUM_CURRENCY_CONVERSION_SECONDARY_TO_PRIMARY,
                rate: model.economy.CONVERSION_ONE_SECONDARY_TO_PRIMARY_RATE,
                maxAmount: model.economy.CONVERSION_SECONDARY_TO_PRIMARY_MAX,
            }
        }
    }

    @Get('/trades/:type')
    @Summary('Get user trades')
    @UseBefore(YesAuth)
    @ReturnsArray(200, { type: model.economy.TradeInfo })
    @Returns(400, { type: model.Error, description: 'InvalidTradeType: TradeType must be one of: inbound,outbound,completed,inactive\n' })
    public async getTrades(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('type', String) tradeType: string, 
        @QueryParams('offset', Number) offset: number = 0
    ) {
        let tradeValue;
        if (tradeType !== 'inbound' && tradeType !== 'outbound' && tradeType !== 'completed' && tradeType !== 'inactive') {
            throw new this.BadRequest('InvalidTradeType');
        } else {
            tradeValue = tradeType;
        }
        const trades = await this.economy.getTrades(userInfo.userId, tradeValue, offset);
        return trades;
    }

    /**
     * Regenerate a user's avatar, such as when they sell and item or trade one
     * @param userId The User's ID
     * @param catalogId The Catalog ID(s) the user sold/traded
     */
    private async regenAvatarAfterItemTransferOwners(userId: number, catalogId: number | number[]): Promise<void> {
        // Check if Seller was Wearing Item
        let wearing;
        if (typeof catalogId === "number") {
            wearing = await this.user.wearingItem(userId, catalogId);
        } else {
            for (const id of catalogId) {
                const isWearingCurrentId = await this.user.wearingItem(userId, id);
                if (isWearingCurrentId) {
                    wearing = true;
                }
            }
        }
        if (wearing) {
            // Delete Old Avatar Stuff
            if (typeof catalogId === "number") {
                await this.avatar.deleteAvatarCatalogId(userId, catalogId);
            } else {
                for (const id of catalogId) {
                    await this.avatar.deleteAvatarCatalogId(userId, id);
                }
            }
            // Update Avatar of User
            const avatar = await this.user.getAvatar(userId);
            const avatarColors = await this.user.getAvatarColors(userId);
            // const avatarObject = await this.AvatarModel.generateAvatarFromModels(numericUserId, avatarColors, avatar);
            // Generate Avatar
            const catalogIds = [];
            for (const asset of avatar) {
                catalogIds.push(asset.catalogId);
            }
            const headrgb = [
                avatarColors[0].headr,
                avatarColors[0].headg,
                avatarColors[0].headb,
            ];
            const legrgb = [
                avatarColors[0].legr,
                avatarColors[0].legg,
                avatarColors[0].legb,
            ];
            const torsorgb = [
                avatarColors[0].torsor,
                avatarColors[0].torsog,
                avatarColors[0].torsob,
            ];
            const avatarObject = await this.catalog.generateAvatarJsonFromCatalogIds(userId, catalogIds, legrgb, headrgb, torsorgb);
            const URL = await this.avatar.renderAvatar('avatar', avatarObject);
            await this.user.addUserThumbnail(userId, URL);
        }
    }

    @Get('/transactions')
    @Summary('Get transaction history for the authenticated user')
    @UseBefore(YesAuth)
    @ReturnsArray(200, {type: model.economy.userTransactions})
    public async getTransactions(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @QueryParams('offset', Number) offset: number = 0
    ): Promise<model.economy.userTransactions[]> {
        const transactions = await this.economy.getUserTransactions(userInfo.userId, offset);
        return transactions;
    }

    @Get('/group/:groupId/transactions')
    @Summary('Get transaction history for the group. User must have manage permission')
    @UseBefore(YesAuth)
    @ReturnsArray(200, {type: model.economy.GroupTransactions})
    @Returns(400, {type: model.Error, description: 'InvalidGroupId: GroupID is not valid\n'})
    @Returns(409, {type: model.Error, description: 'InvalidPermissions: User is not authorized to view transaction history\n'})
    public async getGroupTransactions(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('groupId', Number) groupId: number,
        @QueryParams('offset', Number) offset: number = 0
    ): Promise<model.economy.GroupTransactions[]> {
        let data;
        try {
            data  = await this.group.getUserRole(groupId, userInfo.userId);
        }catch{
            throw new this.BadRequest('InvalidGroupId');
        }
        if (data.permissions.manage !== 1) {
            throw new this.Conflict('InvalidPermissions');
        }
        const transactions = await this.economy.getGroupTransactions(groupId, offset);
        return transactions;
    }

    @Put('/currency/convert')
    @Summary('Convert one currency to another')
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    @Returns(400, {type: model.Error, description: 'InvalidAmount: Amount must be < 100,000 & > 0\nNotEnoughCurrency: Not enough currency for this transaction\nInvalidCurrency: Invalid Currency Specified'})
    public async convertCurrency(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @BodyParams('currency', Number) originCurrency: model.economy.currencyType, 
        @Required()
        @BodyParams('amount', Number) numericAmount: number,
    ): Promise<{ success: true }> {
        try {
            // Lock economy
            await this.economy.lockUserEconomy(userInfo.userId);
        }catch(e) {
            console.error(e);
            throw new this.Conflict('Cooldown');
        }
        // Define unlock function
        const unlockEconomy = async () => {
            await this.economy.unlockUserEconomy(userInfo.userId);
        }
        let maxCurrency = 0;
        let minCurrency = 0;
        if (originCurrency === model.economy.currencyType.primary) {
            maxCurrency = model.economy.CONVERSION_PRIMARY_TO_SECONDARY_MAX;
            minCurrency = model.economy.MINIMUM_CURRENCY_CONVERSION_PRIMARY_TO_SECONDARY;
        }else if (originCurrency === model.economy.currencyType.secondary) {
            maxCurrency = model.economy.CONVERSION_SECONDARY_TO_PRIMARY_MAX;
            minCurrency = model.economy.MINIMUM_CURRENCY_CONVERSION_SECONDARY_TO_PRIMARY;
        }
        if (numericAmount > maxCurrency || maxCurrency < minCurrency) {
            // Unlock economy
            await unlockEconomy();
            throw new this.BadRequest('InvalidAmount');
        }
        if (originCurrency === model.economy.currencyType.primary) {
            if (numericAmount < 0) {
                // Unlock economy
                await unlockEconomy();
                throw new this.BadRequest('InvalidAmount');
            }
            // Convert
            const newAmount = await this.economy.convertCurrency(numericAmount, model.economy.currencyType.secondary);
            if (userInfo.primaryBalance < numericAmount) {
                // Unlock economy
                await unlockEconomy();
                throw new this.BadRequest('NotEnoughCurrency');
            }
            // Subtract Transaction w/ Rollback
            try {
                await this.economy.subtractFromUserBalance(userInfo.userId, numericAmount, model.economy.currencyType.primary);
            } catch (e) {
                if (e === model.economy.userBalanceErrors.NotEnoughCurrency) {
                    // Unlock economy
                    await unlockEconomy();
                    throw new this.BadRequest('NotEnoughCurrency');
                }
                await this.economy.addToUserBalance(userInfo.userId, numericAmount, model.economy.currencyType.primary);
                // Unlock economy
                await unlockEconomy();
                throw e;
            }
            // Give Currency
            try {
                await this.economy.addToUserBalance(userInfo.userId, newAmount, model.economy.currencyType.secondary);
            } catch (e) {
                // E
                // Refund initial purchase
                await this.economy.addToUserBalance(userInfo.userId, numericAmount, model.economy.currencyType.primary);
                // Unlock economy
                await unlockEconomy();
                throw e;
            }
            // Create Transactions
            await this.economy.createTransaction(userInfo.userId, userInfo.userId, -numericAmount, model.economy.currencyType.primary, model.economy.transactionType.CurrencyConversionOfPrimaryToSecondary, "Currency Conversion", model.catalog.creatorType.User, model.catalog.creatorType.User);
            await this.economy.createTransaction(userInfo.userId, userInfo.userId, newAmount, model.economy.currencyType.secondary, model.economy.transactionType.CurrencyConversionOfPrimaryToSecondary, "Currency Conversion", model.catalog.creatorType.User, model.catalog.creatorType.User);

            // Unlock economy
            await unlockEconomy();

            // Return success
            return { success: true };
        } else if (originCurrency === model.economy.currencyType.secondary) {
            if (numericAmount < 10) {
                // Unlock economy
                await unlockEconomy();
                throw new this.BadRequest('InvalidAmount');
            }
            if (numericAmount % 10 === 0) {
                // Convert
                const newAmount = await this.economy.convertCurrency(numericAmount, model.economy.currencyType.primary);
                if (userInfo.secondaryBalance < numericAmount) {
                    // Unlock economy
                    await unlockEconomy();
                    throw new this.BadRequest('NotEnoughCurrency');
                }
                // Subtract Transaction w/ Rollback
                try {
                    await this.economy.subtractFromUserBalance(userInfo.userId, numericAmount, model.economy.currencyType.secondary);
                } catch (e) {
                    if (e === model.economy.userBalanceErrors.NotEnoughCurrency) {
                        // Unlock economy
                    await unlockEconomy();
                        throw new this.BadRequest('NotEnoughCurrency');
                    }
                    await this.economy.addToUserBalance(userInfo.userId, numericAmount, model.economy.currencyType.secondary);
                    // Unlock economy
                    await unlockEconomy();
                    throw e;
                }
                // Give Currency
                try {
                    await this.economy.addToUserBalance(userInfo.userId, newAmount, model.economy.currencyType.primary);
                } catch (e) {
                    // E
                    await this.economy.addToUserBalance(userInfo.userId, numericAmount, model.economy.currencyType.secondary);
                    // Unlock economy
                    await unlockEconomy();
                    throw e;
                }
                // Create Transactions
                await this.economy.createTransaction(userInfo.userId, userInfo.userId, -numericAmount, model.economy.currencyType.secondary, model.economy.transactionType.CurrencyConversionOfSecondaryToPrimary, "Currency Conversion", model.catalog.creatorType.User, model.catalog.creatorType.User);
                await this.economy.createTransaction(userInfo.userId, userInfo.userId, newAmount, model.economy.currencyType.primary, model.economy.transactionType.CurrencyConversionOfSecondaryToPrimary, "Currency Conversion", model.catalog.creatorType.User, model.catalog.creatorType.User);
                // Unlock economy
                await unlockEconomy();
                // Return success
                return { success: true };
            } else {
                // Unlock economy
                await unlockEconomy();
                throw new this.BadRequest('NotEnoughCurrency');
            }
        } else {
            // Unlock economy
            await unlockEconomy();
            throw new this.BadRequest('InvalidCurrency');
        }
    }

    @Post('/:id/buy')
    @Summary('Purchase a catalog item')
    @Description('Notes: User can own multiple collectible items but can only own one non-collectible item. If a collectible item is still listed for sale, the user can only own one and cannot own multiple until it is taken off sale or sells out.')
    @Returns(400, {type: model.Error, description: 'InvalidCatalogId: CatalogId is invalid\nNoLongerForSale: Item is no longer for sale\nSellerHasChanged: The userId of the seller has changed\nPriceHasChanged: Price has changed\nCurrencyHasChanged: Currency has changed\nNotEnoughCurrency: User does not have enough currency for this purchase\nInvalidCurrencySpecified: Currency of product is invalid\nItemStillForSale: You cannot purchase collectible items that have not finished selling yet\nInvalidUserInventoryId: Invalid userInventoryId\nItemNoLongerForSale: Item is no longer for sale\nInvalidUserId: Seller userId is invalid\n'})
    @Returns(409, {type: model.Error, description: 'ConstraintEmailVerificationRequired: Your account must have a verified email before you can purchase something.\nAlreadyOwns: User already owns the item specified\n'})
    @Use(csrf, YesAuth, TwoStepCheck('BuyItem'))
    public async buy(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('id', Number) catalogIdStr: string, 
        @Required()
        @BodyParams('userInventoryId', Number) userInventoryIdStr: string, 
        @Required()
        @BodyParams('expectedSellerId', Number) sellerUserIdStr: string, 
        @Required()
        @BodyParams('expectedPrice', Number) expectedPriceStr: string, 
        @Required()
        @BodyParams('expectedCurrency', Number) expectedCurrencyStr: string, 
        @Req() req: Req,
    ) {
        let ipAddress = req.ip;
        if (req.headers['cf-connecting-ip']) {
            ipAddress = req.headers['cf-connecting-ip'] as string;
        }
        // Parse Input Data
        const catalogId = parseInt(catalogIdStr);
        const userInventoryId = parseInt(userInventoryIdStr);
        const sellerUserId = parseInt(sellerUserIdStr);
        const expectedPrice = parseInt(expectedPriceStr);
        const expectedCurrency = parseInt(expectedCurrencyStr);
        const unlockEconomy = async () => {
            await this.economy.unlockUserEconomy(userInfo.userId);
        }
        // Check email status
        const emailStatus = await this.settings.getUserEmail(userInfo.userId);
        if (!emailStatus || emailStatus.status !== model.user.emailVerificationType.true) {
            await unlockEconomy();
            throw new this.Conflict('ConstraintEmailVerificationRequired');
        }
        // If buying new...
        if (userInventoryId === 0) {
            // Buying New
            let catalogItemInfo: model.catalog.CatalogInfo;
            try {
                catalogItemInfo = await this.catalog.getInfo(catalogId, ['catalogId', 'forSale', 'creatorId', 'creatorType', 'price', 'currency', 'maxSales', 'collectible', 'catalogName']);
            } catch (e) {
                throw new this.BadRequest('InvalidCatalogId');
            }
            if (catalogItemInfo.forSale === model.catalog.isForSale.false) {
                // No longer for sale
                throw new this.BadRequest('NoLongerForSale');
            }
            if (catalogItemInfo.creatorId !== sellerUserId) {
                // Seller has changed
                throw new this.BadRequest('SellerHasChanged');
            }
            if (catalogItemInfo.price !== expectedPrice) {
                // Expected price is different from real price
                throw new this.BadRequest('PriceHasChanged');
            }
            if (catalogItemInfo.currency !== expectedCurrency) {
                // Currency has changed
                throw new this.BadRequest('CurrencyHasChanged');
            }
            // Lock economy
            try {
                await this.economy.lockUserEconomy(userInfo.userId);
            }catch(e) {
                console.error(e);
                throw new this.Conflict('Cooldown');
            }
            let serial = null;
            if (catalogItemInfo.collectible === model.catalog.collectible.true && catalogItemInfo.maxSales !== 0) {
                // Unique. Verify some stuff and grab serial
                const sales = await this.catalog.countSales(catalogItemInfo.catalogId);
                if (sales >= catalogItemInfo.maxSales) {
                    // Update is_for_sale status
                    await this.catalog.updateIsForSale(catalogItemInfo.catalogId, model.catalog.isForSale.false);
                    // Unlock
                    await unlockEconomy();
                    // No longer for sale
                    throw new this.BadRequest('NoLongerForSale');
                } else {
                    serial = sales + 1;
                    if (serial >= catalogItemInfo.maxSales) {
                        // Update is_for_sale status
                        await this.catalog.updateIsForSale(catalogItemInfo.catalogId, model.catalog.isForSale.false);
                    }
                }
            }
            // Check if owns
            let owns = await this.user.getUserInventoryByCatalogId(userInfo.userId, catalogItemInfo.catalogId);
            if (owns[0]) {
                // Unlock
                await unlockEconomy();
                // Owns item already
                throw new this.Conflict('AlreadyOwns');
            }
            // Define expected balance once complete
            let expectedBalanceAfterTransaction = 0;
            // Get balance and check if has enough
            if (catalogItemInfo.currency === model.economy.currencyType.primary) {
                const balance = userInfo.primaryBalance as number;
                if (catalogItemInfo.price > balance) {
                    // Unlock
                    await unlockEconomy();
                    throw new this.BadRequest('NotEnoughCurrency')
                }
                expectedBalanceAfterTransaction = userInfo.primaryBalance - catalogItemInfo.price;
            } else if (catalogItemInfo.currency === model.economy.currencyType.secondary) {
                const balance = userInfo.secondaryBalance as number;
                if (catalogItemInfo.price > balance) {
                    // Unlock
                    await unlockEconomy();
                    throw new this.BadRequest('NotEnoughCurrency');
                }
                expectedBalanceAfterTransaction = userInfo.secondaryBalance - catalogItemInfo.price;
            } else {
                // Unlock
                await unlockEconomy();
                throw new this.BadRequest('InvalidCurrencySpecified');
            }
            // Create and Give item
            let inventoryId = await this.catalog.createItemForUserInventory(userInfo.userId, catalogItemInfo.catalogId, serial);
            // Define seller amount
            const amtToSubtractFromSeller = Math.abs(catalogItemInfo.price * 0.3);
            const amtToSeller = catalogItemInfo.price - amtToSubtractFromSeller;
            // Subtract balance
            // Take money from buyer
            let transactionIdForBuyer: number = 0;
            let transactionIdForSeller: number = 0;
            try {
                // Subtract Balance
                await this.economy.subtractFromUserBalance(userInfo.userId, catalogItemInfo.price, catalogItemInfo.currency);
                // Create Transaction
                if (catalogItemInfo.creatorType === model.catalog.creatorType.User) {
                    // Give to user seller
                    transactionIdForSeller = await this.economy.createTransaction(userInfo.userId, catalogItemInfo.creatorId, -catalogItemInfo.price, catalogItemInfo.currency, model.economy.transactionType.PurchaseOfItem, "Purchase of " + catalogItemInfo.catalogName, model.catalog.creatorType.User, model.catalog.creatorType.User, catalogItemInfo.catalogId, inventoryId);
                } else {
                    // Give to group seller
                    transactionIdForSeller = await this.economy.createTransaction(userInfo.userId, catalogItemInfo.creatorId, -catalogItemInfo.price, catalogItemInfo.currency, model.economy.transactionType.PurchaseOfItem, "Purchase of " + catalogItemInfo.catalogName, model.catalog.creatorType.Group, model.catalog.creatorType.User, catalogItemInfo.catalogId, inventoryId);
                }
            } catch (e) {
                let currentError = e;
                // If it was a balance error, 
                if (e === model.economy.userBalanceErrors.NotEnoughCurrency) {
                    let deletionError = e;
                    // While deleting the item fails, keep retrying until successful
                    while (typeof deletionError !== 'undefined') {
                        try {
                            // Delete the inventory item
                            await this.catalog.deleteUserInventoryId(inventoryId);
                            // Delete transaction
                            if (transactionIdForSeller) {
                                await this.economy.deleteTransaction(transactionIdForSeller);
                            }
                            // Set the deletion error checking to undefined, breaking out of the while loop
                            deletionError = undefined;
                        }catch(_anotherDeletionError) {
                            deletionError = _anotherDeletionError;
                        }
                    }
                    // Unlock
                    await unlockEconomy();
                    // Throw not enough currency error
                    throw new this.BadRequest('NotEnoughCurrency');
                }
                // While current error is undefined,
                while (typeof currentError !== 'undefined') {
                    try {
                        // Delete Item
                        await this.catalog.deleteUserInventoryId(inventoryId);
                        // Delete transaction
                        if (transactionIdForSeller) {
                            await this.economy.deleteTransaction(transactionIdForSeller);
                        }
                        // Set to undefined
                        currentError = undefined;
                    }catch(moreErrors) {
                        currentError = moreErrors;
                    }
                }
                // Likely some form of db exception
                throw e;
            }
            // Give money to seller
            try {
                if (catalogItemInfo.creatorType === model.catalog.creatorType.User) {
                    // Give to user
                    await this.economy.addToUserBalance(catalogItemInfo.creatorId, amtToSeller, catalogItemInfo.currency);
                    // Create transaction
                    try {
                        transactionIdForBuyer = await this.economy.createTransaction(catalogItemInfo.creatorId, userInfo.userId, amtToSeller, catalogItemInfo.currency, model.economy.transactionType.SaleOfItem, "Sale of " + catalogItemInfo.catalogName, model.catalog.creatorType.User, model.catalog.creatorType.User, catalogItemInfo.catalogId, inventoryId);
                    }catch(e) {
                        // Rollback addToUserBalance
                        let transactionError = e;
                        while (typeof transactionError !== 'undefined' && typeof transactionError !== 'number') {
                            try {
                                // Subtract
                                await this.economy.subtractFromUserBalance(catalogItemInfo.creatorId, amtToSeller, catalogItemInfo.currency)
                            }catch(_internalError) {
                                // F
                                transactionError = _internalError;
                            }
                        }

                        throw e;
                    }
                } else if (catalogItemInfo.creatorType === model.catalog.creatorType.Group) {
                    // Give to Group
                    await this.economy.addToGroupBalance(catalogItemInfo.creatorId, amtToSeller, catalogItemInfo.currency);
                    // Create transaction
                    try {
                        transactionIdForBuyer = await this.economy.createTransaction(catalogItemInfo.creatorId, userInfo.userId, amtToSeller, catalogItemInfo.currency, model.economy.transactionType.SaleOfItem, "Sale of " + catalogItemInfo.catalogName, model.catalog.creatorType.User, model.catalog.creatorType.Group, catalogItemInfo.catalogId, inventoryId);
                    }catch(e) {
                        // Rollback addToGroupBalance
                        let transactionError = e;
                        while (typeof transactionError !== 'undefined' && typeof transactionError !== 'number') {
                            try {
                                // Subtract
                                await this.economy.subtractFromGroupBalance(catalogItemInfo.creatorId, amtToSeller, catalogItemInfo.currency)
                            }catch(_internalError) {
                                // F
                                transactionError = _internalError;
                            }
                        }
                        throw e;
                    }
                }
            } catch (e) {
                let generalRollbackError = e;
                while (typeof generalRollbackError !== 'undefined') {
                    try {
                        // Delete Item
                        await this.catalog.deleteUserInventoryId(inventoryId);
                        // Delete transaction
                        await this.economy.deleteTransaction(transactionIdForBuyer);
                        // Refund buyer
                        await this.economy.addToUserBalance(userInfo.userId, catalogItemInfo.price, catalogItemInfo.currency);
                    }catch(_internalRollbackError) {
                        generalRollbackError = _internalRollbackError;
                    }
                }
                // Unlock
                await unlockEconomy();
                throw e;
            }
            // Log Purchase
            try {
                await this.user.logUserIp(userInfo.userId, ipAddress, model.user.ipAddressActions.PurchaseOfItem);
            } catch (e) {
                // We don't really care if this fails; if it fails, it shouldnt affect anything (in fact, this shouldn't even be awaited)
            }
            const reverseTransaction = async () => {
                // Reverse transaction
                let generalRollbackError = new Error('UnexpectedBalanceChange');
                while (typeof generalRollbackError !== 'undefined') {
                    try {
                        // Delete Item
                        await this.catalog.deleteUserInventoryId(inventoryId);
                        // Delete transaction for buyer
                        await this.economy.deleteTransaction(transactionIdForBuyer);
                        // Delete transaction for seller
                        await this.economy.deleteTransaction(transactionIdForSeller);
                        // Refund buyer
                        await this.economy.addToUserBalance(userInfo.userId, catalogItemInfo.price, catalogItemInfo.currency);
                        // Subtract amount given from seller
                        if (catalogItemInfo.creatorType === model.catalog.creatorType.Group) {
                            await this.economy.subtractFromGroupBalance(catalogItemInfo.creatorId, amtToSeller, catalogItemInfo.currency);
                        }else if (catalogItemInfo.creatorType === model.catalog.creatorType.User) {
                            await this.economy.subtractFromUserBalance(catalogItemInfo.creatorId, amtToSeller, catalogItemInfo.currency);
                        }else{
                            throw new Error('NotImplemented');
                        }
                        generalRollbackError = undefined;
                    }catch(_internalRollbackError) {
                        generalRollbackError = _internalRollbackError;
                    }
                }
            }
            // Confirm transaction was valid
            if (catalogItemInfo.currency === model.economy.currencyType.primary) {
                let userBalanceFinal = await this.user.getInfo(userInfo.userId, ['primaryBalance']);
                if (userBalanceFinal.primaryBalance !== expectedBalanceAfterTransaction) {
                    // Reverse transaction
                    await reverseTransaction();
                    // Unlock
                    await unlockEconomy();
                    // Error
                    throw new Error('UnexpectedBalanceChange');
                }
            }else if (catalogItemInfo.currency === model.economy.currencyType.secondary) {
                let userBalanceFinal = await this.user.getInfo(userInfo.userId, ['secondaryBalance']);
                if (userBalanceFinal.secondaryBalance !== expectedBalanceAfterTransaction) {
                    // Reverse transaction
                    await reverseTransaction();
                    // Unlock
                    await unlockEconomy();
                    // Error
                    throw new Error('UnexpectedBalanceChange');
                }
            }
            // Unlock economy
            await unlockEconomy();
            // Return Success
            return { success: true };
            // Buying Used
        } else {
            let catalogItemInfo;
            try {
                catalogItemInfo = await this.catalog.getInfo(catalogId, ['catalogId', 'forSale', 'maxSales', 'collectible', 'catalogName']);
            } catch (e) {
                throw new this.BadRequest('InvalidCatalogId');
            }
            if (catalogItemInfo.forSale === model.catalog.isForSale.true) {
                // Item is still for sale which means you cannot buy it used
                throw new this.BadRequest('ItemStillForSale');
            }
            if (expectedCurrency !== model.economy.currencyType.primary) {
                // You can only buy used items with primary currency
                throw new this.BadRequest('InvalidCurrency');
            }
            let usedItemInfo;
            try {
                usedItemInfo = await this.catalog.getItemByUserInventoryId(userInventoryId);
            } catch (e) {
                throw new this.BadRequest('InvalidUserInventoryId');
            }
            if (usedItemInfo.price !== expectedPrice) {
                // Price has changed
                throw new this.BadRequest('PriceHasChanged');
            }
            if (usedItemInfo.userId !== sellerUserId) {
                // Seller has changed
                throw new this.BadRequest('SellerHasChanged');
            }
            if (usedItemInfo.catalogId !== catalogItemInfo.catalogId) {
                // Invalid Catalog ID/userInventoryId Combination
                throw new this.BadRequest('InvalidCatalogId');
            }
            if (usedItemInfo.price <= 0) {
                // Item is not for sale/no longer for sale
                throw new this.BadRequest('ItemNoLongerForSale');
            }
            if (usedItemInfo.userId === userInfo.userId) {
                // You can't buy your own item ;-;
                throw new this.BadRequest('InvalidUserId');
            }
            // Lock economy
            try {
                await this.economy.lockUserEconomy(userInfo.userId);
            }catch(e) {
                console.error(e);
                throw new this.Conflict('Cooldown');
            }
            let sellerInfo;
            try {
                sellerInfo = await this.user.getInfo(usedItemInfo.userId);
                if (sellerInfo.accountStatus === model.user.accountStatus.deleted || sellerInfo.accountStatus === model.user.accountStatus.terminated) {
                    throw false;
                }
            } catch (e) {
                // Unlock economy
                await unlockEconomy();
                // Take off sale
                await this.user.editItemPrice(userInventoryId, 0);
                // Return error
                throw new this.BadRequest('ItemNoLongerForSale');
            }
            // Check if Has Enough
            const balance = userInfo.primaryBalance as number;
            if (usedItemInfo.price > balance) {
                // Unlock economy
                await unlockEconomy();
                // User does not have enough currency, so error
                throw new this.BadRequest('NotEnoughCurrency');
            }
            // Give ownership
            await this.catalog.updateUserInventoryIdOwner(usedItemInfo.userInventoryId, userInfo.userId);
            // Create transaction
            try {
                // Subtract Balance
                await this.economy.subtractFromUserBalance(userInfo.userId, usedItemInfo.price, model.economy.currencyType.primary);
                // Create Transaction
                await this.economy.createTransaction(userInfo.userId, usedItemInfo.userId, -usedItemInfo.price, model.economy.currencyType.primary, model.economy.transactionType.PurchaseOfItem, "Purchase of " + catalogItemInfo.catalogName, model.catalog.creatorType.User, model.catalog.creatorType.User, catalogItemInfo.catalogId, usedItemInfo.userInventoryId);
            } catch (e) {
                // Give ownership back to old owner
                await this.catalog.updateUserInventoryIdOwner(usedItemInfo.userInventoryId, usedItemInfo.userId);
                if (e === model.economy.userBalanceErrors.NotEnoughCurrency) {
                    // Unlock economy
                    await unlockEconomy();
                    // Requester does not have enough currency
                    throw new this.BadRequest('NotEnoughCurrency');
                }
                // Likely db exception
                throw e;
            }
            // Define seller amount
            const amtToSubtractFromSeller = Math.abs(usedItemInfo.price * 0.3);
            const amtToSeller = usedItemInfo.price - amtToSubtractFromSeller;
            // Create Seller Transaction
            try {
                // Give Money
                await this.economy.addToUserBalance(usedItemInfo.userId, amtToSeller, model.economy.currencyType.primary);
                // Create Transaction
                await this.economy.createTransaction(usedItemInfo.userId, userInfo.userId, amtToSeller, model.economy.currencyType.primary, model.economy.transactionType.SaleOfItem, "Sale of " + catalogItemInfo.catalogName, model.catalog.creatorType.User, model.catalog.creatorType.User, catalogItemInfo.catalogId, usedItemInfo.userInventoryId);
            } catch (e) {
                // Give ownership back to old owner
                await this.catalog.updateUserInventoryIdOwner(usedItemInfo.userInventoryId, usedItemInfo.userId);
                // Refund buyer
                await this.economy.addToUserBalance(userInfo.userId, usedItemInfo.price, model.economy.currencyType.primary);
                await this.economy.createTransaction(userInfo.userId, usedItemInfo.userId, usedItemInfo.price, model.economy.currencyType.primary, model.economy.transactionType.Refund, "Refund", model.catalog.creatorType.User, model.catalog.creatorType.User, catalogItemInfo.catalogId, usedItemInfo.userInventoryId);
                // Unlock economy
                await unlockEconomy();
                // Throw (what is likely a DB error)
                throw e;
            }
            // Take Item Off Sale
            try {
                await this.user.editItemPrice(usedItemInfo.userInventoryId, 0);
            } catch (e) {
                // Unlock economy
                await unlockEconomy();
                // Throw exception
                throw e;
            }
            // Additional Background Tasks
            try {
                // Log IP
                await this.user.logUserIp(userInfo.userId, ipAddress, model.user.ipAddressActions.PurchaseOfItem);
                // Grab RAP
                const averagePrice = await this.catalog.calculateAveragePrice(catalogItemInfo.catalogId);
                console.log("Price: " + averagePrice);
                // Update RAP
                await this.catalog.setAveragePrice(catalogItemInfo.catalogId, averagePrice);
            } catch (e) {
                console.error(e);
            }
            this.regenAvatarAfterItemTransferOwners(usedItemInfo.userId, usedItemInfo.catalogId).then(d => {
                console.log(d);
            }).catch(e => {
                console.error(e);
            })
            // Unlock economy
            await unlockEconomy();
            // Return success
            return { success: true };
        }
    }

    @Get('/trades/:tradeId/items')
    @Summary('Get the items involved in a specific tradeId')
    @Description('Requestee is authenticated user, requested is the partner involved with the trade')
    @Returns(200, {type: model.economy.TradeItemsResponse})
    @Returns(400, {type: model.Error, description: 'InvalidTradeId: TradeId is invalid or you do not have permission to view it\n'})
    @UseBeforeEach(YesAuth)
    public async getTradeItems(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('tradeId', Number) numericTradeId: number,
    ) {
        if (!numericTradeId) {
            throw new this.BadRequest('InvalidTradeId');
        }
        let tradeInfo;
        try {
            tradeInfo = await this.economy.getTradeById(numericTradeId);
        } catch (e) {
            throw new this.BadRequest('InvalidTradeId');
        }
        if (tradeInfo.userIdOne === userInfo.userId) {
            const requestedTradeItems = await this.economy.getTradeItems(model.economy.tradeSides.Requested, numericTradeId);
            const requesteeTradeItems = await this.economy.getTradeItems(model.economy.tradeSides.Requester, numericTradeId);
            return { 'requested': requestedTradeItems, 'requestee': requesteeTradeItems };
        } else if (tradeInfo.userIdTwo === userInfo.userId) {
            const requestedTradeItems = await this.economy.getTradeItems(model.economy.tradeSides.Requester, numericTradeId);
            const requesteeTradeItems = await this.economy.getTradeItems(model.economy.tradeSides.Requested, numericTradeId);
            return { 'requested': requestedTradeItems, 'requestee': requesteeTradeItems };
        } else {
            throw new this.BadRequest('InvalidTradeId');
        }
    }

    @Delete('/trades/:tradeId')
    @Summary('Decline/cancel a trade by the tradeId')
    @Returns(400, {type: model.Error, description: 'InvalidTradeId: TradeId is invalid (Doesnt exist, already declined/state doesnt allow decling, does not involve user, etc)\n'})
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async declineTrade(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('tradeId', Number) numericTradeId: number
    ) {
        if (!numericTradeId) {
            throw new this.BadRequest('InvalidTradeId');
        }
        let tradeInfo = await this.economy.getTradeById(numericTradeId);
        if (tradeInfo.status !== model.economy.tradeStatus.Pending) {
            throw new this.BadRequest('InvalidTradeId');
        }
        // Send Message
        if (tradeInfo.userIdTwo === userInfo.userId) {
            await this.notification.createMessage(tradeInfo.userIdOne, 1, 'Trade Declined', 'Hello,\n' + userInfo.username + ' has declined your trade. You may view it in the Inactive tab of your trades.');
        }
        if (tradeInfo.userIdOne === userInfo.userId || tradeInfo.userIdTwo === userInfo.userId) {
            await this.economy.declineTradeById(numericTradeId);
            return { success: true };
        } else {
            throw new this.BadRequest('InvalidTradeId');
        }
    }

    @Post('/trades/:tradeId')
    @Summary('Accept a trade')
    @Returns(400, {type: model.Error, description: 'InvalidTradeId: TradeId is invalid\nInvalidPartnerId: Trade cannot be completed due to an internal error\nNotAuthorized: User is not authorized to modify this trade (ex: didnt create the trade, already accepted, already declined, etc)'})
    @Returns(500, {type: model.Error, description: 'InternalServerError: Trade cannot be completed due to an internal error\n'})
    @Returns(409, {type: model.Error, description: 'OneOrMoreItemsNotAvailable: One or more of the items involved in the trade are no longer available\nCooldown: Try again later\n'})
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async acceptTrade(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('tradeId', Number) numericTradeId: number
    ): Promise<{ success: true }> {
        if (!numericTradeId) {
            throw new this.BadRequest('InvalidTradeId');
        }
        let tradeInfo: model.economy.ExtendedTradeInfo;
        try {
            tradeInfo = await this.economy.getTradeById(numericTradeId);
        } catch (e) {
            throw new this.BadRequest('InvalidTradeId');
        }
        if (tradeInfo.status !== model.economy.tradeStatus.Pending) {
            throw new this.BadRequest('InvalidTradeId');
        }
        // Continue
        if (tradeInfo.userIdTwo === userInfo.userId) {
            const unlockEconomy = async () => {
                let _internalErrors = undefined;
                try {
                    await this.economy.unlockUserEconomy(userInfo.userId);
                }catch(e) {
                    _internalErrors = e;
                }
                try {
                    await this.economy.unlockUserEconomy(tradeInfo.userIdOne);
                }catch(e) {
                    if (_internalErrors) {
                        throw _internalErrors;
                    }
                    throw e;
                }
            }
            try {
                // Try to lock economy for both users
                await this.economy.lockUserEconomy(userInfo.userId);
                try {
                    await this.economy.lockUserEconomy(tradeInfo.userIdOne);
                }catch(e) {
                    try {
                        // Unlock economy
                        await unlockEconomy();
                    }catch(e) {
                        throw e;
                    }
                    throw e;
                }
            }catch(e) {
                console.error(e);
                throw new this.Conflict('Cooldown');
            }
            // Verify Partner isn't terminated
            let partnerInfo = await this.user.getInfo(tradeInfo.userIdOne, ['accountStatus']);
            if (partnerInfo.accountStatus === model.user.accountStatus.deleted || partnerInfo.accountStatus === model.user.accountStatus.terminated) {
                // Unlock economy
                await unlockEconomy();
                throw new this.BadRequest('InvalidPartnerId');
            }
            // requestedTradeItems = items authentiocated user will recieve
            const requestedTradeItems = await this.economy.getTradeItems(model.economy.tradeSides.Requester, numericTradeId);
            if (requestedTradeItems.length < 1) {
                // Unlock economy
                await unlockEconomy();
                // Throw error
                throw new Error('Internal');
            }
            // requesteeTradeItems = items authenticated user will give
            const requesteeTradeItems = await this.economy.getTradeItems(model.economy.tradeSides.Requested, numericTradeId);
            if (requesteeTradeItems.length < 1) {
                // Unlock economy
                await unlockEconomy();
                // Throw error
                throw new Error('Internal');
            }
            // Verify Ownership of Items
            const verifyOwnershipOfItems = (userId: number, items: model.economy.TradeItems[]): Promise<void> => {
                return new Promise((resolve, reject): void => {
                    const promises = [];
                    for (const item of items) {
                        promises.push(
                            this.catalog.getItemByUserInventoryId(item["userInventoryId"])
                        );
                    }
                    Promise.all(promises)
                        .then((results) => {
                            for (const result of results) {
                                if (result.userId !== userId) {
                                    console.log(result.userId);
                                    console.log(userId);
                                    reject(0);
                                    return;
                                }
                            }
                            resolve();
                        })
                        .catch((e) => {
                            reject(e);
                        });
                });
            }
            // Swap item owners
            const swapOwnersOfItems = (userId: number, items: model.economy.TradeItems[]): Promise<void> => {
                return new Promise((resolve, reject): void => {
                    const promises = [];
                    for (const item of items) {
                        promises.push(
                            this.catalog.updateUserInventoryIdOwner(item["userInventoryId"], userId),
                            this.user.editItemPrice(item["userInventoryId"], 0),
                        );
                    }
                    Promise.all(promises)
                        .then(() => {
                            resolve();
                        })
                        .catch(() => {
                            reject();
                        });
                });
            }
            try {
                // Validate Owners
                const OwnershipValidation = [
                    verifyOwnershipOfItems(tradeInfo.userIdOne, requestedTradeItems),
                    verifyOwnershipOfItems(tradeInfo.userIdTwo, requesteeTradeItems),
                ];
                await Promise.all(OwnershipValidation);
                // Owners are valid. Swap ownership
                // Swap Owners
                try {
                    const OwnershipSwap = [
                        swapOwnersOfItems(tradeInfo.userIdTwo, requestedTradeItems),
                        swapOwnersOfItems(tradeInfo.userIdOne, requesteeTradeItems),
                    ]
                    await Promise.all(OwnershipSwap);
                } catch (e) {
                    // Reverse swap
                    try {
                        const OwnershipSwap = [
                            swapOwnersOfItems(tradeInfo.userIdOne, requestedTradeItems),
                            swapOwnersOfItems(tradeInfo.userIdTwo, requesteeTradeItems),
                        ]
                        await Promise.all(OwnershipSwap);
                    } catch (e) {
                        // Uh-oh
                        throw e;
                    }
                    throw e;
                }
                // Update trade status
                await this.economy.markTradeAccepted(numericTradeId);
                // Startup background task 
                (async (): Promise<void> => {
                    // Send Success Message
                    try {
                        const s = requestedTradeItems.length > 1 ? 's' : '';
                        await this.notification.createMessage(tradeInfo.userIdOne, 1, 'Trade Accepted', 'Hello,\n' + userInfo.username + ' has accepted your trade. You can view your new item' + s + ' in your inventory.');
                    } catch (e) {

                    }
                    // Regen Avatars
                    try {
                        const itemIdsOne = [];
                        for (const item of requestedTradeItems) {
                            itemIdsOne.push(item.catalogId);
                        }
                        const itemIdsTwo = [];
                        for (const item of requesteeTradeItems) {
                            itemIdsTwo.push(item.catalogId);
                        }
                        // Gen avatars
                        (async (): Promise<void> => {
                            await this.regenAvatarAfterItemTransferOwners(tradeInfo.userIdOne, itemIdsOne);
                        })();
                        (async (): Promise<void> => {
                            await this.regenAvatarAfterItemTransferOwners(tradeInfo.userIdTwo, itemIdsTwo);
                        })();
                    } catch (e) {
                        console.log(e);
                    }
                })();
                // Unlock economy
                await unlockEconomy();
                // Return success
                return { success: true };
            } catch (e) {
                // Cancel Trade
                try {
                    await this.economy.declineTradeById(numericTradeId);
                } catch (e) {
                    throw e;
                }
                // Unlock economy
                await unlockEconomy();
                // Return error
                throw new this.Conflict('OneOrMoreItemsNotAvailable');
            }
        } else {
            // You can't accept your own trade
            throw new this.BadRequest('NotAuthorized');
        }
    }
}
