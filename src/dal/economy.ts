/**
 * Imports
 */
import * as economy from '../models/v1/economy';
import * as catalog from '../models/v1/catalog';
import _init from './_init';

class EconomyDAL extends _init {
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
     */
    public async createTransaction(userIdTo: number, userIdFrom: number, amount: number, currency: economy.currencyType, type: economy.transactionType, description: string, fromType: catalog.creatorType, toType: catalog.creatorType, catalogId?: number, userInventoryId?: number): Promise<void> {
        let numericCatalogId;
        if (!catalogId) {
            numericCatalogId = 0;
        }else{
            numericCatalogId = catalogId;
        }
        let numericInventoryId;
        if (userInventoryId === undefined) {
            numericInventoryId = null;
        }else{
            numericInventoryId = userInventoryId;
        }
        await this.knex("transactions").insert({"userid_to":userIdTo,"userid_from":userIdFrom,"amount":amount,"currency":currency,"type":type,"description":description,"catalogid":numericCatalogId,"user_inventoryid":numericInventoryId,"from_type":fromType,"to_type":toType});
    }

    /**
     * Add the amount of currency specified to a user's balance
     * @param userId User's ID
     * @param amount Amount of Currency
     * @param currency Currency Type
     */
    public async addToUserBalance(userId: number, amount: number, currency: economy.currencyType): Promise<void> {
        if (currency === economy.currencyType.primary) {
            const balance = await this.knex("users").select("user_balance1").where({"id":userId});
            if (balance && balance[0] && balance[0]["user_balance1"] !== undefined) {
                const currentBalance = balance[0]["user_balance1"];
                const newBalance = currentBalance + amount;
                await this.knex("users").update({"user_balance1":newBalance}).where({"id":userId});
            }else{
                throw economy.userBalanceErrors.InvalidUserId;
            }
        }else if (currency === economy.currencyType.secondary) {
            const balance = await this.knex("users").select("user_balance2").where({"id":userId});
            if (balance && balance[0] && balance[0]["user_balance2"] !== undefined) {
                const currentBalance = balance[0]["user_balance2"];
                const newBalance = currentBalance + amount;
                await this.knex("users").update({"user_balance2":newBalance}).where({"id":userId});
            }else{
                throw economy.userBalanceErrors.InvalidUserId;
            }
        }else{
            throw economy.userBalanceErrors.InvalidCurrencyType;
        }
    }

    /**
     * Subtract the amount of currency specified from a user's balance
     * @param userId User's ID
     * @param amount Amount of Currency
     * @param currency Currency Type
     */
    public async subtractFromUserBalance(userId: number, amount: number, currency: economy.currencyType): Promise<void> {
        if (currency === economy.currencyType.primary) {
            const balance = await this.knex("users").select("user_balance1").where({"id":userId});
            if (balance && balance[0] && balance[0]["user_balance1"] !== undefined) {
                const currentBalance = balance[0]["user_balance1"];
                const newBalance = currentBalance - amount;
                if (newBalance < 0) {
                    throw economy.userBalanceErrors.NotEnoughCurrency;
                }
                await this.knex("users").update({"user_balance1":newBalance}).where({"id":userId});
            }else{
                throw economy.userBalanceErrors.InvalidUserId;
            }
        }else if (currency === economy.currencyType.secondary) {
            const balance = await this.knex("users").select("user_balance2").where({"id":userId});
            if (balance && balance[0] && balance[0]["user_balance2"] !== undefined) {
                const currentBalance = balance[0]["user_balance2"];
                const newBalance = currentBalance - amount;
                if (newBalance < 0) {
                    throw economy.userBalanceErrors.NotEnoughCurrency;
                }
                await this.knex("users").update({"user_balance2":newBalance}).where({"id":userId});
            }else{
                throw economy.userBalanceErrors.InvalidUserId;
            }
        }else{
            throw economy.userBalanceErrors.InvalidCurrencyType;
        }
    }

