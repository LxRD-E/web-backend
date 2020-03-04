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
    async getTrades(userInfo, tradeType, offset = 0) {
        let tradeValue;
        if (tradeType !== 'inbound' && tradeType !== 'outbound' && tradeType !== 'completed' && tradeType !== 'inactive') {
            throw new this.BadRequest('InvalidTradeType');
        }
        else {
            tradeValue = tradeType;
        }
        const trades = await this.economy.getTrades(userInfo.userId, tradeValue, offset);
        return trades;
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
        const transactions = await this.economy.getUserTransactions(userInfo.userId, offset);
        return transactions;
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
            throw new this.BadRequest('InvalidAmount');
        }
        if (originCurrency === model.economy.currencyType.primary) {
            if (numericAmount < 0) {
                throw new this.BadRequest('InvalidAmount');
            }
            const newAmount = await this.economy.convertCurrency(numericAmount, model.economy.currencyType.secondary);
            if (userInfo.primaryBalance < numericAmount) {
                throw new this.BadRequest('NotEnoughCurrency');
            }
            try {
                await this.economy.subtractFromUserBalance(userInfo.userId, numericAmount, model.economy.currencyType.primary);
            }
            catch (e) {
                if (e === model.economy.userBalanceErrors.NotEnoughCurrency) {
                    throw new this.BadRequest('NotEnoughCurrency');
                }
                await this.economy.addToUserBalance(userInfo.userId, numericAmount, model.economy.currencyType.primary);
                throw e;
            }
            try {
                await this.economy.addToUserBalance(userInfo.userId, newAmount, model.economy.currencyType.secondary);
            }
            catch (e) {
                await this.economy.addToUserBalance(userInfo.userId, numericAmount, model.economy.currencyType.primary);
                throw e;
            }
            await this.economy.createTransaction(userInfo.userId, userInfo.userId, -numericAmount, model.economy.currencyType.secondary, model.economy.transactionType.CurrencyConversionOfPrimaryToSecondary, "Currency Conversion", model.catalog.creatorType.User, model.catalog.creatorType.User);
            await this.economy.createTransaction(userInfo.userId, userInfo.userId, newAmount, model.economy.currencyType.primary, model.economy.transactionType.CurrencyConversionOfPrimaryToSecondary, "Currency Conversion", model.catalog.creatorType.User, model.catalog.creatorType.User);
            return { success: true };
        }
        else if (originCurrency === model.economy.currencyType.secondary) {
            if (numericAmount < 10) {
                throw new this.BadRequest('InvalidAmount');
            }
            if (numericAmount % 10 === 0) {
                const newAmount = await this.economy.convertCurrency(numericAmount, model.economy.currencyType.primary);
                if (userInfo.secondaryBalance < numericAmount) {
                    throw new this.BadRequest('NotEnoughCurrency');
                }
                try {
                    await this.economy.subtractFromUserBalance(userInfo.userId, numericAmount, model.economy.currencyType.secondary);
                }
                catch (e) {
                    if (e === model.economy.userBalanceErrors.NotEnoughCurrency) {
                        throw new this.BadRequest('NotEnoughCurrency');
                    }
                    await this.economy.addToUserBalance(userInfo.userId, numericAmount, model.economy.currencyType.secondary);
                    throw e;
                }
                try {
                    await this.economy.addToUserBalance(userInfo.userId, newAmount, model.economy.currencyType.primary);
                }
                catch (e) {
                    await this.economy.addToUserBalance(userInfo.userId, numericAmount, model.economy.currencyType.secondary);
                    throw e;
                }
                await this.economy.createTransaction(userInfo.userId, userInfo.userId, -numericAmount, model.economy.currencyType.secondary, model.economy.transactionType.CurrencyConversionOfSecondaryToPrimary, "Currency Conversion", model.catalog.creatorType.User, model.catalog.creatorType.User);
                await this.economy.createTransaction(userInfo.userId, userInfo.userId, newAmount, model.economy.currencyType.primary, model.economy.transactionType.CurrencyConversionOfSecondaryToPrimary, "Currency Conversion", model.catalog.creatorType.User, model.catalog.creatorType.User);
                return { success: true };
            }
            else {
                throw new this.BadRequest('NotEnoughCurrency');
            }
        }
        else {
            throw new this.BadRequest('InvalidCurrency');
        }
    }
    async buy(userInfo, catalogIdStr, userInventoryIdStr, sellerUserIdStr, expectedPriceStr, expectedCurrencyStr, req) {
        let ipAddress = req.ip;
        if (req.headers['cf-connecting-ip']) {
            ipAddress = req.headers['cf-connecting-ip'];
        }
        const catalogId = parseInt(catalogIdStr);
        const userInventoryId = parseInt(userInventoryIdStr);
        const sellerUserId = parseInt(sellerUserIdStr);
        const expectedPrice = parseInt(expectedPriceStr);
        const expectedCurrency = parseInt(expectedCurrencyStr);
        if (userInventoryId === 0) {
            let catalogItemInfo;
            try {
                catalogItemInfo = await this.catalog.getInfo(catalogId, ['catalogId', 'forSale', 'creatorId', 'creatorType', 'price', 'currency', 'maxSales', 'collectible', 'catalogName']);
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
                const sales = await this.catalog.countSales(catalogItemInfo.catalogId);
                if (sales >= catalogItemInfo.maxSales) {
                    await this.catalog.updateIsForSale(catalogItemInfo.catalogId, model.catalog.isForSale.false);
                    throw new this.BadRequest('NoLongerForSale');
                }
                else {
                    serial = sales + 1;
                    if (serial >= catalogItemInfo.maxSales) {
                        await this.catalog.updateIsForSale(catalogItemInfo.catalogId, model.catalog.isForSale.false);
                    }
                }
            }
            let owns = await this.user.getUserInventoryByCatalogId(userInfo.userId, catalogItemInfo.catalogId);
            if (owns[0]) {
                throw new this.Conflict('AlreadyOwns');
            }
            if (catalogItemInfo.currency === model.economy.currencyType.primary) {
                const balance = userInfo.primaryBalance;
                if (catalogItemInfo.price > balance) {
                    throw new this.BadRequest('NotEnoughCurrency');
                }
            }
            else if (catalogItemInfo.currency === model.economy.currencyType.secondary) {
                const balance = userInfo.secondaryBalance;
                if (catalogItemInfo.price > balance) {
                    throw new this.BadRequest('NotEnoughCurrency');
                }
            }
            else {
                throw new this.BadRequest('InvalidCurrencySpecified');
            }
            let inventoryId = await this.catalog.createItemForUserInventory(userInfo.userId, catalogItemInfo.catalogId, serial);
            const amtToSubtractFromSeller = Math.abs(catalogItemInfo.price * 0.3);
            const amtToSeller = catalogItemInfo.price - amtToSubtractFromSeller;
            try {
                await this.economy.subtractFromUserBalance(userInfo.userId, catalogItemInfo.price, catalogItemInfo.currency);
                if (catalogItemInfo.creatorType === model.catalog.creatorType.User) {
                    await this.economy.createTransaction(userInfo.userId, catalogItemInfo.creatorId, -catalogItemInfo.price, catalogItemInfo.currency, model.economy.transactionType.PurchaseOfItem, "Purchase of " + catalogItemInfo.catalogName, model.catalog.creatorType.User, model.catalog.creatorType.User, catalogItemInfo.catalogId, inventoryId);
                }
                else {
                    await this.economy.createTransaction(userInfo.userId, catalogItemInfo.creatorId, -catalogItemInfo.price, catalogItemInfo.currency, model.economy.transactionType.PurchaseOfItem, "Purchase of " + catalogItemInfo.catalogName, model.catalog.creatorType.Group, model.catalog.creatorType.User, catalogItemInfo.catalogId, inventoryId);
                }
            }
            catch (e) {
                await this.catalog.deleteUserInventoryId(inventoryId);
                if (e === model.economy.userBalanceErrors.NotEnoughCurrency) {
                    throw new this.BadRequest('NotEnoughCurrency');
                }
                throw e;
            }
            try {
                if (catalogItemInfo.creatorType === model.catalog.creatorType.User) {
                    await this.economy.addToUserBalance(catalogItemInfo.creatorId, amtToSeller, catalogItemInfo.currency);
                    await this.economy.createTransaction(catalogItemInfo.creatorId, userInfo.userId, amtToSeller, catalogItemInfo.currency, model.economy.transactionType.SaleOfItem, "Sale of " + catalogItemInfo.catalogName, model.catalog.creatorType.User, model.catalog.creatorType.User, catalogItemInfo.catalogId, inventoryId);
                }
                else if (catalogItemInfo.creatorType === model.catalog.creatorType.Group) {
                    await this.economy.addToGroupBalance(catalogItemInfo.creatorId, amtToSeller, catalogItemInfo.currency);
                    await this.economy.createTransaction(catalogItemInfo.creatorId, userInfo.userId, amtToSeller, catalogItemInfo.currency, model.economy.transactionType.SaleOfItem, "Sale of " + catalogItemInfo.catalogName, model.catalog.creatorType.User, model.catalog.creatorType.Group, catalogItemInfo.catalogId, inventoryId);
                }
            }
            catch (e) {
                await this.catalog.deleteUserInventoryId(inventoryId);
                await this.economy.addToUserBalance(userInfo.userId, catalogItemInfo.price, catalogItemInfo.currency);
                if (catalogItemInfo.creatorType === model.catalog.creatorType.User) {
                    await this.economy.createTransaction(userInfo.userId, catalogItemInfo.creatorId, catalogItemInfo.price, catalogItemInfo.currency, model.economy.transactionType.Refund, "Refund", model.catalog.creatorType.User, catalogItemInfo.catalogId, inventoryId);
                }
                else if (catalogItemInfo.creatorType === model.catalog.creatorType.Group) {
                    await this.economy.createTransaction(userInfo.userId, catalogItemInfo.creatorId, catalogItemInfo.price, catalogItemInfo.currency, model.economy.transactionType.Refund, "Refund", model.catalog.creatorType.Group, model.catalog.creatorType.User, catalogItemInfo.catalogId, inventoryId);
                }
                throw e;
            }
            try {
                await this.user.logUserIp(userInfo.userId, ipAddress, model.user.ipAddressActions.PurchaseOfItem);
            }
            catch (e) {
            }
            return { success: true };
        }
        else {
            let catalogItemInfo;
            try {
                catalogItemInfo = await this.catalog.getInfo(catalogId, ['catalogId', 'forSale', 'maxSales', 'collectible', 'catalogName']);
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
                usedItemInfo = await this.catalog.getItemByUserInventoryId(userInventoryId);
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
                sellerInfo = await this.user.getInfo(usedItemInfo.userId);
                if (sellerInfo.accountStatus === model.user.accountStatus.deleted || sellerInfo.accountStatus === model.user.accountStatus.terminated) {
                    throw false;
                }
            }
            catch (e) {
                await this.user.editItemPrice(userInventoryId, 0);
                throw new this.BadRequest('nItemNoLongerForSale');
            }
            const balance = userInfo.primaryBalance;
            if (usedItemInfo.price > balance) {
                throw new this.BadRequest('NotEnoughCurrency');
            }
            await this.catalog.updateUserInventoryIdOwner(usedItemInfo.userInventoryId, userInfo.userId);
            try {
                await this.economy.subtractFromUserBalance(userInfo.userId, usedItemInfo.price, model.economy.currencyType.primary);
                await this.economy.createTransaction(userInfo.userId, usedItemInfo.userId, -usedItemInfo.price, model.economy.currencyType.primary, model.economy.transactionType.PurchaseOfItem, "Purchase of " + catalogItemInfo.catalogName, model.catalog.creatorType.User, model.catalog.creatorType.User, catalogItemInfo.catalogId, usedItemInfo.userInventoryId);
            }
            catch (e) {
                await this.catalog.updateUserInventoryIdOwner(usedItemInfo.userInventoryId, usedItemInfo.userId);
                if (e === model.economy.userBalanceErrors.NotEnoughCurrency) {
                    throw new this.BadRequest('NotEnoughCurrency');
                }
                throw e;
            }
            const amtToSubtractFromSeller = Math.abs(usedItemInfo.price * 0.3);
            const amtToSeller = usedItemInfo.price - amtToSubtractFromSeller;
            try {
                await this.economy.addToUserBalance(usedItemInfo.userId, amtToSeller, model.economy.currencyType.primary);
                await this.economy.createTransaction(usedItemInfo.userId, userInfo.userId, amtToSeller, model.economy.currencyType.primary, model.economy.transactionType.SaleOfItem, "Sale of " + catalogItemInfo.catalogName, model.catalog.creatorType.User, model.catalog.creatorType.User, catalogItemInfo.catalogId, usedItemInfo.userInventoryId);
            }
            catch (e) {
                await this.catalog.updateUserInventoryIdOwner(usedItemInfo.userInventoryId, usedItemInfo.userId);
                await this.economy.addToUserBalance(userInfo.userId, usedItemInfo.price, model.economy.currencyType.primary);
                await this.economy.createTransaction(userInfo.userId, usedItemInfo.userId, usedItemInfo.price, model.economy.currencyType.primary, model.economy.transactionType.Refund, "Refund", model.catalog.creatorType.User, model.catalog.creatorType.User, catalogItemInfo.catalogId, usedItemInfo.userInventoryId);
                throw e;
            }
            try {
                await this.user.editItemPrice(usedItemInfo.userInventoryId, 0);
            }
            catch (e) {
                throw e;
            }
            try {
                await this.user.logUserIp(userInfo.userId, ipAddress, model.user.ipAddressActions.PurchaseOfItem);
                const averagePrice = await this.catalog.calculateAveragePrice(catalogItemInfo.catalogId);
                console.log("Price: " + averagePrice);
                await this.catalog.setAveragePrice(catalogItemInfo.catalogId, averagePrice);
            }
            catch (e) {
                console.error(e);
            }
            this.regenAvatarAfterItemTransferOwners(usedItemInfo.userId, usedItemInfo.catalogId).then(d => {
                console.log(d);
            }).catch(e => {
                console.error(e);
            });
            return { success: true };
        }
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
            throw new this.BadRequest('InvalidTradeId');
        }
        if (tradeInfo.userIdOne === userInfo.userId) {
            const requestedTradeItems = await this.economy.getTradeItems(model.economy.tradeSides.Requested, numericTradeId);
            const requesteeTradeItems = await this.economy.getTradeItems(model.economy.tradeSides.Requester, numericTradeId);
            return { 'requested': requestedTradeItems, 'requestee': requesteeTradeItems };
        }
        else if (tradeInfo.userIdTwo === userInfo.userId) {
            const requestedTradeItems = await this.economy.getTradeItems(model.economy.tradeSides.Requester, numericTradeId);
            const requesteeTradeItems = await this.economy.getTradeItems(model.economy.tradeSides.Requested, numericTradeId);
            return { 'requested': requestedTradeItems, 'requestee': requesteeTradeItems };
        }
        else {
            throw new this.BadRequest('InvalidTradeId');
        }
    }
    async declineTrade(userInfo, numericTradeId) {
        if (!numericTradeId) {
            throw new this.BadRequest('InvalidTradeId');
        }
        let tradeInfo = await this.economy.getTradeById(numericTradeId);
        if (tradeInfo.status !== model.economy.tradeStatus.Pending) {
            throw new this.BadRequest('InvalidTradeId');
        }
        if (tradeInfo.userIdTwo === userInfo.userId) {
            await this.notification.createMessage(tradeInfo.userIdOne, 1, 'Trade Declined', 'Hello,\n' + userInfo.username + ' has declined your trade. You may view it in the Inactive tab of your trades.');
        }
        if (tradeInfo.userIdOne === userInfo.userId || tradeInfo.userIdTwo === userInfo.userId) {
            await this.economy.declineTradeById(numericTradeId);
            return { success: true };
        }
        else {
            throw new this.BadRequest('InvalidTradeId');
        }
    }
    async acceptTrade(userInfo, numericTradeId) {
        if (!numericTradeId) {
            throw new this.BadRequest('InvalidTradeId');
        }
        let tradeInfo;
        try {
            tradeInfo = await this.economy.getTradeById(numericTradeId);
        }
        catch (e) {
            throw new this.BadRequest('InvalidTradeId');
        }
        if (tradeInfo.status !== model.economy.tradeStatus.Pending) {
            throw new this.BadRequest('InvalidTradeId');
        }
        if (tradeInfo.userIdTwo === userInfo.userId) {
            let partnerInfo = await this.user.getInfo(tradeInfo.userIdOne, ['accountStatus']);
            if (partnerInfo.accountStatus === model.user.accountStatus.deleted || partnerInfo.accountStatus === model.user.accountStatus.terminated) {
                throw new this.BadRequest('InvalidPartnerId');
            }
            const requestedTradeItems = await this.economy.getTradeItems(model.economy.tradeSides.Requester, numericTradeId);
            if (requestedTradeItems.length < 1) {
                throw new Error('Internal');
            }
            const requesteeTradeItems = await this.economy.getTradeItems(model.economy.tradeSides.Requested, numericTradeId);
            if (requesteeTradeItems.length < 1) {
                throw new Error('Internal');
            }
            const verifyOwnershipOfItems = (userId, items) => {
                return new Promise((resolve, reject) => {
                    const promises = [];
                    for (const item of items) {
                        promises.push(this.catalog.getItemByUserInventoryId(item["userInventoryId"]));
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
            };
            const swapOwnersOfItems = (userId, items) => {
                return new Promise((resolve, reject) => {
                    const promises = [];
                    for (const item of items) {
                        promises.push(this.catalog.updateUserInventoryIdOwner(item["userInventoryId"], userId), this.user.editItemPrice(item["userInventoryId"], 0));
                    }
                    Promise.all(promises)
                        .then(() => {
                        resolve();
                    })
                        .catch(() => {
                        reject();
                    });
                });
            };
            try {
                const OwnershipValidation = [
                    verifyOwnershipOfItems(tradeInfo.userIdOne, requestedTradeItems),
                    verifyOwnershipOfItems(tradeInfo.userIdTwo, requesteeTradeItems),
                ];
                await Promise.all(OwnershipValidation);
                try {
                    const OwnershipSwap = [
                        swapOwnersOfItems(tradeInfo.userIdTwo, requestedTradeItems),
                        swapOwnersOfItems(tradeInfo.userIdOne, requesteeTradeItems),
                    ];
                    await Promise.all(OwnershipSwap);
                }
                catch (e) {
                    try {
                        const OwnershipSwap = [
                            swapOwnersOfItems(tradeInfo.userIdOne, requestedTradeItems),
                            swapOwnersOfItems(tradeInfo.userIdTwo, requesteeTradeItems),
                        ];
                        await Promise.all(OwnershipSwap);
                    }
                    catch (e) {
                        throw e;
                    }
                    throw e;
                }
                await this.economy.markTradeAccepted(numericTradeId);
                (async () => {
                    try {
                        const s = requestedTradeItems.length > 1 ? 's' : '';
                        await this.notification.createMessage(tradeInfo.userIdOne, 1, 'Trade Accepted', 'Hello,\n' + userInfo.username + ' has accepted your trade. You can view your new item' + s + ' in your inventory.');
                    }
                    catch (e) {
                    }
                    try {
                        const itemIdsOne = [];
                        for (const item of requestedTradeItems) {
                            itemIdsOne.push(item.catalogId);
                        }
                        const itemIdsTwo = [];
                        for (const item of requesteeTradeItems) {
                            itemIdsTwo.push(item.catalogId);
                        }
                        (async () => {
                            await this.regenAvatarAfterItemTransferOwners(tradeInfo.userIdOne, itemIdsOne);
                        })();
                        (async () => {
                            await this.regenAvatarAfterItemTransferOwners(tradeInfo.userIdTwo, itemIdsTwo);
                        })();
                    }
                    catch (e) {
                        console.log(e);
                    }
                })();
                return { success: true };
            }
            catch (e) {
                try {
                    await this.economy.declineTradeById(numericTradeId);
                }
                catch (e) {
                    throw e;
                }
                throw new this.Conflict('OneOrMoreItemsNotAvailable');
            }
        }
        else {
            throw new this.BadRequest('NotAuthorized');
        }
    }
};
__decorate([
    common_1.Get('/metadata/collectible-resale-fee'),
    swagger_1.Summary('Get item resale fee percenatage for collectibles'),
    swagger_1.Returns(200, { type: model.economy.FeeMetaData }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EconomyController.prototype, "getResellFeeCollectible", null);
__decorate([
    common_1.Get('/metadata/sell-fee'),
    swagger_1.Summary('Get item resale fee percenatage for normal items (shirts, pants, etc)'),
    swagger_1.Returns(200, { type: model.economy.FeeMetaData }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EconomyController.prototype, "getSellFee", null);
__decorate([
    common_1.Get('/metadata/currency-conversion-rate'),
    swagger_1.Summary('Get currency conversion metadata'),
    swagger_1.Returns(200, { type: model.economy.CurrencyConversionMetadata }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EconomyController.prototype, "getCurrencyConversionMetadata", null);
__decorate([
    common_1.Get('/trades/:type'),
    swagger_1.Summary('Get user trades'),
    common_1.UseBefore(Auth_1.YesAuth),
    swagger_1.ReturnsArray(200, { type: model.economy.TradeInfo }),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidTradeType: TradeType must be one of: inbound,outbound,completed,inactive\n' }),
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
    swagger_1.Returns(409, { type: model.Error, description: 'InvalidPermissions: User is not authorized to view transaction history\n' }),
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
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidAmount: Amount must be < 100,000 & > 0\nNotEnoughCurrency: Not enough currency for this transaction\nInvalidCurrency: Invalid Currency Specified' }),
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
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidCatalogId: CatalogId is invalid\nNoLongerForSale: Item is no longer for sale\nSellerHasChanged: The userId of the seller has changed\nPriceHasChanged: Price has changed\nCurrencyHasChanged: Currency has changed\nAlreadyOwns: User already owns the item specified\nNotEnoughCurrency: User does not have enough currency for this purchase\nInvalidCurrencySpecified: Currency of product is invalid\nItemStillForSale: You cannot purchase collectible items that have not finished selling yet\nInvalidUserInventoryId: Invalid userInventoryId\nItemNoLongerForSale: Item is no longer for sale\nInvalidUserId: Seller userId is invalid\n' }),
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
    common_1.Get('/trades/:tradeId/items'),
    swagger_1.Summary('Get the items involved in a specific tradeId'),
    swagger_1.Description('Requestee is authenticated user, requested is the partner involved with the trade'),
    swagger_1.Returns(200, { type: model.economy.TradeItemsResponse }),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidTradeId: TradeId is invalid or you do not have permission to view it\n' }),
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
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidTradeId: TradeId is invalid (Doesnt exist, already declined/state doesnt allow decling, does not involve user, etc)\n' }),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('tradeId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], EconomyController.prototype, "declineTrade", null);
__decorate([
    common_1.Post('/trades/:id'),
    swagger_1.Summary('Accept a trade'),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidTradeId: TradeId is invalid\nInvalidPartnerId: Trade cannot be completed due to an internal error\nNotAuthorized: User is not authorized to modify this trade (ex: didnt create the trade, already accepted, already declined, etc)' }),
    swagger_1.Returns(500, { type: model.Error, description: 'InternalServerError: Trade cannot be completed due to an internal error\n' }),
    swagger_1.Returns(409, { type: model.Error, description: 'OneOrMoreItemsNotAvailable: One or more of the items involved in the trade are no longer available\n' }),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
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

