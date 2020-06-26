/**
 * Imports
 */
import * as model from '../models/models';
import _init from './_init';

/**
 * Economy Data Access Layer
 */
class EconomyDAL extends _init {

    /**
     * Unlock user from making economy changes
     * @param userId 
     * @deprecated Use native knex.transaciton instead of this
     */
    public async unlockUserEconomy(userId: number): Promise<void> {
        await this.knex('users').update({
            'economy_lock': 0
        }).where({
            'id': userId,
        })
    }
    /**
     * Lock the user from making changes to their economy
     * @param userId 
     * @deprecated Use native knex.transaciton instead of this
     */
    public async lockUserEconomy(userId: number): Promise<void> {
        await this.knex.transaction(async (trx) => {
            // First, check if locked
            let lockStatus = await trx('users').select('economy_lock', 'economy_lock_date').where({
                'id': userId,
            }).forUpdate('users');
            let info = lockStatus[0];
            console.log('user lock status', info);
            if (info.economy_lock === 1) {
                // Check when it was locked at
                let lockDateBad = this.moment(info.economy_lock_date).add(10, 'seconds').isSameOrAfter(this.moment());
                console.log(lockDateBad);
                if (lockDateBad) {
                    // Not good
                    throw new Error("CouldNotAquireLockDueToLockNotExpired");
                }
            }
            // Define date
            let dateToLock = this.knexTime();
            // First, try to lock
            let results = await trx('users').update({
                'economy_lock': 1,
                'economy_lock_date': dateToLock,
            }).where({
                'id': userId,
            });
            console.log(results);
            // Now, grab the lock status again
            let newStatus = await trx('users').select('economy_lock', 'economy_lock_date').where({
                'id': userId,
            }).forUpdate('users');
            // Verify date
            console.log(newStatus);
            console.log(dateToLock);
            let timeLockedAt = (newStatus[0]['economy_lock_date'] as Date).toISOString();
            let dateWeLockedAt = new Date(dateToLock).toISOString();

            console.log(newStatus);
            console.log(dateToLock);
            if (timeLockedAt !== dateWeLockedAt) {
                throw new Error('EconomyLockedByOtherProcess');
            }
        });
        // OK
    }
    /**
     * Delete a transaction by it's transactionId
     * @param transactionId 
     */
    public async deleteTransaction(transactionId: number): Promise<void> {
        await this.knex('transactions').delete().where({
            id: transactionId,
        });
    }
    /**
     * Create a Transaction. This will **not** affect anyone's balance; it will simply show up in the transactions table
     * @param userIdTo Who does this transaction affect?
     * @param userIdFrom Who is the other person involved?
     * @param amount Amount of Currency
     * @param currency Currency Type
     * @param type Transaction Type
     * @param description Short Human-readable Description of Transaction
     * @param catalogId The ID of the Catalog Item Involved (optional)
     * @param userInventoryId The ID of the Inventory Item Involved (optional)
     * @returns TransactionId
     */
    public async createTransaction(userIdTo: number, userIdFrom: number, amount: number, currency: model.economy.currencyType, type: model.economy.transactionType, description: string, fromType: model.catalog.creatorType, toType: model.catalog.creatorType, catalogId?: number, userInventoryId?: number): Promise<number> {
        let numericCatalogId;
        if (!catalogId) {
            numericCatalogId = 0;
        } else {
            numericCatalogId = catalogId;
        }
        let numericInventoryId;
        if (userInventoryId === undefined) {
            numericInventoryId = null;
        } else {
            numericInventoryId = userInventoryId;
        }
        let results = await this.knex("transactions").insert({ "userid_to": userIdTo, "userid_from": userIdFrom, "amount": amount, "currency": currency, "type": type, "description": description, "catalogid": numericCatalogId, "user_inventoryid": numericInventoryId, "from_type": fromType, "to_type": toType });
        return results[0];
    }

    public async addToUserBalanceV2(userId: number, amount: number, currency: model.economy.currencyType): Promise<void> {
        let type = '';
        if (currency === model.economy.currencyType.primary) {
            type = 'user_balance1';
        }else if (currency === model.economy.currencyType.secondary) {
            type = 'user_balance2';
        }else{
            throw new Error('InvalidCurrencyType');
        }
        await this.knex('users').increment(type, amount).where({
            'id': userId,
        }).limit(1);
    }
    public async subtractFromUserBalanceV2(userId: number, amount: number, currency: model.economy.currencyType): Promise<void> {
        let type = '';
        if (currency === model.economy.currencyType.primary) {
            type = 'user_balance1';
        }else if (currency === model.economy.currencyType.secondary) {
            type = 'user_balance2';
        }else{
            throw new Error('InvalidCurrencyType');
        }
        await this.knex('users').decrement(type, amount).where({
            'id': userId,
        }).limit(1);
    }

