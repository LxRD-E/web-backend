/**
 * Imports
 */
// Interfaces
import * as model from '../../models/models';
import {YesAuth} from '../../middleware/Auth';
import {csrf} from '../../dal/auth';
// Autoload
import controller from '../controller';
import {
    BodyParams,
    Controller,
    Delete,
    Get,
    Locals,
    PathParams,
    Post,
    Put,
    QueryParams,
    Req,
    Required,
    Use,
    UseBefore,
    UseBeforeEach
} from '@tsed/common';
import {Description, Returns, ReturnsArray, Summary} from '@tsed/swagger';
import TwoStepCheck from '../../middleware/TwoStepCheck';
import TwoStepMiddleware from '../../middleware/TwoStepCheck';
import {filterId} from "../../helpers/Filter";

/**
 * Economy Controller
 */
@Controller('/economy')
export default class EconomyController extends controller {
    constructor() {
        super();
    }

    @Get('/metadata/collectible-resale-fee')
    @Summary('Get item resale fee percentage for collectibles')
    @Returns(200, {type: model.economy.FeeMetaData})
    public getResellFeeCollectible() {
        return {
            fee: model.economy.RESELL_ITEM_FEE,
        };
    }

    @Get('/metadata/sell-fee')
    @Summary('Get item resale fee percentage for normal items (shirts, pants, etc)')
    @Returns(200, {type: model.economy.FeeMetaData})
    public getSellFee() {
        return {
            fee: model.economy.SELL_ITEM_FEE,
        };
    }

