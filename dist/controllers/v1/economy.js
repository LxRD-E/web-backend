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
const Auth_1 = require("../../middleware/Auth");
const auth_1 = require("../../dal/auth");
const controller_1 = require("../controller");
const common_1 = require("@tsed/common");
const swagger_1 = require("@tsed/swagger");
const TwoStepCheck_1 = require("../../middleware/TwoStepCheck");
const TwoStepCheck_2 = require("../../middleware/TwoStepCheck");
const Filter_1 = require("../../helpers/Filter");
let EconomyController = class EconomyController extends controller_1.default {
    constructor() {
        super();
    }
    getResellFeeCollectible() {
        return {
            fee: model.economy.RESELL_ITEM_FEE,
        };
    }
    getSellFee() {
        return {
            fee: model.economy.SELL_ITEM_FEE,
        };
    }
    getCurrencyConversionMetadata() {
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
        };
    }
    getTradeMetadata() {
        return model.economy.trade;
    }
    async getTrades(userInfo, tradeType, offset = 0) {
        let tradeValue;
        if (tradeType !== 'inbound' && tradeType !== 'outbound' && tradeType !== 'completed' && tradeType !== 'inactive') {
            throw new this.BadRequest('InvalidTradeType');
        }
        else {
            tradeValue = tradeType;
        }
        return await this.economy.getTrades(userInfo.userId, tradeValue, offset);
    }
    async regenAvatarAfterItemTransferOwners(userId, catalogId) {
        let wearing;
        if (typeof catalogId === "number") {
            wearing = await this.user.wearingItem(userId, catalogId);
        }
        else {
            for (const id of catalogId) {
                const isWearingCurrentId = await this.user.wearingItem(userId, id);
                if (isWearingCurrentId) {
                    wearing = true;
                }
            }
        }
        if (wearing) {
            if (typeof catalogId === "number") {
                await this.avatar.deleteAvatarCatalogId(userId, catalogId);
            }
            else {
                for (const id of catalogId) {
                    await this.avatar.deleteAvatarCatalogId(userId, id);
                }
            }
            const avatar = await this.user.getAvatar(userId);
            const avatarColors = await this.user.getAvatarColors(userId);
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
    async getTransactions(userInfo, offset = 0) {
        return await this.economy.getUserTransactions(userInfo.userId, offset);
    }
    async getGroupTransactions(userInfo, groupId, offset = 0) {
        let data;
        try {
            data = await this.group.getUserRole(groupId, userInfo.userId);
        }
        catch {
            throw new this.BadRequest('InvalidGroupId');
        }
        if (data.permissions.manage !== 1) {
            throw new this.Conflict('InvalidPermissions');
        }
        const transactions = await this.economy.getGroupTransactions(groupId, offset);
        return transactions;
    }
    async convertCurrency(userInfo, originCurrency, numericAmount) {
        try {
            await this.economy.lockUserEconomy(userInfo.userId);
        }
        catch (e) {
            console.error(e);
            throw new this.Conflict('Cooldown');
        }
        const unlockEconomy = async () => {
            await this.economy.unlockUserEconomy(userInfo.userId);
        };
        let maxCurrency = 0;
        let minCurrency = 0;
        if (originCurrency === model.economy.currencyType.primary) {
            maxCurrency = model.economy.CONVERSION_PRIMARY_TO_SECONDARY_MAX;
            minCurrency = model.economy.MINIMUM_CURRENCY_CONVERSION_PRIMARY_TO_SECONDARY;
        }
        else if (originCurrency === model.economy.currencyType.secondary) {
            maxCurrency = model.economy.CONVERSION_SECONDARY_TO_PRIMARY_MAX;
            minCurrency = model.economy.MINIMUM_CURRENCY_CONVERSION_SECONDARY_TO_PRIMARY;
        }
        if (numericAmount > maxCurrency || maxCurrency < minCurrency) {
            await unlockEconomy();
            throw new this.BadRequest('InvalidAmount');
        }
        if (originCurrency === model.economy.currencyType.primary) {
            if (numericAmount < 0) {
                await unlockEconomy();
                throw new this.BadRequest('InvalidAmount');
            }
            const newAmount = await this.economy.convertCurrency(numericAmount, model.economy.currencyType.secondary);
            if (userInfo.primaryBalance < numericAmount) {
                await unlockEconomy();
                throw new this.BadRequest('NotEnoughCurrency');
            }
            try {
                await this.economy.subtractFromUserBalance(userInfo.userId, numericAmount, model.economy.currencyType.primary);
            }
            catch (e) {
                if (e === model.economy.userBalanceErrors.NotEnoughCurrency) {
                    await unlockEconomy();
                    throw new this.BadRequest('NotEnoughCurrency');
                }
                await this.economy.addToUserBalance(userInfo.userId, numericAmount, model.economy.currencyType.primary);
                await unlockEconomy();
                throw e;
            }
            try {
                await this.economy.addToUserBalance(userInfo.userId, newAmount, model.economy.currencyType.secondary);
            }
            catch (e) {
                await this.economy.addToUserBalance(userInfo.userId, numericAmount, model.economy.currencyType.primary);
                await unlockEconomy();
                throw e;
            }
            await this.economy.createTransaction(userInfo.userId, userInfo.userId, -numericAmount, model.economy.currencyType.primary, model.economy.transactionType.CurrencyConversionOfPrimaryToSecondary, "Currency Conversion", model.catalog.creatorType.User, model.catalog.creatorType.User);
            await this.economy.createTransaction(userInfo.userId, userInfo.userId, newAmount, model.economy.currencyType.secondary, model.economy.transactionType.CurrencyConversionOfPrimaryToSecondary, "Currency Conversion", model.catalog.creatorType.User, model.catalog.creatorType.User);
            await unlockEconomy();
            return { success: true };
        }
        else if (originCurrency === model.economy.currencyType.secondary) {
            if (numericAmount < 10) {
                await unlockEconomy();
                throw new this.BadRequest('InvalidAmount');
            }
            if (numericAmount % 10 === 0) {
                const newAmount = await this.economy.convertCurrency(numericAmount, model.economy.currencyType.primary);
                if (userInfo.secondaryBalance < numericAmount) {
                    await unlockEconomy();
                    throw new this.BadRequest('NotEnoughCurrency');
                }
                try {
                    await this.economy.subtractFromUserBalance(userInfo.userId, numericAmount, model.economy.currencyType.secondary);
                }
                catch (e) {
                    if (e === model.economy.userBalanceErrors.NotEnoughCurrency) {
                        await unlockEconomy();
                        throw new this.BadRequest('NotEnoughCurrency');
                    }
                    await this.economy.addToUserBalance(userInfo.userId, numericAmount, model.economy.currencyType.secondary);
                    await unlockEconomy();
                    throw e;
                }
                try {
                    await this.economy.addToUserBalance(userInfo.userId, newAmount, model.economy.currencyType.primary);
                }
                catch (e) {
                    await this.economy.addToUserBalance(userInfo.userId, numericAmount, model.economy.currencyType.secondary);
                    await unlockEconomy();
                    throw e;
                }
                await this.economy.createTransaction(userInfo.userId, userInfo.userId, -numericAmount, model.economy.currencyType.secondary, model.economy.transactionType.CurrencyConversionOfSecondaryToPrimary, "Currency Conversion", model.catalog.creatorType.User, model.catalog.creatorType.User);
                await this.economy.createTransaction(userInfo.userId, userInfo.userId, newAmount, model.economy.currencyType.primary, model.economy.transactionType.CurrencyConversionOfSecondaryToPrimary, "Currency Conversion", model.catalog.creatorType.User, model.catalog.creatorType.User);
                await unlockEconomy();
                return { success: true };
            }
            else {
                await unlockEconomy();
                throw new this.BadRequest('NotEnoughCurrency');
            }
        }
        else {
            await unlockEconomy();
            throw new this.BadRequest('InvalidCurrency');
        }
    }
    async buy(userInfo, catalogIdStr, userInventoryIdStr, sellerUserIdStr, expectedPriceStr, expectedCurrencyStr, req) {
        console.log(`${req.id} start buy()`);
        let ipAddress = req.ip;
        if (req.headers['cf-connecting-ip']) {
            ipAddress = req.headers['cf-connecting-ip'];
        }
        const catalogId = parseInt(catalogIdStr);
        const userInventoryId = parseInt(userInventoryIdStr);
        const sellerUserId = parseInt(sellerUserIdStr);
        const expectedPrice = parseInt(expectedPriceStr);
        const expectedCurrency = parseInt(expectedCurrencyStr);
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
                    let catalogItemInfo;
                    try {
                        catalogItemInfo = await trx.catalog.getInfo(catalogId, ['catalogId', 'forSale', 'creatorId', 'creatorType', 'price', 'currency', 'maxSales', 'collectible', 'catalogName']);
                    }
                    catch (e) {
                        throw new this.BadRequest('InvalidCatalogId');
                    }
                    if (catalogItemInfo.forSale === model.catalog.isForSale.false) {
                        throw new this.BadRequest('NoLongerForSale');
                    }
                    if (catalogItemInfo.creatorId !== sellerUserId) {
                        throw new this.BadRequest('SellerHasChanged');
                    }
                    if (catalogItemInfo.price !== expectedPrice) {
                        throw new this.BadRequest('PriceHasChanged');
                    }
                    if (catalogItemInfo.currency !== expectedCurrency) {
                        throw new this.BadRequest('CurrencyHasChanged');
                    }
                    let serial = null;
                    if (catalogItemInfo.collectible === model.catalog.collectible.true && catalogItemInfo.maxSales !== 0) {
                        const sales = await trx.catalog.countSales(catalogItemInfo.catalogId);
                        if (sales >= catalogItemInfo.maxSales) {
                            await trx.catalog.updateIsForSale(catalogItemInfo.catalogId, model.catalog.isForSale.false);
                            throw new this.BadRequest('NoLongerForSale');
                        }
                        else {
                            serial = sales + 1;
                            if (serial >= catalogItemInfo.maxSales) {
                                await trx.catalog.updateIsForSale(catalogItemInfo.catalogId, model.catalog.isForSale.false);
                            }
                        }
                    }
                    let owns = await trx.user.getUserInventoryByCatalogId(userInfo.userId, catalogItemInfo.catalogId);
                    if (owns[0]) {
                        throw new this.Conflict('AlreadyOwns');
                    }
                    const newUserInfo = await trx.user.getInfo(userInfo.userId, ['primaryBalance', 'secondaryBalance']);
                    if (catalogItemInfo.currency === model.economy.currencyType.primary) {
                        const balance = newUserInfo.primaryBalance;
                        if (catalogItemInfo.price > balance) {
                            throw new this.BadRequest('NotEnoughCurrency');
                        }
                    }
                    else if (catalogItemInfo.currency === model.economy.currencyType.secondary) {
                        const balance = newUserInfo.secondaryBalance;
                        if (catalogItemInfo.price > balance) {
                            throw new this.BadRequest('NotEnoughCurrency');
                        }
                    }
                    else {
                        throw new this.BadRequest('InvalidCurrencySpecified');
                    }
                    let inventoryId = await trx.catalog.createItemForUserInventory(userInfo.userId, catalogItemInfo.catalogId, serial);
                    const amtToSubtractFromSeller = Math.abs(catalogItemInfo.price * 0.3);
                    const amtToSeller = catalogItemInfo.price - amtToSubtractFromSeller;
                    let transactionIdForBuyer = 0;
                    let transactionIdForSeller = 0;
                    await trx.economy.subtractFromUserBalance(userInfo.userId, catalogItemInfo.price, catalogItemInfo.currency);
                    if (catalogItemInfo.creatorType === model.catalog.creatorType.User) {
                        transactionIdForSeller = await trx.economy.createTransaction(userInfo.userId, catalogItemInfo.creatorId, -catalogItemInfo.price, catalogItemInfo.currency, model.economy.transactionType.PurchaseOfItem, "Purchase of " + catalogItemInfo.catalogName, model.catalog.creatorType.User, model.catalog.creatorType.User, catalogItemInfo.catalogId, inventoryId);
                    }
                    else {
                        transactionIdForSeller = await trx.economy.createTransaction(userInfo.userId, catalogItemInfo.creatorId, -catalogItemInfo.price, catalogItemInfo.currency, model.economy.transactionType.PurchaseOfItem, "Purchase of " + catalogItemInfo.catalogName, model.catalog.creatorType.Group, model.catalog.creatorType.User, catalogItemInfo.catalogId, inventoryId);
                    }
                    if (catalogItemInfo.creatorType === model.catalog.creatorType.User) {
                        await trx.economy.addToUserBalance(catalogItemInfo.creatorId, amtToSeller, catalogItemInfo.currency);
                        transactionIdForBuyer = await trx.economy.createTransaction(catalogItemInfo.creatorId, userInfo.userId, amtToSeller, catalogItemInfo.currency, model.economy.transactionType.SaleOfItem, "Sale of " + catalogItemInfo.catalogName, model.catalog.creatorType.User, model.catalog.creatorType.User, catalogItemInfo.catalogId, inventoryId);
                    }
                    else if (catalogItemInfo.creatorType === model.catalog.creatorType.Group) {
                        await trx.economy.addToGroupBalance(catalogItemInfo.creatorId, amtToSeller, catalogItemInfo.currency);
                        transactionIdForBuyer = await trx.economy.createTransaction(catalogItemInfo.creatorId, userInfo.userId, amtToSeller, catalogItemInfo.currency, model.economy.transactionType.SaleOfItem, "Sale of " + catalogItemInfo.catalogName, model.catalog.creatorType.User, model.catalog.creatorType.Group, catalogItemInfo.catalogId, inventoryId);
                    }
                    console.log(`${req.id} gave money to seller. now log ip`);
                    await trx.user.logUserIp(userInfo.userId, ipAddress, model.user.ipAddressActions.PurchaseOfItem);
                    return { success: true };
                }
                else {
                    let catalogItemInfo;
                    try {
                        catalogItemInfo = await trx.catalog.getInfo(catalogId, ['catalogId', 'forSale', 'maxSales', 'collectible', 'catalogName', 'averagePrice']);
                    }
                    catch (e) {
                        throw new this.BadRequest('InvalidCatalogId');
                    }
                    if (catalogItemInfo.forSale === model.catalog.isForSale.true) {
                        throw new this.BadRequest('ItemStillForSale');
                    }
                    if (expectedCurrency !== model.economy.currencyType.primary) {
                        throw new this.BadRequest('InvalidCurrency');
                    }
                    let usedItemInfo;
                    try {
                        usedItemInfo = await trx.catalog.getItemByUserInventoryId(userInventoryId);
                    }
                    catch (e) {
                        throw new this.BadRequest('InvalidUserInventoryId');
                    }
                    if (usedItemInfo.price !== expectedPrice) {
                        throw new this.BadRequest('PriceHasChanged');
                    }
                    if (usedItemInfo.userId !== sellerUserId) {
                        throw new this.BadRequest('SellerHasChanged');
                    }
                    if (usedItemInfo.catalogId !== catalogItemInfo.catalogId) {
                        throw new this.BadRequest('InvalidCatalogId');
                    }
                    if (usedItemInfo.price <= 0) {
                        throw new this.BadRequest('ItemNoLongerForSale');
                    }
                    if (usedItemInfo.userId === userInfo.userId) {
                        throw new this.BadRequest('InvalidUserId');
                    }
                    let sellerInfo;
                    try {
                        sellerInfo = await trx.user.getInfo(usedItemInfo.userId, undefined);
                        if (sellerInfo.accountStatus === model.user.accountStatus.deleted || sellerInfo.accountStatus === model.user.accountStatus.terminated) {
                            throw new Error('ItemNoLongerForSale');
                        }
                    }
                    catch (e) {
                        await trx.user.editItemPrice(userInventoryId, 0);
                        throw new this.BadRequest('ItemNoLongerForSale');
                    }
                    const balance = userInfo.primaryBalance;
                    if (usedItemInfo.price > balance) {
                        throw new this.BadRequest('NotEnoughCurrency');
                    }
                    await trx.catalog.updateUserInventoryIdOwner(usedItemInfo.userInventoryId, userInfo.userId);
                    await trx.economy.subtractFromUserBalance(userInfo.userId, usedItemInfo.price, model.economy.currencyType.primary);
                    await trx.economy.createTransaction(userInfo.userId, usedItemInfo.userId, -usedItemInfo.price, model.economy.currencyType.primary, model.economy.transactionType.PurchaseOfItem, "Purchase of " + catalogItemInfo.catalogName, model.catalog.creatorType.User, model.catalog.creatorType.User, catalogItemInfo.catalogId, usedItemInfo.userInventoryId);
                    const amtToSubtractFromSeller = Math.abs(usedItemInfo.price * 0.3);
                    const amtToSeller = usedItemInfo.price - amtToSubtractFromSeller;
                    await trx.economy.addToUserBalance(usedItemInfo.userId, amtToSeller, model.economy.currencyType.primary);
                    await trx.economy.createTransaction(usedItemInfo.userId, userInfo.userId, amtToSeller, model.economy.currencyType.primary, model.economy.transactionType.SaleOfItem, "Sale of " + catalogItemInfo.catalogName, model.catalog.creatorType.User, model.catalog.creatorType.User, catalogItemInfo.catalogId, usedItemInfo.userInventoryId);
                    await trx.user.editItemPrice(usedItemInfo.userInventoryId, 0);
                    await trx.user.logUserIp(userInfo.userId, ipAddress, model.user.ipAddressActions.PurchaseOfItem);
                    const averagePrice = await trx.catalog.calculateAveragePrice(catalogItemInfo.catalogId, catalogItemInfo.averagePrice || 0, expectedPrice);
                    await trx.catalog.setAveragePrice(catalogItemInfo.catalogId, averagePrice);
                    this.regenAvatarAfterItemTransferOwners(usedItemInfo.userId, usedItemInfo.catalogId).then(d => {
                        console.log(d);
                    }).catch(e => {
                        console.error(e);
                    });
                    return;
                }
            });
        }
        catch (e) {
            console.error(`${req.id} got error`, e);
            throw e;
        }
        return { success: true };
    }
    async createTradeRequest(req, userInfo, partnerUserId, body) {
        if (!model.economy.trade.isEnabled) {
            throw new this.ServiceUnavailable('Unavailable');
        }
        const forUpdate = [
            'users',
            'trade_items',
            'trades',
        ];
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
            if (offerPrimary > userInfo.primaryBalance) {
                throw new this.Conflict('NotEnoughPrimaryCurrencyForOffer');
            }
            if (offerPrimary >= model.economy.trade.maxOfferPrimary) {
                throw new this.BadRequest('PrimaryOfferTooLarge');
            }
            if (requestPrimary >= model.economy.trade.maxRequestPrimary) {
                throw new this.BadRequest('PrimaryRequestTooLarge');
            }
            if (offerPrimary <= 0) {
                offerPrimary = 0;
            }
            if (requestPrimary <= 0) {
                requestPrimary = 0;
            }
            const localInfo = await trx.user.getInfo(userInfo.userId, ['tradingEnabled']);
            if (localInfo.tradingEnabled === model.user.tradingEnabled.false) {
                throw new this.Conflict('CannotTradeWithUser');
            }
            if (partnerInfo.tradingEnabled === model.user.tradingEnabled.false) {
                throw new this.Conflict('CannotTradeWithUser');
            }
            if (partnerInfo.userId === userInfo.userId) {
                throw new this.Conflict('CannotTradeWithUser');
            }
            if (!Array.isArray(requestedItems) ||
                !Array.isArray(offerItems) ||
                offerItems.length < 1 ||
                offerItems.length > model.economy.trade.maxItemsPerSide ||
                requestedItems.length < 1 ||
                requestedItems.length > model.economy.trade.maxItemsPerSide) {
                throw new this.BadRequest('InvalidItemsSpecified');
            }
            const safeRequestedItems = [];
            for (const unsafeInventoryId of requestedItems) {
                const userInventoryId = Filter_1.filterId(unsafeInventoryId);
                if (!userInventoryId) {
                    throw new this.BadRequest('InvalidItemsSpecified');
                }
                const info = await trx.catalog.getItemByUserInventoryId(userInventoryId);
                if (info.userId !== partnerUserId) {
                    throw new this.BadRequest('InvalidItemsSpecified');
                }
                if (info.collectible === model.catalog.collectible.false) {
                    throw new this.BadRequest('InvalidItemsSpecified');
                }
                safeRequestedItems.push({
                    'catalogId': info.catalogId,
                    'userInventoryId': userInventoryId,
                });
            }
            const safeRequesteeItems = [];
            for (const unsafeInventoryId of offerItems) {
                const userInventoryId = Filter_1.filterId(unsafeInventoryId);
                if (!userInventoryId) {
                    throw new this.BadRequest('InvalidItemsSpecified');
                }
                const info = await trx.catalog.getItemByUserInventoryId(userInventoryId);
                if (info.userId !== userInfo.userId) {
                    throw new this.BadRequest('InvalidItemsSpecified');
                }
                if (info.collectible === model.catalog.collectible.false) {
                    throw new this.BadRequest('InvalidItemsSpecified');
                }
                safeRequesteeItems.push({
                    'userInventoryId': userInventoryId,
                    'catalogId': info.catalogId,
                });
            }
            const count = await trx.economy.countPendingTradesBetweenUsers(userInfo.userId, partnerUserId);
            if (count >= 4) {
                throw new this.Conflict('TooManyPendingTrades');
            }
            const tradeId = await trx.economy.createTrade(userInfo.userId, partnerUserId, offerPrimary, requestPrimary);
            await trx.economy.addItemsToTrade(tradeId, model.economy.tradeSides.Requested, safeRequestedItems);
            await trx.economy.addItemsToTrade(tradeId, model.economy.tradeSides.Requester, safeRequesteeItems);
            await trx.notification.createMessage(partnerUserId, 1, `Trade Request from ${userInfo.username}`, `Hi,
${userInfo.username} has sent you a new trade request. You can view it in the trades tab.`);
            let ip = req.ip;
            if (req.headers['cf-connecting-ip']) {
                ip = req.headers['cf-connecting-ip'];
            }
            await trx.user.logUserIp(userInfo.userId, ip, model.user.ipAddressActions.TradeSent);
        });
        return {
            'success': true,
        };
    }
    async getTradeItems(userInfo, numericTradeId) {
        if (!numericTradeId) {
            throw new this.BadRequest('InvalidTradeId');
        }
        let tradeInfo;
        try {
            tradeInfo = await this.economy.getTradeById(numericTradeId);
        }
        catch (e) {
            console.log(e);
            throw new this.BadRequest('InvalidTradeId');
        }
        if (tradeInfo.userIdOne === userInfo.userId) {
            const requestedTradeItems = await this.economy.getTradeItems(model.economy.tradeSides.Requested, numericTradeId);
            const requesteeTradeItems = await this.economy.getTradeItems(model.economy.tradeSides.Requester, numericTradeId);
            return { 'requested': requestedTradeItems, 'offer': requesteeTradeItems };
        }
        else if (tradeInfo.userIdTwo === userInfo.userId) {
            const requestedTradeItems = await this.economy.getTradeItems(model.economy.tradeSides.Requester, numericTradeId);
            const requesteeTradeItems = await this.economy.getTradeItems(model.economy.tradeSides.Requested, numericTradeId);
            return { 'requested': requestedTradeItems, 'offer': requesteeTradeItems };
        }
        else {
            throw new this.BadRequest('InvalidTradeId');
        }
    }
    async declineTrade(userInfo, numericTradeId) {
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
            if (tradeInfo.userIdTwo === userInfo.userId) {
                await trx.notification.createMessage(tradeInfo.userIdOne, 1, 'Trade Declined', 'Hello,\n' + userInfo.username + ' has declined your trade. You may view it in the Inactive tab of your trades.');
            }
            if (tradeInfo.userIdOne === userInfo.userId || tradeInfo.userIdTwo === userInfo.userId) {
                await trx.economy.declineTradeById(numericTradeId);
                return;
            }
            else {
                throw new this.BadRequest('InvalidTradeId');
            }
        });
        return {};
    }
    async acceptTrade(userInfo, numericTradeId) {
        if (!model.economy.trade.isEnabled) {
            throw new this.ServiceUnavailable('Unavailable');
        }
        if (!numericTradeId) {
            throw new this.BadRequest('InvalidTradeId');
        }
        const forUpdate = [
            'users',
            'trades',
            'user_inventory',
        ];
        await this.transaction(this, forUpdate, async function (trx) {
            let tradeInfo;
            try {
                tradeInfo = await trx.economy.getTradeById(numericTradeId);
            }
            catch (e) {
                throw new this.BadRequest('InvalidTradeId');
            }
            if (tradeInfo.status !== model.economy.tradeStatus.Pending) {
                throw new this.BadRequest('InvalidTradeId');
            }
            if (tradeInfo.userIdTwo !== userInfo.userId) {
                throw new this.BadRequest('NotAuthorized');
            }
            let partnerInfo = await trx.user.getInfo(tradeInfo.userIdOne, ['accountStatus']);
            if (partnerInfo.accountStatus === model.user.accountStatus.deleted || partnerInfo.accountStatus === model.user.accountStatus.terminated) {
                throw new this.BadRequest('InvalidPartnerId');
            }
            const requestedTradeItems = await trx.economy.getTradeItems(model.economy.tradeSides.Requester, numericTradeId);
            if (requestedTradeItems.length < 1) {
                throw new Error('NotEnoughItemsInRequested');
            }
            const requesteeTradeItems = await trx.economy.getTradeItems(model.economy.tradeSides.Requested, numericTradeId);
            if (requesteeTradeItems.length < 1) {
                throw new Error('NotEnoughItemsInRequestee');
            }
            const verifyOwnershipOfItems = async (userId, items) => {
                for (const item of items) {
                    let currentOwner = await trx.catalog.getItemByUserInventoryId(item["userInventoryId"]);
                    if (currentOwner.userId !== userId) {
                        console.log(currentOwner.userId);
                        console.log(userId);
                        throw new this.Conflict('OneOrMoreItemsNotAvailable');
                    }
                }
            };
            const swapOwnersOfItems = async (userId, items) => {
                for (const item of items) {
                    await trx.catalog.updateUserInventoryIdOwner(item["userInventoryId"], userId);
                    await trx.user.editItemPrice(item["userInventoryId"], 0);
                }
            };
            await verifyOwnershipOfItems(tradeInfo.userIdOne, requestedTradeItems);
            await verifyOwnershipOfItems(tradeInfo.userIdTwo, requesteeTradeItems);
            const currencyToSubtractFromUserOne = tradeInfo.userIdOnePrimary;
            if (currencyToSubtractFromUserOne) {
                let userOneCurrentBalance = await trx.user.getInfo(tradeInfo.userIdOne, ['primaryBalance']);
                if (!(userOneCurrentBalance.primaryBalance >= currencyToSubtractFromUserOne)) {
                    throw new this.Conflict('TradeCannotBeCompleted');
                }
                await trx.economy.subtractFromUserBalanceV2(tradeInfo.userIdOne, currencyToSubtractFromUserOne, model.economy.currencyType.primary);
                await trx.economy.addToUserBalanceV2(tradeInfo.userIdTwo, currencyToSubtractFromUserOne, model.economy.currencyType.primary);
            }
            const currencyToSubtractFromUserTwo = tradeInfo.userIdTwoPrimary;
            if (currencyToSubtractFromUserTwo) {
                let userTwoCurrentBalance = await trx.user.getInfo(tradeInfo.userIdTwo, ['primaryBalance']);
                if (!(userTwoCurrentBalance.primaryBalance >= currencyToSubtractFromUserTwo)) {
                    throw new this.Conflict('TradeCannotBeCompleted');
                }
                await trx.economy.subtractFromUserBalanceV2(tradeInfo.userIdTwo, currencyToSubtractFromUserTwo, model.economy.currencyType.primary);
                await trx.economy.addToUserBalanceV2(tradeInfo.userIdOne, currencyToSubtractFromUserTwo, model.economy.currencyType.primary);
            }
            await swapOwnersOfItems(tradeInfo.userIdTwo, requestedTradeItems);
            await swapOwnersOfItems(tradeInfo.userIdOne, requesteeTradeItems);
            await trx.economy.markTradeAccepted(numericTradeId);
            const renderAvatarAndSendNotification = async () => {
                try {
                    const itemIdsOne = [];
                    for (const item of requestedTradeItems) {
                        itemIdsOne.push(item.catalogId);
                    }
                    const itemIdsTwo = [];
                    for (const item of requesteeTradeItems) {
                        itemIdsTwo.push(item.catalogId);
                    }
                    await this.regenAvatarAfterItemTransferOwners(tradeInfo.userIdOne, itemIdsOne);
                    await this.regenAvatarAfterItemTransferOwners(tradeInfo.userIdTwo, itemIdsTwo);
                }
                catch (e) {
                    console.log(e);
                }
            };
            const s = requestedTradeItems.length > 1 ? 's' : '';
            await trx.notification.createMessage(tradeInfo.userIdOne, 1, 'Trade Accepted', 'Hello,\n' + userInfo.username + ' has accepted your trade. You can view your new item' + s + ' in your inventory.');
            renderAvatarAndSendNotification().then().catch(e => {
                console.error(e);
            });
            return;
        });
        return {};
    }
};
__decorate([
    common_1.Get('/metadata/collectible-resale-fee'),
    swagger_1.Summary('Get item resale fee percentage for collectibles'),
    swagger_1.Returns(200, { type: model.economy.FeeMetaData }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EconomyController.prototype, "getResellFeeCollectible", null);
__decorate([
    common_1.Get('/metadata/sell-fee'),
    swagger_1.Summary('Get item resale fee percentage for normal items (shirts, pants, etc)'),
    swagger_1.Returns(200, { type: model.economy.FeeMetaData }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EconomyController.prototype, "getSellFee", null);
__decorate([
    common_1.Get('/metadata/currency-conversion-rate'),
    swagger_1.Summary('Get currency conversion metadata'),
    swagger_1.Returns(200, { type: model.economy.CurrencyConversionMetadata }),
    common_1.Use(Auth_1.YesAuth),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EconomyController.prototype, "getCurrencyConversionMetadata", null);
__decorate([
    common_1.Get('/trades/metadata'),
    swagger_1.Summary('Trading metadata'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EconomyController.prototype, "getTradeMetadata", null);
__decorate([
    common_1.Get('/trades/:type'),
    swagger_1.Summary('Get user trades'),
    swagger_1.ReturnsArray(200, { type: model.economy.TradeInfo }),
    swagger_1.Returns(400, {
        type: model.Error,
        description: 'InvalidTradeType: TradeType must be one of: inbound,outbound,completed,inactive\n'
    }),
    common_1.Use(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('type', String)),
    __param(2, common_1.QueryParams('offset', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, String, Number]),
    __metadata("design:returntype", Promise)
], EconomyController.prototype, "getTrades", null);
__decorate([
    common_1.Get('/transactions'),
    swagger_1.Summary('Get transaction history for the authenticated user'),
    common_1.UseBefore(Auth_1.YesAuth),
    swagger_1.ReturnsArray(200, { type: model.economy.userTransactions }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.QueryParams('offset', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], EconomyController.prototype, "getTransactions", null);
__decorate([
    common_1.Get('/group/:groupId/transactions'),
    swagger_1.Summary('Get transaction history for the group. User must have manage permission'),
    common_1.UseBefore(Auth_1.YesAuth),
    swagger_1.ReturnsArray(200, { type: model.economy.GroupTransactions }),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidGroupId: GroupID is not valid\n' }),
    swagger_1.Returns(409, {
        type: model.Error,
        description: 'InvalidPermissions: User is not authorized to view transaction history\n'
    }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __param(2, common_1.QueryParams('offset', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number]),
    __metadata("design:returntype", Promise)
], EconomyController.prototype, "getGroupTransactions", null);
__decorate([
    common_1.Put('/currency/convert'),
    swagger_1.Summary('Convert one currency to another'),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    swagger_1.Returns(400, {
        type: model.Error,
        description: 'InvalidAmount: Amount must be < 100,000 & > 0\nNotEnoughCurrency: Not enough currency for this transaction\nInvalidCurrency: Invalid Currency Specified'
    }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.BodyParams('currency', Number)),
    __param(2, common_1.Required()),
    __param(2, common_1.BodyParams('amount', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number]),
    __metadata("design:returntype", Promise)
], EconomyController.prototype, "convertCurrency", null);
__decorate([
    common_1.Post('/:id/buy'),
    swagger_1.Summary('Purchase a catalog item'),
    swagger_1.Description('Notes: User can own multiple collectible items but can only own one non-collectible item. If a collectible item is still listed for sale, the user can only own one and cannot own multiple until it is taken off sale or sells out.'),
    swagger_1.Returns(400, {
        type: model.Error,
        description: 'InvalidCatalogId: CatalogId is invalid\nNoLongerForSale: Item is no longer for sale\nSellerHasChanged: The userId of the seller has changed\nPriceHasChanged: Price has changed\nCurrencyHasChanged: Currency has changed\nNotEnoughCurrency: User does not have enough currency for this purchase\nInvalidCurrencySpecified: Currency of product is invalid\nItemStillForSale: You cannot purchase collectible items that have not finished selling yet\nInvalidUserInventoryId: Invalid userInventoryId\nItemNoLongerForSale: Item is no longer for sale\nInvalidUserId: Seller userId is invalid\n'
    }),
    swagger_1.Returns(409, {
        type: model.Error,
        description: 'ConstraintEmailVerificationRequired: Your account must have a verified email before you can purchase something.\nAlreadyOwns: User already owns the item specified\n'
    }),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, TwoStepCheck_1.default('BuyItem')),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('id', Number)),
    __param(2, common_1.Required()),
    __param(2, common_1.BodyParams('userInventoryId', Number)),
    __param(3, common_1.Required()),
    __param(3, common_1.BodyParams('expectedSellerId', Number)),
    __param(4, common_1.Required()),
    __param(4, common_1.BodyParams('expectedPrice', Number)),
    __param(5, common_1.Required()),
    __param(5, common_1.BodyParams('expectedCurrency', Number)),
    __param(6, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], EconomyController.prototype, "buy", null);
__decorate([
    common_1.Put('/trades/user/:userId/request'),
    swagger_1.Summary('Create a trade request'),
    swagger_1.Description('offerItems and requestedItems should both be arrays of userInventoryIds'),
    swagger_1.Returns(400, {
        type: model.Error,
        description: 'InvalidUserId: UserId is terminated or invalid\nInvalidItemsSpecified: One or more of the userInventoryId(s) are invalid\nPrimaryRequestTooLarge: Primary Currency Request is too large\nPrimaryOfferTooLarge: Primary Currency offer is too large\n'
    }),
    swagger_1.Returns(409, {
        type: model.Error,
        description: 'CannotTradeWithUser: Authenticated user has trading disabled or partner has trading disabled\nTooManyPendingTrades: You have too many pending trades with this user\nNotEnoughPrimaryCurrencyForOffer: User does not have enough currency for this offer\n'
    }),
    swagger_1.Returns(503, { type: model.Error, description: 'Unavailable: Feature is unavailable\n' }),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, TwoStepCheck_2.default('TradeRequest')),
    __param(0, common_1.Req()),
    __param(1, common_1.Locals('userInfo')),
    __param(2, common_1.Required()),
    __param(2, swagger_1.Description('The userId to open a trade with')),
    __param(2, common_1.PathParams('userId', Number)),
    __param(3, common_1.Required()),
    __param(3, common_1.BodyParams(model.user.CreateTradeRequest)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, model.UserSession, Number, model.user.CreateTradeRequest]),
    __metadata("design:returntype", Promise)
], EconomyController.prototype, "createTradeRequest", null);
__decorate([
    common_1.Get('/trades/:tradeId/items'),
    swagger_1.Summary('Get the items involved in a specific tradeId'),
    swagger_1.Description('Requestee is authenticated user, requested is the partner involved with the trade'),
    swagger_1.Returns(200, { type: model.economy.TradeItemsResponse }),
    swagger_1.Returns(400, {
        type: model.Error,
        description: 'InvalidTradeId: TradeId is invalid or you do not have permission to view it\n'
    }),
    common_1.UseBeforeEach(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('tradeId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], EconomyController.prototype, "getTradeItems", null);
__decorate([
    common_1.Delete('/trades/:tradeId'),
    swagger_1.Summary('Decline/cancel a trade by the tradeId'),
    swagger_1.Returns(400, {
        type: model.Error,
        description: 'InvalidTradeId: TradeId is invalid (Doesnt exist, already declined/state doesnt allow decling, does not involve user, etc)\n'
    }),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('tradeId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], EconomyController.prototype, "declineTrade", null);
__decorate([
    common_1.Post('/trades/:tradeId'),
    swagger_1.Summary('Accept a trade'),
    swagger_1.Returns(400, {
        type: model.Error,
        description: 'InvalidTradeId: TradeId is invalid\nInvalidPartnerId: Trade cannot be completed due to an internal error\nNotAuthorized: User is not authorized to modify this trade (ex: didnt create the trade, already accepted, already declined, etc)'
    }),
    swagger_1.Returns(500, {
        type: model.Error,
        description: 'InternalServerError: Trade cannot be completed due to an internal error\n'
    }),
    swagger_1.Returns(409, {
        type: model.Error,
        description: 'OneOrMoreItemsNotAvailable: One or more of the items involved in the trade are no longer available\nCooldown: Try again later\nTradeCannotBeCompleted: Generic error is preventing trade from being completed.\n'
    }),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('tradeId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], EconomyController.prototype, "acceptTrade", null);
EconomyController = __decorate([
    common_1.Controller('/economy'),
    __metadata("design:paramtypes", [])
], EconomyController);
exports.default = EconomyController;