    /**
     * Add the amount of currency specified to a user's balance
     * @param userId User's ID
     * @param amount Amount of Currency
     * @param currency Currency Type
     */
    public async addToUserBalance(userId: number, amount: number, currency: model.economy.currencyType): Promise<void> {
        await this.knex.transaction(async (trx) => {
            if (currency === model.economy.currencyType.primary) {
                const balance = await trx("users").select("user_balance1").where({ "id": userId }).forUpdate('users');
                if (balance && balance[0] && balance[0]["user_balance1"] !== undefined) {
                    const currentBalance = balance[0]["user_balance1"];
                    const newBalance = currentBalance + amount;
                    await trx("users").update({ "user_balance1": newBalance }).where({ "id": userId });
                } else {
                    throw model.economy.userBalanceErrors.InvalidUserId;
                }
            } else if (currency === model.economy.currencyType.secondary) {
                const balance = await trx("users").select("user_balance2").where({ "id": userId }).forUpdate('users');
                if (balance && balance[0] && balance[0]["user_balance2"] !== undefined) {
                    const currentBalance = balance[0]["user_balance2"];
                    const newBalance = currentBalance + amount;
                    await trx("users").update({ "user_balance2": newBalance }).where({ "id": userId });
                } else {
                    throw model.economy.userBalanceErrors.InvalidUserId;
                }
            } else {
                throw model.economy.userBalanceErrors.InvalidCurrencyType;
            }
        });
    }