    @Get('/metadata/currency-conversion-rate')
    @Summary('Get currency conversion metadata')
    @Returns(200, {type: model.economy.CurrencyConversionMetadata})
    @Use(YesAuth)
    public getCurrencyConversionMetadata() {
        return {
            isEnabled: true,
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

    @Get('/trades/metadata')
    @Summary('Trading metadata')
    public getTradeMetadata() {
        return model.economy.trade;
    }

    @Get('/trades/:type')
    @Summary('Get user trades')
    @ReturnsArray(200, {type: model.economy.TradeInfo})
    @Returns(400, {
        type: model.Error,
        description: 'InvalidTradeType: TradeType must be one of: inbound,outbound,completed,inactive\n'
    })
    @Use(YesAuth)
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
        return await this.economy.getTrades(userInfo.userId, tradeValue, offset);
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
        return await this.economy.getUserTransactions(userInfo.userId, offset);
    }

    @Get('/group/:groupId/transactions')
    @Summary('Get transaction history for the group. User must have manage permission')
    @UseBefore(YesAuth)
    @ReturnsArray(200, {type: model.economy.GroupTransactions})
    @Returns(400, {type: model.Error, description: 'InvalidGroupId: GroupID is not valid\n'})
    @Returns(409, {
        type: model.Error,
        description: 'InvalidPermissions: User is not authorized to view transaction history\n'
    })
    public async getGroupTransactions(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('groupId', Number) groupId: number,
        @QueryParams('offset', Number) offset: number = 0
    ): Promise<model.economy.GroupTransactions[]> {
        let data;
        try {
            data = await this.group.getUserRole(groupId, userInfo.userId);
        } catch {
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
    @Returns(400, {
        type: model.Error,
        description: 'InvalidAmount: Amount must be < 100,000 & > 0\nNotEnoughCurrency: Not enough currency for this transaction\nInvalidCurrency: Invalid Currency Specified'
    })
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
        } catch (e) {
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
        } else if (originCurrency === model.economy.currencyType.secondary) {
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
            return {success: true};
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
                return {success: true};
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
    @Returns(400, {
        type: model.Error,
        description: 'InvalidCatalogId: CatalogId is invalid\nNoLongerForSale: Item is no longer for sale\nSellerHasChanged: The userId of the seller has changed\nPriceHasChanged: Price has changed\nCurrencyHasChanged: Currency has changed\nNotEnoughCurrency: User does not have enough currency for this purchase\nInvalidCurrencySpecified: Currency of product is invalid\nItemStillForSale: You cannot purchase collectible items that have not finished selling yet\nInvalidUserInventoryId: Invalid userInventoryId\nItemNoLongerForSale: Item is no longer for sale\nInvalidUserId: Seller userId is invalid\n'
    })
    @Returns(409, {
        type: model.Error,
        description: 'ConstraintEmailVerificationRequired: Your account must have a verified email before you can purchase something.\nAlreadyOwns: User already owns the item specified\n'
    })
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
        console.log(`${req.id} start buy()`);
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
        // Check email status
        // NOTE: temporarily disabled due to people complaining...
        /*
        const emailStatus = await this.settings.getUserEmail(userInfo.userId);
        if (!emailStatus || emailStatus.status !== model.user.emailVerificationType.true) {
            throw new this.Conflict('ConstraintEmailVerificationRequired');
        }
        */
        // If buying new...
        console.log(`${req.id} start transaction`);
        try {
            const forUpdate = [
                'users',
                'catalog',
                'user_inventory',
            ];
            await this.transaction(this, forUpdate, async function (trx) {
                if (userInventoryId === 0) {
                    console.log(`${req.id} get info`);
                    // Buying New
                    let catalogItemInfo: model.catalog.CatalogInfo;
                    try {
                        catalogItemInfo = await trx.catalog.getInfo(catalogId, ['catalogId', 'forSale', 'creatorId', 'creatorType', 'price', 'currency', 'maxSales', 'collectible', 'catalogName']);
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
                    let serial = null;
                    if (catalogItemInfo.collectible === model.catalog.collectible.true && catalogItemInfo.maxSales !== 0) {
                        // Unique. Verify some stuff and grab serial
                        const sales = await trx.catalog.countSales(catalogItemInfo.catalogId);
                        if (sales >= catalogItemInfo.maxSales) {
                            // Update is_for_sale status
                            await trx.catalog.updateIsForSale(catalogItemInfo.catalogId, model.catalog.isForSale.false);
                            // No longer for sale
                            throw new this.BadRequest('NoLongerForSale');
                        } else {
                            serial = sales + 1;
                            if (serial >= catalogItemInfo.maxSales) {
                                // Update is_for_sale status
                                await trx.catalog.updateIsForSale(catalogItemInfo.catalogId, model.catalog.isForSale.false);
                            }
                        }
                    }
                    // Check if owns
                    let owns = await trx.user.getUserInventoryByCatalogId(userInfo.userId, catalogItemInfo.catalogId);
                    if (owns[0]) {
                        // Owns item already
                        throw new this.Conflict('AlreadyOwns');
                    }

                    // Get balance and check if has enough
                    const newUserInfo = await trx.user.getInfo(userInfo.userId, ['primaryBalance', 'secondaryBalance']);
                    if (catalogItemInfo.currency === model.economy.currencyType.primary) {
                        const balance = newUserInfo.primaryBalance as number;
                        if (catalogItemInfo.price > balance) {
                            throw new this.BadRequest('NotEnoughCurrency')
                        }
                    } else if (catalogItemInfo.currency === model.economy.currencyType.secondary) {
                        const balance = newUserInfo.secondaryBalance as number;
                        if (catalogItemInfo.price > balance) {
                            throw new this.BadRequest('NotEnoughCurrency');
                        }
                    } else {
                        throw new this.BadRequest('InvalidCurrencySpecified');
                    }
                    // Create and Give item
                    let inventoryId = await trx.catalog.createItemForUserInventory(userInfo.userId, catalogItemInfo.catalogId, serial);
                    // Define seller amount
                    const amtToSubtractFromSeller = Math.abs(catalogItemInfo.price * 0.3);
                    const amtToSeller = catalogItemInfo.price - amtToSubtractFromSeller;
                    // Subtract balance
                    // Take money from buyer
                    let transactionIdForBuyer: number = 0;
                    let transactionIdForSeller: number = 0;
                    // Subtract Balance
                    await trx.economy.subtractFromUserBalance(userInfo.userId, catalogItemInfo.price, catalogItemInfo.currency);
                    // Create Transaction
                    if (catalogItemInfo.creatorType === model.catalog.creatorType.User) {
                        // Give to user seller
                        transactionIdForSeller = await trx.economy.createTransaction(userInfo.userId, catalogItemInfo.creatorId, -catalogItemInfo.price, catalogItemInfo.currency, model.economy.transactionType.PurchaseOfItem, "Purchase of " + catalogItemInfo.catalogName, model.catalog.creatorType.User, model.catalog.creatorType.User, catalogItemInfo.catalogId, inventoryId);
                    } else {
                        // Give to group seller
                        transactionIdForSeller = await trx.economy.createTransaction(userInfo.userId, catalogItemInfo.creatorId, -catalogItemInfo.price, catalogItemInfo.currency, model.economy.transactionType.PurchaseOfItem, "Purchase of " + catalogItemInfo.catalogName, model.catalog.creatorType.Group, model.catalog.creatorType.User, catalogItemInfo.catalogId, inventoryId);
                    }
                    // Give money to seller
                    if (catalogItemInfo.creatorType === model.catalog.creatorType.User) {
                        // Give to user
                        await trx.economy.addToUserBalance(catalogItemInfo.creatorId, amtToSeller, catalogItemInfo.currency);
                        // Create transaction
                        transactionIdForBuyer = await trx.economy.createTransaction(catalogItemInfo.creatorId, userInfo.userId, amtToSeller, catalogItemInfo.currency, model.economy.transactionType.SaleOfItem, "Sale of " + catalogItemInfo.catalogName, model.catalog.creatorType.User, model.catalog.creatorType.User, catalogItemInfo.catalogId, inventoryId);
                    } else if (catalogItemInfo.creatorType === model.catalog.creatorType.Group) {
                        // Give to Group
                        await trx.economy.addToGroupBalance(catalogItemInfo.creatorId, amtToSeller, catalogItemInfo.currency);
                        // Create transaction
                        transactionIdForBuyer = await trx.economy.createTransaction(catalogItemInfo.creatorId, userInfo.userId, amtToSeller, catalogItemInfo.currency, model.economy.transactionType.SaleOfItem, "Sale of " + catalogItemInfo.catalogName, model.catalog.creatorType.User, model.catalog.creatorType.Group, catalogItemInfo.catalogId, inventoryId);
                    }
                    console.log(`${req.id} gave money to seller. now log ip`);
                    // Log Purchase
                    // doesnt really matter if this fails, which is why it isnt awaited
                    await trx.user.logUserIp(userInfo.userId, ipAddress, model.user.ipAddressActions.PurchaseOfItem);
                    // Return Success
                    return {success: true};
                    // Buying Used
                } else {
                    let catalogItemInfo: model.catalog.CatalogInfo;
                    try {
                        catalogItemInfo = await trx.catalog.getInfo(catalogId, ['catalogId', 'forSale', 'maxSales', 'collectible', 'catalogName', 'averagePrice']);
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
                    let usedItemInfo: model.user.FullUserInventory;
                    try {
                        usedItemInfo = await trx.catalog.getItemByUserInventoryId(userInventoryId);
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
                    let sellerInfo: model.user.UserInfo;
                    try {
                        sellerInfo = await trx.user.getInfo(usedItemInfo.userId, undefined);
                        if (sellerInfo.accountStatus === model.user.accountStatus.deleted || sellerInfo.accountStatus === model.user.accountStatus.terminated) {
                            throw new Error('ItemNoLongerForSale');
                        }
                    } catch (e) {
                        // Take off sale
                        await trx.user.editItemPrice(userInventoryId, 0);
                        // Return error
                        throw new this.BadRequest('ItemNoLongerForSale');
                    }
                    // Check if Has Enough
                    const balance = userInfo.primaryBalance as number;
                    if (usedItemInfo.price > balance) {
                        // User does not have enough currency, so error
                        throw new this.BadRequest('NotEnoughCurrency');
                    }
                    // Give ownership
                    await trx.catalog.updateUserInventoryIdOwner(usedItemInfo.userInventoryId, userInfo.userId);
                    // Create transaction
                    // Subtract Balance
                    await trx.economy.subtractFromUserBalance(userInfo.userId, usedItemInfo.price, model.economy.currencyType.primary);
                    // Create Transaction
                    await trx.economy.createTransaction(userInfo.userId, usedItemInfo.userId, -usedItemInfo.price, model.economy.currencyType.primary, model.economy.transactionType.PurchaseOfItem, "Purchase of " + catalogItemInfo.catalogName, model.catalog.creatorType.User, model.catalog.creatorType.User, catalogItemInfo.catalogId, usedItemInfo.userInventoryId);
                    // Define seller amount
                    const amtToSubtractFromSeller = Math.abs(usedItemInfo.price * 0.3);
                    const amtToSeller = usedItemInfo.price - amtToSubtractFromSeller;
                    // Create Seller Transaction
                    // Give Money
                    await trx.economy.addToUserBalance(usedItemInfo.userId, amtToSeller, model.economy.currencyType.primary);
                    // Create Transaction
                    await trx.economy.createTransaction(usedItemInfo.userId, userInfo.userId, amtToSeller, model.economy.currencyType.primary, model.economy.transactionType.SaleOfItem, "Sale of " + catalogItemInfo.catalogName, model.catalog.creatorType.User, model.catalog.creatorType.User, catalogItemInfo.catalogId, usedItemInfo.userInventoryId);
                    // Take Item Off Sale
                    await trx.user.editItemPrice(usedItemInfo.userInventoryId, 0);

                    // Additional Background Tasks

                    // Log IP
                    await trx.user.logUserIp(userInfo.userId, ipAddress, model.user.ipAddressActions.PurchaseOfItem);
                    // Grab RAP
                    const averagePrice = await trx.catalog.calculateAveragePrice(catalogItemInfo.catalogId, catalogItemInfo.averagePrice || 0, expectedPrice);
                    // Update RAP
                    await trx.catalog.setAveragePrice(catalogItemInfo.catalogId, averagePrice);

                    this.regenAvatarAfterItemTransferOwners(usedItemInfo.userId, usedItemInfo.catalogId).then(d => {
                        console.log(d);
                    }).catch(e => {
                        console.error(e);
                    })
                    // Return
                    return;
                }
            });

        } catch (e) {
            console.error(`${req.id} got error`, e);
            throw e;
        }
        return {success: true};
    }

    @Put('/trades/user/:userId/request')
    @Summary('Create a trade request')
    @Description('offerItems and requestedItems should both be arrays of userInventoryIds')
    @Returns(400, {
        type: model.Error,
        description: 'InvalidUserId: UserId is terminated or invalid\nInvalidItemsSpecified: One or more of the userInventoryId(s) are invalid\nPrimaryRequestTooLarge: Primary Currency Request is too large\nPrimaryOfferTooLarge: Primary Currency offer is too large\n'
    })
    @Returns(409, {
        type: model.Error,
        description: 'CannotTradeWithUser: Authenticated user has trading disabled or partner has trading disabled\nTooManyPendingTrades: You have too many pending trades with this user\nNotEnoughPrimaryCurrencyForOffer: User does not have enough currency for this offer\n'
    })
    @Returns(503, {type: model.Error, description: 'Unavailable: Feature is unavailable\n'})
    @Use(csrf, YesAuth, TwoStepMiddleware('TradeRequest'))
    public async createTradeRequest(
        @Req() req: Req,
        @Locals('userInfo') userInfo: model.UserSession,
        @Required()
        @Description('The userId to open a trade with')
        @PathParams('userId', Number) partnerUserId: number,
        @Required()
        @BodyParams(model.user.CreateTradeRequest) body: model.user.CreateTradeRequest,
    ) {
        if (!model.economy.trade.isEnabled) {
            throw new this.ServiceUnavailable('Unavailable');
        }
        const forUpdate = [
            'users',
            'trade_items',
            'trades',
        ]
        await this.transaction(this, forUpdate, async function (trx) {
            let offerPrimary = 0;
            if (body.offerPrimary) {
                offerPrimary = body.offerPrimary;
            }
            let requestPrimary = 0;
            if (body.requestPrimary) {
                requestPrimary = body.requestPrimary;
            }
            let requestedItems = body.requestedItems;
            let offerItems = body.offerItems;
            const partnerInfo = await trx.user.getInfo(partnerUserId, ['userId', 'accountStatus', 'tradingEnabled']);
            if (partnerInfo.accountStatus === model.user.accountStatus.deleted || partnerInfo.accountStatus === model.user.accountStatus.terminated) {
                throw new this.BadRequest('InvalidUserId');
            }
            // Check offer primary
            if (offerPrimary > userInfo.primaryBalance) {
                throw new this.Conflict('NotEnoughPrimaryCurrencyForOffer');
            }
            // Check total offer
            if (offerPrimary >= model.economy.trade.maxOfferPrimary) {
                throw new this.BadRequest('PrimaryOfferTooLarge');
            }
            if (requestPrimary >= model.economy.trade.maxRequestPrimary) {
                throw new this.BadRequest('PrimaryRequestTooLarge');
            }
            // Reset if non-0
            if (offerPrimary <= 0) {
                offerPrimary = 0;
            }
            if (requestPrimary <= 0) {
                requestPrimary = 0;
            }
            const localInfo = await trx.user.getInfo(userInfo.userId, ['tradingEnabled']);
            // Check if user has Trading Disabled
            if (localInfo.tradingEnabled === model.user.tradingEnabled.false) {
                throw new this.Conflict('CannotTradeWithUser');
            }
            // Check if Partner has Trading Disabled
            if (partnerInfo.tradingEnabled === model.user.tradingEnabled.false) {
                throw new this.Conflict('CannotTradeWithUser');
            }
            // If partner is current user
            if (partnerInfo.userId === userInfo.userId) {
                throw new this.Conflict('CannotTradeWithUser');
            }
            if (
                !Array.isArray(requestedItems) ||
                !Array.isArray(offerItems) ||
                offerItems.length < 1 ||
                offerItems.length > model.economy.trade.maxItemsPerSide ||
                requestedItems.length < 1 ||
                requestedItems.length > model.economy.trade.maxItemsPerSide
            ) {
                throw new this.BadRequest('InvalidItemsSpecified');
            }
            const safeRequestedItems: model.economy.TradeItemObject[] = [];
            // Check Items User is Requesting
            for (const unsafeInventoryId of requestedItems) {
                const userInventoryId = filterId(unsafeInventoryId) as number;
                if (!userInventoryId) {
                    throw new this.BadRequest('InvalidItemsSpecified');
                }
                // Verify item exists and is owned by partner
                const info = await trx.catalog.getItemByUserInventoryId(userInventoryId);
                if (info.userId !== partnerUserId) {
                    // Owned by someone else
                    throw new this.BadRequest('InvalidItemsSpecified');
                }
                if (info.collectible === model.catalog.collectible.false) {
                    // Not collectible
                    throw new this.BadRequest('InvalidItemsSpecified');
                }
                safeRequestedItems.push({
                    'catalogId': info.catalogId,
                    'userInventoryId': userInventoryId,
                });
            }
            const safeRequesteeItems: model.economy.TradeItemObject[] = [];
            // Check Items user is Providing
            for (const unsafeInventoryId of offerItems) {
                const userInventoryId = filterId(unsafeInventoryId) as number;
                if (!userInventoryId) {
                    throw new this.BadRequest('InvalidItemsSpecified');
                }
                // Verify item exists and is owned by authenticated user
                const info = await trx.catalog.getItemByUserInventoryId(userInventoryId);
                if (info.userId !== userInfo.userId) {
                    // Owned by someone else
                    throw new this.BadRequest('InvalidItemsSpecified');
                }
                if (info.collectible === model.catalog.collectible.false) {
                    // Not collectible
                    throw new this.BadRequest('InvalidItemsSpecified');
                }
                safeRequesteeItems.push({
                    'userInventoryId': userInventoryId,
                    'catalogId': info.catalogId,
                });
            }
            // Create Trade
            // Count outbound/inbound trades between users
            const count = await trx.economy.countPendingTradesBetweenUsers(userInfo.userId, partnerUserId);
            // Confirm they aren't spamming trades
            if (count >= 4) {
                throw new this.Conflict('TooManyPendingTrades');
            }
            // Create
            const tradeId = await trx.economy.createTrade(userInfo.userId, partnerUserId, offerPrimary, requestPrimary);
            // Add Requested Items
            await trx.economy.addItemsToTrade(tradeId, model.economy.tradeSides.Requested, safeRequestedItems);
            // Add Self Items
            await trx.economy.addItemsToTrade(tradeId, model.economy.tradeSides.Requester, safeRequesteeItems);
            // Send Message to Partner
            await trx.notification.createMessage(partnerUserId, 1, `Trade Request from ${userInfo.username}`, `Hi,
${userInfo.username} has sent you a new trade request. You can view it in the trades tab.`);
            // Log ip
            let ip = req.ip;
            if (req.headers['cf-connecting-ip']) {
                ip = req.headers['cf-connecting-ip'] as string;
            }
            await trx.user.logUserIp(userInfo.userId, ip, model.user.ipAddressActions.TradeSent);
        });
        // Return Success
        return {
            'success': true,
        };
    }

    @Get('/trades/:tradeId/items')
    @Summary('Get the items involved in a specific tradeId')
    @Description('Requestee is authenticated user, requested is the partner involved with the trade')
    @Returns(200, {type: model.economy.TradeItemsResponse})
    @Returns(400, {
        type: model.Error,
        description: 'InvalidTradeId: TradeId is invalid or you do not have permission to view it\n'
    })
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
            console.log(e);
            throw new this.BadRequest('InvalidTradeId');
        }
        if (tradeInfo.userIdOne === userInfo.userId) {
            const requestedTradeItems = await this.economy.getTradeItems(model.economy.tradeSides.Requested, numericTradeId);
            const requesteeTradeItems = await this.economy.getTradeItems(model.economy.tradeSides.Requester, numericTradeId);
            return {'requested': requestedTradeItems, 'offer': requesteeTradeItems};
        } else if (tradeInfo.userIdTwo === userInfo.userId) {
            const requestedTradeItems = await this.economy.getTradeItems(model.economy.tradeSides.Requester, numericTradeId);
            const requesteeTradeItems = await this.economy.getTradeItems(model.economy.tradeSides.Requested, numericTradeId);
            return {'requested': requestedTradeItems, 'offer': requesteeTradeItems};
        } else {
            throw new this.BadRequest('InvalidTradeId');
        }
    }

    @Delete('/trades/:tradeId')
    @Summary('Decline/cancel a trade by the tradeId')
    @Returns(400, {
        type: model.Error,
        description: 'InvalidTradeId: TradeId is invalid (Doesnt exist, already declined/state doesnt allow decling, does not involve user, etc)\n'
    })
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async declineTrade(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('tradeId', Number) numericTradeId: number
    ) {
        if (!model.economy.trade.isEnabled) {
            throw new this.ServiceUnavailable('Unavailable');
        }
        if (!numericTradeId) {
            throw new this.BadRequest('InvalidTradeId');
        }
        await this.transaction(this, [], async function (trx) {
            let tradeInfo = await trx.economy.getTradeById(numericTradeId);
            if (tradeInfo.status !== model.economy.tradeStatus.Pending) {
                throw new this.BadRequest('InvalidTradeId');
            }
            // Send Message
            if (tradeInfo.userIdTwo === userInfo.userId) {
                await trx.notification.createMessage(tradeInfo.userIdOne, 1, 'Trade Declined', 'Hello,\n' + userInfo.username + ' has declined your trade. You may view it in the Inactive tab of your trades.');
            }
            if (tradeInfo.userIdOne === userInfo.userId || tradeInfo.userIdTwo === userInfo.userId) {
                await trx.economy.declineTradeById(numericTradeId);
                return;
            } else {
                throw new this.BadRequest('InvalidTradeId');
            }
        });
        return {};
    }

    @Post('/trades/:tradeId')
    @Summary('Accept a trade')
    @Returns(400, {
        type: model.Error,
        description: 'InvalidTradeId: TradeId is invalid\nInvalidPartnerId: Trade cannot be completed due to an internal error\nNotAuthorized: User is not authorized to modify this trade (ex: didnt create the trade, already accepted, already declined, etc)'
    })
    @Returns(500, {
        type: model.Error,
        description: 'InternalServerError: Trade cannot be completed due to an internal error\n'
    })
    @Returns(409, {
        type: model.Error,
        description: 'OneOrMoreItemsNotAvailable: One or more of the items involved in the trade are no longer available\nCooldown: Try again later\nTradeCannotBeCompleted: Generic error is preventing trade from being completed.\n'
    })
    @Use(csrf, YesAuth)
    public async acceptTrade(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('tradeId', Number) numericTradeId: number
    ) {
        if (!model.economy.trade.isEnabled) {
            throw new this.ServiceUnavailable('Unavailable');
        }
        if (!numericTradeId) {
            throw new this.BadRequest('InvalidTradeId');
        }
        /**
         * Array of tables that will be updated or otherwise modified once this method is called.
         */
        const forUpdate = [
            'users',
            'trades',
            'user_inventory',
        ];
        await this.transaction(this, forUpdate, async function (trx) {
            let tradeInfo: model.economy.ExtendedTradeInfo;
            try {
                tradeInfo = await trx.economy.getTradeById(numericTradeId);
            } catch (e) {
                throw new this.BadRequest('InvalidTradeId');
            }
            if (tradeInfo.status !== model.economy.tradeStatus.Pending) {
                throw new this.BadRequest('InvalidTradeId');
            }
            // Continue
            if (tradeInfo.userIdTwo !== userInfo.userId) {
                throw new this.BadRequest('NotAuthorized');
            }
            // Verify Partner isn't terminated
            let partnerInfo = await trx.user.getInfo(tradeInfo.userIdOne, ['accountStatus']);
            if (partnerInfo.accountStatus === model.user.accountStatus.deleted || partnerInfo.accountStatus === model.user.accountStatus.terminated) {
                // Unlock economy
                throw new this.BadRequest('InvalidPartnerId');
            }
            // requestedTradeItems = items authenticated user will receive
            const requestedTradeItems = await trx.economy.getTradeItems(model.economy.tradeSides.Requester, numericTradeId);
            if (requestedTradeItems.length < 1) {
                // Throw error
                throw new Error('NotEnoughItemsInRequested');
            }
            // requesteeTradeItems = items authenticated user will give
            const requesteeTradeItems = await trx.economy.getTradeItems(model.economy.tradeSides.Requested, numericTradeId);
            if (requesteeTradeItems.length < 1) {
                // Throw error
                throw new Error('NotEnoughItemsInRequestee');
            }
            // Verify Ownership of Items
            const verifyOwnershipOfItems = async (userId: number, items: model.economy.TradeItems[]): Promise<void> => {
                for (const item of items) {
                    let currentOwner = await trx.catalog.getItemByUserInventoryId(item["userInventoryId"]);
                    if (currentOwner.userId !== userId) {
                        console.log(currentOwner.userId);
                        console.log(userId);
                        throw new this.Conflict('OneOrMoreItemsNotAvailable');
                    }
                }
            }
            // Swap item owners
            const swapOwnersOfItems = async (userId: number, items: model.economy.TradeItems[]): Promise<void> => {
                for (const item of items) {
                    await trx.catalog.updateUserInventoryIdOwner(item["userInventoryId"], userId);
                    await trx.user.editItemPrice(item["userInventoryId"], 0);
                }
            }

            // Validate Owners
            await verifyOwnershipOfItems(tradeInfo.userIdOne, requestedTradeItems);
            await verifyOwnershipOfItems(tradeInfo.userIdTwo, requesteeTradeItems);
            // If there is offer currency, swap it
            const currencyToSubtractFromUserOne = tradeInfo.userIdOnePrimary;
            if (currencyToSubtractFromUserOne) {
                let userOneCurrentBalance = await trx.user.getInfo(tradeInfo.userIdOne, ['primaryBalance']);
                if (!(userOneCurrentBalance.primaryBalance >= currencyToSubtractFromUserOne)) {
                    throw new this.Conflict('TradeCannotBeCompleted');
                }
                // subtract from userone balance
                await trx.economy.subtractFromUserBalanceV2(tradeInfo.userIdOne, currencyToSubtractFromUserOne, model.economy.currencyType.primary);
                // add to usertwo balance
                await trx.economy.addToUserBalanceV2(tradeInfo.userIdTwo, currencyToSubtractFromUserOne, model.economy.currencyType.primary);
            }
            // If there is request currency, swap it
            const currencyToSubtractFromUserTwo = tradeInfo.userIdTwoPrimary;
            if (currencyToSubtractFromUserTwo) {
                let userTwoCurrentBalance = await trx.user.getInfo(tradeInfo.userIdTwo, ['primaryBalance']);
                if (!(userTwoCurrentBalance.primaryBalance >= currencyToSubtractFromUserTwo)) {
                    throw new this.Conflict('TradeCannotBeCompleted');
                }
                // subtract from usertwo balance
                await trx.economy.subtractFromUserBalanceV2(tradeInfo.userIdTwo, currencyToSubtractFromUserTwo, model.economy.currencyType.primary);
                // add to userone balance
                await trx.economy.addToUserBalanceV2(tradeInfo.userIdOne, currencyToSubtractFromUserTwo, model.economy.currencyType.primary);
            }

            // Swap Owners
            await swapOwnersOfItems(tradeInfo.userIdTwo, requestedTradeItems);
            await swapOwnersOfItems(tradeInfo.userIdOne, requesteeTradeItems);

            // Update trade status
            await trx.economy.markTradeAccepted(numericTradeId);
            // Startup background task
            const renderAvatarAndSendNotification = async () => {
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
                    await this.regenAvatarAfterItemTransferOwners(tradeInfo.userIdOne, itemIdsOne);
                    await this.regenAvatarAfterItemTransferOwners(tradeInfo.userIdTwo, itemIdsTwo);
                } catch (e) {
                    console.log(e);
                }
            };
            // Send Success Message
            const s = requestedTradeItems.length > 1 ? 's' : '';
            await trx.notification.createMessage(tradeInfo.userIdOne, 1, 'Trade Accepted', 'Hello,\n' + userInfo.username + ' has accepted your trade. You can view your new item' + s + ' in your inventory.');
            renderAvatarAndSendNotification().then().catch(e => {
                console.error(e);
            })
            // Success!
            // Dont return anything.
            return;
        });
        return {};
    }
}
