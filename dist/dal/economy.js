"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const model = require("../models/models");
const _init_1 = require("./_init");
class EconomyDAL extends _init_1.default {
    async unlockUserEconomy(userId) {
        await this.knex('users').update({
            'economy_lock': 0
        }).where({
            'id': userId,
        });
    }
    async lockUserEconomy(userId) {
        await this.knex.transaction(async (trx) => {
            let lockStatus = await trx('users').select('economy_lock', 'economy_lock_date').where({
                'id': userId,
            }).forUpdate('users');
            let info = lockStatus[0];
            console.log('user lock status', info);
            if (info.economy_lock === 1) {
                let lockDateBad = this.moment(info.economy_lock_date).add(10, 'seconds').isSameOrAfter(this.moment());
                console.log(lockDateBad);
                if (lockDateBad) {
                    throw new Error("CouldNotAquireLockDueToLockNotExpired");
                }
            }
            let dateToLock = this.knexTime();
            let results = await trx('users').update({
                'economy_lock': 1,
                'economy_lock_date': dateToLock,
            }).where({
                'id': userId,
            });
            console.log(results);
            let newStatus = await trx('users').select('economy_lock', 'economy_lock_date').where({
                'id': userId,
            }).forUpdate('users');
            console.log(newStatus);
            console.log(dateToLock);
            let timeLockedAt = newStatus[0]['economy_lock_date'].toISOString();
            let dateWeLockedAt = new Date(dateToLock).toISOString();
            console.log(newStatus);
            console.log(dateToLock);
            if (timeLockedAt !== dateWeLockedAt) {
                throw new Error('EconomyLockedByOtherProcess');
            }
        });
    }
    async deleteTransaction(transactionId) {
        await this.knex('transactions').delete().where({
            id: transactionId,
        });
    }
    async createTransaction(userIdTo, userIdFrom, amount, currency, type, description, fromType, toType, catalogId, userInventoryId) {
        let numericCatalogId;
        if (!catalogId) {
            numericCatalogId = 0;
        }
        else {
            numericCatalogId = catalogId;
        }
        let numericInventoryId;
        if (userInventoryId === undefined) {
            numericInventoryId = null;
        }
        else {
            numericInventoryId = userInventoryId;
        }
        let results = await this.knex("transactions").insert({ "userid_to": userIdTo, "userid_from": userIdFrom, "amount": amount, "currency": currency, "type": type, "description": description, "catalogid": numericCatalogId, "user_inventoryid": numericInventoryId, "from_type": fromType, "to_type": toType });
        return results[0];
    }
    async addToUserBalanceV2(userId, amount, currency) {
        let type = '';
        if (currency === model.economy.currencyType.primary) {
            type = 'user_balance1';
        }
        else if (currency === model.economy.currencyType.secondary) {
            type = 'user_balance2';
        }
        else {
            throw new Error('InvalidCurrencyType');
        }
        await this.knex('users').increment(type, amount).where({
            'id': userId,
        }).limit(1);
    }
    async subtractFromUserBalanceV2(userId, amount, currency) {
        let type = '';
        if (currency === model.economy.currencyType.primary) {
            type = 'user_balance1';
        }
        else if (currency === model.economy.currencyType.secondary) {
            type = 'user_balance2';
        }
        else {
            throw new Error('InvalidCurrencyType');
        }
        await this.knex('users').decrement(type, amount).where({
            'id': userId,
        }).limit(1);
    }
    async addToUserBalance(userId, amount, currency) {
        await this.knex.transaction(async (trx) => {
            if (currency === model.economy.currencyType.primary) {
                const balance = await trx("users").select("user_balance1").where({ "id": userId }).forUpdate('users');
                if (balance && balance[0] && balance[0]["user_balance1"] !== undefined) {
                    const currentBalance = balance[0]["user_balance1"];
                    const newBalance = currentBalance + amount;
                    await trx("users").update({ "user_balance1": newBalance }).where({ "id": userId });
                }
                else {
                    throw model.economy.userBalanceErrors.InvalidUserId;
                }
            }
            else if (currency === model.economy.currencyType.secondary) {
                const balance = await trx("users").select("user_balance2").where({ "id": userId }).forUpdate('users');
                if (balance && balance[0] && balance[0]["user_balance2"] !== undefined) {
                    const currentBalance = balance[0]["user_balance2"];
                    const newBalance = currentBalance + amount;
                    await trx("users").update({ "user_balance2": newBalance }).where({ "id": userId });
                }
                else {
                    throw model.economy.userBalanceErrors.InvalidUserId;
                }
            }
            else {
                throw model.economy.userBalanceErrors.InvalidCurrencyType;
            }
        });
    }
    async subtractFromUserBalance(userId, amount, currency) {
        await this.knex.transaction(async (trx) => {
            if (currency === model.economy.currencyType.primary) {
                const balance = await trx("users").select("user_balance1").where({ "id": userId });
                if (balance && balance[0] && balance[0]["user_balance1"] !== undefined) {
                    const currentBalance = balance[0]["user_balance1"];
                    const newBalance = currentBalance - amount;
                    if (newBalance < 0) {
                        throw model.economy.userBalanceErrors.NotEnoughCurrency;
                    }
                    await trx("users").update({ "user_balance1": newBalance }).where({ "id": userId });
                }
                else {
                    throw model.economy.userBalanceErrors.InvalidUserId;
                }
            }
            else if (currency === model.economy.currencyType.secondary) {
                const balance = await trx("users").select("user_balance2").where({ "id": userId });
                if (balance && balance[0] && balance[0]["user_balance2"] !== undefined) {
                    const currentBalance = balance[0]["user_balance2"];
                    const newBalance = currentBalance - amount;
                    if (newBalance < 0) {
                        throw model.economy.userBalanceErrors.NotEnoughCurrency;
                    }
                    await trx("users").update({ "user_balance2": newBalance }).where({ "id": userId });
                }
                else {
                    throw model.economy.userBalanceErrors.InvalidUserId;
                }
            }
            else {
                throw model.economy.userBalanceErrors.InvalidCurrencyType;
            }
        });
    }
    async addToGroupBalance(groupId, amount, currency) {
        await this.knex.transaction(async (trx) => {
            if (currency === model.economy.currencyType.primary) {
                const balance = await trx("groups").select("balance_one").where({ "id": groupId }).forUpdate('groups');
                if (balance && balance[0] && balance[0]["balance_one"] !== undefined) {
                    const currentBalance = balance[0]["balance_one"];
                    const newBalance = currentBalance + amount;
                    await trx("groups").update({ "balance_one": newBalance }).where({ "id": groupId });
                }
                else {
                    throw model.economy.userBalanceErrors.InvalidUserId;
                }
            }
            else if (currency === model.economy.currencyType.secondary) {
                const balance = await trx("groups").select("balance_two").where({ "id": groupId }).forUpdate('groups');
                if (balance && balance[0] && balance[0]["balance_two"] !== undefined) {
                    const currentBalance = balance[0]["balance_two"];
                    const newBalance = currentBalance + amount;
                    await trx("groups").update({ "balance_two": newBalance }).where({ "id": groupId });
                }
                else {
                    throw model.economy.userBalanceErrors.InvalidUserId;
                }
            }
            else {
                throw model.economy.userBalanceErrors.InvalidCurrencyType;
            }
        });
    }
    async subtractFromGroupBalance(groupId, amount, currency) {
        await this.knex.transaction(async (trx) => {
            if (currency === model.economy.currencyType.primary) {
                const balance = await trx("groups").select("balance_one").where({ "id": groupId }).forUpdate('groups');
                if (balance && balance[0] && balance[0]["balance_one"] !== undefined) {
                    const currentBalance = balance[0]["balance_one"];
                    const newBalance = currentBalance - amount;
                    if (newBalance < 0) {
                        throw model.economy.userBalanceErrors.NotEnoughCurrency;
                    }
                    await trx("groups").update({ "balance_one": newBalance }).where({ "id": groupId });
                }
                else {
                    throw model.economy.userBalanceErrors.InvalidUserId;
                }
            }
            else if (currency === model.economy.currencyType.secondary) {
                const balance = await trx("groups").select("balance_two").where({ "id": groupId }).forUpdate('groups');
                if (balance && balance[0] && balance[0]["balance_two"] !== undefined) {
                    const currentBalance = balance[0]["balance_two"];
                    const newBalance = currentBalance - amount;
                    if (newBalance < 0) {
                        throw model.economy.userBalanceErrors.NotEnoughCurrency;
                    }
                    await trx("groups").update({ "balance_two": newBalance }).where({ "id": groupId });
                }
                else {
                    throw model.economy.userBalanceErrors.InvalidUserId;
                }
            }
            else {
                throw model.economy.userBalanceErrors.InvalidCurrencyType;
            }
        });
    }
    async getUserTransactions(userId, offset) {
        const results = await this.knex("transactions").select("id as transactionId", "userid_from as userId", "amount", "currency", "date", "type as transactionType", "description", "catalogid as catalogId", "user_inventoryid as userInventoryId").limit(25).offset(offset).orderBy('id', 'desc').where({ "userid_to": userId, "to_type": model.catalog.creatorType.User });
        return results;
    }
    async getGroupTransactions(groupId, offset) {
        const results = await this.knex("transactions").select("id as transactionId", "userid_from as userId", "amount", "currency", "date", "type as transactionType", "description", "catalogid as catalogId", "user_inventoryid as userInventoryId").limit(25).offset(offset).orderBy('id', 'desc').where({ "userid_to": groupId, "to_type": model.catalog.creatorType.Group });
        return results;
    }
    async convertCurrency(amount, currency) {
        if (currency === model.economy.currencyType.primary) {
            const newAmt = amount / 10;
            return Math.abs(newAmt);
        }
        else if (currency === model.economy.currencyType.secondary) {
            return amount * 10;
        }
        else {
            throw false;
        }
    }
    async createTrade(userIdOne, userIdTwo, offerPrimary, requestPrimary) {
        const tradeData = await this.knex("trades").insert({
            'userid_one': userIdOne,
            'userid_two': userIdTwo,
            'status': model.economy.tradeStatus.Pending,
            'userid_one_primary': offerPrimary,
            'userid_two_primary': requestPrimary,
        });
        if (!tradeData[0]) {
            throw false;
        }
        return tradeData[0];
    }
    async addItemsToTrade(tradeId, side, items) {
        for (const item of items) {
            await this.knex("trade_items").insert({
                'trade_id': tradeId,
                'userinventory_id': item.userInventoryId,
                'catalog_id': item.catalogId,
                'side': side,
            });
        }
    }
    async countPendingTradesBetweenUsers(userIdOne, userIdTwo) {
        const pending = await this.knex("trades").count("id as Total").where({ "userid_one": userIdOne, "userid_two": userIdTwo, "status": model.economy.tradeStatus.Pending }).orWhere({ "userid_two": userIdOne, "userid_one": userIdTwo, "status": model.economy.tradeStatus.Pending });
        return pending[0]["Total"];
    }
    async getTrades(userId, tradeType, offset) {
        let tradeNumber;
        let query;
        if (tradeType !== 'inbound') {
            if (tradeType === 'outbound') {
                tradeNumber = 0;
                query = await this.knex("trades").where({ 'userid_one': userId, "status": tradeNumber }).select('id as tradeId', 'userid_two as userId', 'date', 'userid_two_primary as requestPrimary', 'userid_one_primary as offerPrimary').limit(25).offset(offset).orderBy("id", "DESC");
            }
            else if (tradeType === 'inactive') {
                tradeNumber = 2;
                const selectionOfTrades = await this.knex("trades").where({ 'userid_two': userId, "status": tradeNumber }).orWhere({ 'userid_one': userId, "status": tradeNumber }).select('id as tradeId', 'userid_one', 'userid_two', 'date', 'userid_two_primary', 'userid_one_primary').limit(25).offset(offset).orderBy("id", "DESC");
                query = [];
                for (const trade of selectionOfTrades) {
                    if (trade.userid_one === userId) {
                        query.push({
                            'tradeId': trade.tradeId,
                            'userId': trade.userid_two,
                            'date': trade.date,
                            'offerPrimary': trade.userid_one_primary,
                            'requestPrimary': trade.userid_two_primary,
                        });
                    }
                    else {
                        query.push({
                            'tradeId': trade.tradeId,
                            'userId': trade.userid_one,
                            'date': trade.date,
                            'requestPrimary': trade.userid_two_primary,
                            'offerPrimary': trade.userid_one_primary,
                        });
                    }
                }
            }
            else {
                tradeNumber = 1;
                const selectionOfTrades = await this.knex("trades").where({ 'userid_one': userId, "status": tradeNumber }).orWhere({ 'userid_two': userId, "status": tradeNumber }).select('id as tradeId', 'userid_two', 'userid_one', 'date', 'userid_two_primary', 'userid_one_primary').limit(25).offset(offset).orderBy("id", "DESC");
                query = [];
                for (const trade of selectionOfTrades) {
                    if (trade.userid_one === userId) {
                        query.push({
                            'tradeId': trade.tradeId,
                            'userId': trade.userid_two,
                            'date': trade.date,
                            'offerPrimary': trade.userid_one_primary,
                            'requestPrimary': trade.userid_two_primary,
                        });
                    }
                    else {
                        query.push({
                            'tradeId': trade.tradeId,
                            'userId': trade.userid_one,
                            'date': trade.date,
                            'requestPrimary': trade.userid_two_primary,
                            'offerPrimary': trade.userid_one_primary,
                        });
                    }
                }
            }
        }
        else {
            tradeNumber = 0;
            query = await this.knex("trades").where({ 'userid_two': userId, "status": tradeNumber }).select('id as tradeId', 'userid_one as userId', 'date', 'userid_one_primary as offerPrimary', 'userid_two_primary as requestPrimary').limit(25).offset(offset).orderBy("id", "DESC");
        }
        return query;
    }
    async getTradeById(tradeId, forUpdate) {
        let query = this.knex("trades").select('id as tradeId', 'userid_one as userIdOne', 'userid_two as userIdTwo', 'date', 'status', 'userid_one_primary as userIdOnePrimary', 'userid_two_primary as userIdTwoPrimary').where({ 'id': tradeId });
        if (forUpdate) {
            query = query.forUpdate(forUpdate);
        }
        const res = await query;
        if (!res[0]) {
            throw new Error('InvalidTradeId');
        }
        return res[0];
    }
    async declineTradeById(tradeId) {
        await this.knex("trades").update({
            'status': model.economy.tradeStatus.Declined,
        }).where({
            'id': tradeId,
        }).limit(1);
    }
    async markTradeAccepted(tradeId) {
        await this.knex("trades").update({
            'status': model.economy.tradeStatus.Accepted,
        }).where({
            'id': tradeId,
        }).limit(1);
    }
    async getTradeItems(side, tradeId) {
        const items = await this.knex("trade_items").select("trade_items.trade_id as tradeId", "trade_items.userinventory_id as userInventoryId", "trade_items.catalog_id as catalogId", 'user_inventory.serial', 'catalog.average_price as averageSalesPrice').where({ "trade_id": tradeId, "side": side }).innerJoin('user_inventory', 'user_inventory.id', 'trade_items.userinventory_id').innerJoin('catalog', 'catalog.id', 'trade_items.catalog_id');
        if (!items[0]) {
            throw false;
        }
        return items;
    }
}
exports.default = EconomyDAL;