    /**
     * Add the amount of currency specified to a group's balance
     * @param groupId Group's ID
     * @param amount Amount of Currency
     * @param currency Currency Type
     */
    public async addToGroupBalance(groupId: number, amount: number, currency: economy.currencyType): Promise<void> {
        if (currency === economy.currencyType.primary) {
            const balance = await this.knex("groups").select("balance_one").where({"id":groupId});
            if (balance && balance[0] && balance[0]["balance_one"] !== undefined) {
                const currentBalance = balance[0]["balance_one"];
                const newBalance = currentBalance + amount;
                await this.knex("groups").update({"balance_one":newBalance}).where({"id":groupId});
            }else{
                throw economy.userBalanceErrors.InvalidUserId;
            }
        }else if (currency === economy.currencyType.secondary) {
            const balance = await this.knex("groups").select("balance_two").where({"id":groupId});
            if (balance && balance[0] && balance[0]["balance_two"] !== undefined) {
                const currentBalance = balance[0]["balance_two"];
                const newBalance = currentBalance + amount;
                await this.knex("groups").update({"balance_two":newBalance}).where({"id":groupId});
            }else{
                throw economy.userBalanceErrors.InvalidUserId;
            }
        }else{
            throw economy.userBalanceErrors.InvalidCurrencyType;
        }
    }

    /**
     * Subtract the amount of currency specified from a group's balance
     * @param groupId Group's ID
     * @param amount Amount of Currency
     * @param currency Currency Type
     */
    public async subtractFromGroupBalance(groupId: number, amount: number, currency: economy.currencyType): Promise<void> {
        if (currency === economy.currencyType.primary) {
            const balance = await this.knex("groups").select("balance_one").where({"id":groupId});
            if (balance && balance[0] && balance[0]["balance_one"] !== undefined) {
                const currentBalance = balance[0]["balance_one"];
                const newBalance = currentBalance - amount;
                if (newBalance < 0) {
                    throw economy.userBalanceErrors.NotEnoughCurrency;
                }
                await this.knex("groups").update({"balance_one":newBalance}).where({"id":groupId});
            }else{
                throw economy.userBalanceErrors.InvalidUserId;
            }
        }else if (currency === economy.currencyType.secondary) {
            const balance = await this.knex("groups").select("balance_two").where({"id":groupId});
            if (balance && balance[0] && balance[0]["balance_two"] !== undefined) {
                const currentBalance = balance[0]["balance_two"];
                const newBalance = currentBalance - amount;
                if (newBalance < 0) {
                    throw economy.userBalanceErrors.NotEnoughCurrency;
                }
                await this.knex("groups").update({"balance_two":newBalance}).where({"id":groupId});
            }else{
                throw economy.userBalanceErrors.InvalidUserId;
            }
        }else{
            throw economy.userBalanceErrors.InvalidCurrencyType;
        }
    }

    /**
     * Get a User's Transactions
     * @param userId 
     * @param offset 
     */
    public async getUserTransactions(userId: number, offset: number): Promise<economy.userTransactions[]> {
        const results = await this.knex("transactions").select("id as transactionId","userid_from as userId","amount","currency","date","type as transactionType","description","catalogid as catalogId","user_inventoryid as userInventoryId").limit(25).offset(offset).orderBy('id', 'desc').where({"userid_to":userId,"to_type":catalog.creatorType.User});
        return results as economy.userTransactions[];
    }