    /**
     * Subtract the amount of currency specified from a user's balance
     * @param userId User's ID
     * @param amount Amount of Currency
     * @param currency Currency Type
     */
    public async subtractFromUserBalance(userId: number, amount: number, currency: model.economy.currencyType): Promise<void> {
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
                } else {
                    throw model.economy.userBalanceErrors.InvalidUserId;
                }
            } else if (currency === model.economy.currencyType.secondary) {
                const balance = await trx("users").select("user_balance2").where({ "id": userId });
                if (balance && balance[0] && balance[0]["user_balance2"] !== undefined) {
                    const currentBalance = balance[0]["user_balance2"];
                    const newBalance = currentBalance - amount;
                    if (newBalance < 0) {
                        throw model.economy.userBalanceErrors.NotEnoughCurrency;
                    }
                    await trx("users").update({ "user_balance2": newBalance }).where({ "id": userId });
                } else {
                    throw model.economy.userBalanceErrors.InvalidUserId;
                }
            } else {
                throw model.economy.userBalanceErrors.InvalidCurrencyType;
            }
        });
    }

    /**
     * Add the amount of currency specified to a group's balance
     * @param groupId Group's ID
     * @param amount Amount of Currency
     * @param currency Currency Type
     */
    public async addToGroupBalance(groupId: number, amount: number, currency: model.economy.currencyType): Promise<void> {
        await this.knex.transaction(async (trx) => {
            if (currency === model.economy.currencyType.primary) {
                const balance = await trx("groups").select("balance_one").where({ "id": groupId }).forUpdate('groups');
                if (balance && balance[0] && balance[0]["balance_one"] !== undefined) {
                    const currentBalance = balance[0]["balance_one"];
                    const newBalance = currentBalance + amount;
                    await trx("groups").update({ "balance_one": newBalance }).where({ "id": groupId });
                } else {
                    throw model.economy.userBalanceErrors.InvalidUserId;
                }
            } else if (currency === model.economy.currencyType.secondary) {
                const balance = await trx("groups").select("balance_two").where({ "id": groupId }).forUpdate('groups');
                if (balance && balance[0] && balance[0]["balance_two"] !== undefined) {
                    const currentBalance = balance[0]["balance_two"];
                    const newBalance = currentBalance + amount;
                    await trx("groups").update({ "balance_two": newBalance }).where({ "id": groupId });
                } else {
                    throw model.economy.userBalanceErrors.InvalidUserId;
                }
            } else {
                throw model.economy.userBalanceErrors.InvalidCurrencyType;
            }
        });
    }

    /**
     * Subtract the amount of currency specified from a group's balance
     * @param groupId Group's ID
     * @param amount Amount of Currency
     * @param currency Currency Type
     */
    public async subtractFromGroupBalance(groupId: number, amount: number, currency: model.economy.currencyType): Promise<void> {
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
                } else {
                    throw model.economy.userBalanceErrors.InvalidUserId;
                }
            } else if (currency === model.economy.currencyType.secondary) {
                const balance = await trx("groups").select("balance_two").where({ "id": groupId }).forUpdate('groups');
                if (balance && balance[0] && balance[0]["balance_two"] !== undefined) {
                    const currentBalance = balance[0]["balance_two"];
                    const newBalance = currentBalance - amount;
                    if (newBalance < 0) {
                        throw model.economy.userBalanceErrors.NotEnoughCurrency;
                    }
                    await trx("groups").update({ "balance_two": newBalance }).where({ "id": groupId });
                } else {
                    throw model.economy.userBalanceErrors.InvalidUserId;
                }
            } else {
                throw model.economy.userBalanceErrors.InvalidCurrencyType;
            }
        });
    }

    /**
     * Get a User's Transactions
     * @param userId 
     * @param offset 
     */
    public async getUserTransactions(userId: number, offset: number): Promise<model.economy.userTransactions[]> {
        const results = await this.knex("transactions").select("id as transactionId", "userid_from as userId", "amount", "currency", "date", "type as transactionType", "description", "catalogid as catalogId", "user_inventoryid as userInventoryId").limit(25).offset(offset).orderBy('id', 'desc').where({ "userid_to": userId, "to_type": model.catalog.creatorType.User });
        return results as model.economy.userTransactions[];
    }

    /**
     * Get a Group's Transactions
     * @param userId 
     * @param offset 
     */
    public async getGroupTransactions(groupId: number, offset: number): Promise<model.economy.GroupTransactions[]> {
        const results = await this.knex("transactions").select("id as transactionId", "userid_from as userId", "amount", "currency", "date", "type as transactionType", "description", "catalogid as catalogId", "user_inventoryid as userInventoryId").limit(25).offset(offset).orderBy('id', 'desc').where({ "userid_to": groupId, "to_type": model.catalog.creatorType.Group });
        return results as model.economy.GroupTransactions[];
    }


    /**
     * Convert a Currency to another currency. All this does is return a number; it doesn't actually convert currency for the user
     * @param amount Amount of Currency
     * @param currency Currency Type
     */
    public async convertCurrency(amount: number, currency: model.economy.currencyType): Promise<number> {
        if (currency === model.economy.currencyType.primary) {
            const newAmt = amount / 10;
            return Math.abs(newAmt);
        } else if (currency === model.economy.currencyType.secondary) {
            return amount * 10;
        } else {
            throw false;
        }
    }
    /**
     * Create a trade. Returns the trade's id if successful
     * @param userIdOne 
     * @param userIdTwo 
     */
    public async createTrade(userIdOne: number, userIdTwo: number, offerPrimary: number, requestPrimary: number): Promise<number> {
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
        return tradeData[0] as number;
    }

    /**
     * Add item(s) to a trade
     * @param tradeId 
     * @param side 
     * @param items 
     */
    public async addItemsToTrade(tradeId: number, side: model.economy.tradeSides, items: model.economy.TradeItemObject[]): Promise<void> {
        // This isn't that good in terms of performance, but it seems to be more stable
        for (const item of items) {
            await this.knex("trade_items").insert({
                'trade_id': tradeId,
                'userinventory_id': item.userInventoryId,
                'catalog_id': item.catalogId,
                'side': side,
            });
        }
    }

    /**
     * Count the amount of trades involving the two user IDs specified that are in a pending state.
     * @param userIdOne 
     * @param userIdTwo 
     */
    public async countPendingTradesBetweenUsers(userIdOne: number, userIdTwo: number): Promise<number> {
        const pending = await this.knex("trades").count("id as Total").where({ "userid_one": userIdOne, "userid_two": userIdTwo, "status": model.economy.tradeStatus.Pending }).orWhere({ "userid_two": userIdOne, "userid_one": userIdTwo, "status": model.economy.tradeStatus.Pending });
        return pending[0]["Total"] as number;
    }

    /**
     * Get Trades for a User. DESC Order
     * @param tradeType 
     * @param offset 
     */
    public async getTrades(userId: number, tradeType: string, offset: number): Promise<model.economy.TradeInfo[]> {
        let tradeNumber;
        let query;
        if (tradeType !== 'inbound') {
            if (tradeType === 'outbound') {
                tradeNumber = 0;
                query = await this.knex("trades").where({ 'userid_one': userId, "status": tradeNumber }).select(
                    'id as tradeId',
                    'userid_two as userId',
                    'date',
                    'userid_two_primary as requestPrimary',
                    'userid_one_primary as offerPrimary',
                ).limit(25).offset(offset).orderBy("id", "DESC");
            } else if (tradeType === 'inactive') {
                tradeNumber = 2;
                const selectionOfTrades = await this.knex("trades").where({ 'userid_two': userId, "status": tradeNumber }).orWhere({ 'userid_one': userId, "status": tradeNumber }).select(
                    'id as tradeId',
                    'userid_one',
                    'userid_two',
                    'date',
                    'userid_two_primary',
                    'userid_one_primary',
                ).limit(25).offset(offset).orderBy("id", "DESC");
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
                    } else {
                        query.push({
                            'tradeId': trade.tradeId,
                            'userId': trade.userid_one,
                            'date': trade.date,
                            'requestPrimary': trade.userid_two_primary,
                            'offerPrimary': trade.userid_one_primary,
                        });
                    }
                }
            } else {
                tradeNumber = 1;
                const selectionOfTrades = await this.knex("trades").where({ 'userid_one': userId, "status": tradeNumber }).orWhere({ 'userid_two': userId, "status": tradeNumber }).select(
                    'id as tradeId',
                    'userid_two',
                    'userid_one',
                    'date',
                    'userid_two_primary',
                    'userid_one_primary',
                ).limit(25).offset(offset).orderBy("id", "DESC");
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
                    } else {
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
        } else {
            tradeNumber = 0;
            query = await this.knex("trades").where({ 'userid_two': userId, "status": tradeNumber }).select(
                'id as tradeId',
                'userid_one as userId',
                'date',
                'userid_one_primary as offerPrimary',
                'userid_two_primary as requestPrimary',
            ).limit(25).offset(offset).orderBy("id", "DESC");
        }
        return query;
    }

    /**
     * Get a Trade from it's ID
     * @param tradeId 
     */
    public async getTradeById(tradeId: number, forUpdate?: string[]): Promise<model.economy.ExtendedTradeInfo> {
        let query = this.knex("trades").select(
            'id as tradeId',
            'userid_one as userIdOne',
            'userid_two as userIdTwo',
            'date',
            'status',
            'userid_one_primary as userIdOnePrimary',
            'userid_two_primary as userIdTwoPrimary',
        ).where({ 'id': tradeId });
        
        if (forUpdate) {
            query = query.forUpdate(forUpdate);
        }
        const res = await query;
        if (!res[0]) {
            throw new Error('InvalidTradeId');
        }
        return res[0];
    }

    /**
     * Decline/Cancel a Trade by it's ID
     * @param tradeId 
     */
    public async declineTradeById(tradeId: number): Promise<void> {
        await this.knex("trades").update({
            'status': model.economy.tradeStatus.Declined,
        }).where({
            'id': tradeId,
        }).limit(1);
    }

    /**
     * Mark a Trade as Accepted
     * @param tradeId 
     */
    public async markTradeAccepted(tradeId: number): Promise<void> {
        await this.knex("trades").update({
            'status': model.economy.tradeStatus.Accepted,
        }).where({
            'id': tradeId,
        }).limit(1);
    }

    /**
     * Get Items for a Trade
     * @param side 
     * @param tradeId 
     */
    public async getTradeItems(side: model.economy.tradeSides, tradeId: number): Promise<model.economy.TradeItems[]> {
        const items = await this.knex("trade_items").select("trade_items.trade_id as tradeId", "trade_items.userinventory_id as userInventoryId", "trade_items.catalog_id as catalogId", 'user_inventory.serial', 'catalog.average_price as averageSalesPrice').where({ "trade_id": tradeId, "side": side }).innerJoin('user_inventory', 'user_inventory.id', 'trade_items.userinventory_id').innerJoin('catalog', 'catalog.id', 'trade_items.catalog_id');
        if (!items[0]) {
            throw false;
        }
        return items;
    }
}

export default EconomyDAL;