    /**
     * Convert a Currency to another currency. All this does is return a number; it doesn't actually convert currency for the user
     * @param amount Amount of Currency
     * @param currency Currency Type
     */
    public async convertCurrency(amount: number, currency: economy.currencyType): Promise<number> {
        if (currency === economy.currencyType.primary) {
            const newAmt = amount / 10;
            return Math.abs(newAmt); 
        }else if (currency === economy.currencyType.secondary) {
            return amount * 10;
        }else{
            throw false;
        }
    }
    /**
     * Create a trade. Returns the trade's id if successful
     * @param userIdOne 
     * @param userIdTwo 
     */
    public async createTrade(userIdOne: number, userIdTwo: number): Promise<number> {
        const tradeData = await this.knex("trades").insert({
            'userid_one': userIdOne,
            'userid_two': userIdTwo,
            'status': economy.tradeStatus.Pending,
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
    public async addItemsToTrade(tradeId: number, side: economy.tradeSides, items: economy.TradeItemObject[]): Promise<void> {
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
        const pending = await this.knex("trades").count("id as Total").where({"userid_one":userIdOne,"userid_two":userIdTwo,"status":economy.tradeStatus.Pending}).orWhere({"userid_two":userIdOne,"userid_one":userIdTwo,"status":economy.tradeStatus.Pending});
        return pending[0]["Total"] as number;
    }

    /**
     * Get Trades for a User. DESC Order
     * @param tradeType 
     * @param offset 
     */
    public async getTrades(userId: number, tradeType: string, offset: number): Promise<economy.TradeInfo[]> {
        let tradeNumber;
        let query;
        if (tradeType !== 'inbound') {
            if (tradeType === 'outbound') {
                tradeNumber = 0;
                query = await this.knex("trades").where({'userid_one':userId,"status":tradeNumber}).select(
                    'id as tradeId',
                    'userid_two as userId',
                    'date',
                ).limit(25).offset(offset).orderBy("id", "DESC");
            }else if (tradeType === 'inactive') {
                tradeNumber = 2;
                const selectionOfTrades = await this.knex("trades").where({'userid_two':userId,"status":tradeNumber}).orWhere({'userid_one':userId,"status":tradeNumber}).select(
                    'id as tradeId',
                    'userid_one',
                    'userid_two',
                    'date',
                ).limit(25).offset(offset).orderBy("id", "DESC");
                query = [];
                for (const trade of selectionOfTrades) {
                    if (trade.userid_one === userId) {
                        query.push({
                            'tradeId': trade.tradeId,
                            'userId': trade.userid_two,
                            'date': trade.date,
                        });
                    }else{
                        query.push({
                            'tradeId': trade.tradeId,
                            'userId': trade.userid_one,
                            'date': trade.date,
                        });
                    }
                }
            }else{
                tradeNumber = 1;
                const selectionOfTrades = await this.knex("trades").where({'userid_one':userId,"status":tradeNumber}).orWhere({'userid_two':userId,"status":tradeNumber}).select(
                    'id as tradeId',
                    'userid_two',
                    'userid_one',
                    'date',
                ).limit(25).offset(offset).orderBy("id", "DESC");
                query = [];
                for (const trade of selectionOfTrades) {
                    if (trade.userid_one === userId) {
                        query.push({
                            'tradeId': trade.tradeId,
                            'userId': trade.userid_two,
                            'date': trade.date,
                        });
                    }else{
                        query.push({
                            'tradeId': trade.tradeId,
                            'userId': trade.userid_one,
                            'date': trade.date,
                        });
                    }
                }
            }
        }else{
            tradeNumber = 0;
            query = await this.knex("trades").where({'userid_two':userId,"status":tradeNumber}).select(
                'id as tradeId',
                'userid_one as userId',
                'date',
            ).limit(25).offset(offset).orderBy("id", "DESC");
        }
        return query;
    }

    /**
     * Get a Trade from it's ID
     * @param tradeId 
     */
    public async getTradeById(tradeId: number): Promise<economy.ExtendedTradeInfo> {
        const query = await this.knex("trades").select(
            'id as tradeId',
            'userid_one as userIdOne',
            'userid_two as userIdTwo',
            'date',
            'status',
        ).where({'id': tradeId});
        if (!query[0]) {
            throw false;
        }
        return query[0];
    }

    /**
     * Decline/Cancel a Trade by it's ID
     * @param tradeId 
     */
    public async declineTradeById(tradeId: number): Promise<void> {
        await this.knex("trades").update({
            'status': economy.tradeStatus.Declined,
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
            'status': economy.tradeStatus.Accepted,
        }).where({
            'id': tradeId,
        }).limit(1);
    }

    /**
     * Get Items for a Trade
     * @param side 
     * @param tradeId 
     */
    public async getTradeItems(side: economy.tradeSides, tradeId: number): Promise<economy.TradeItems[]> {
        const items = await this.knex("trade_items").select("trade_id as tradeId","userinventory_id as userInventoryId","catalog_id as catalogId").where({"trade_id":tradeId,"side":side});
        if (!items[0]) {
            throw false;
        }
        return items;
    }
}

export default EconomyDAL;
