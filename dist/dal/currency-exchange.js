"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _init_1 = require("./_init");
class CurrencyExchangeDAL extends _init_1.default {
    async getOpenPositionsByUserId(userId, limit, offset) {
        return this.knex('currency_exchange_position')
            .select('id as positionId', 'user_id as userId', 'balance', 'currency_type as currencyType', 'rate', 'created_at as createdAt', 'updated_at as updatedAt')
            .where({
            'user_id': userId,
        })
            .andWhere('balance', '>', 0)
            .limit(limit)
            .offset(offset);
    }
    async getOpenPositionsByCurrency(currencyType, limit, offset) {
        return this.knex('currency_exchange_position')
            .select('id as positionId', 'user_id as userId', 'balance', 'currency_type as currencyType', 'rate', 'created_at as createdAt', 'updated_at as updatedAt')
            .where({
            'currency_type': currencyType,
        })
            .andWhere('balance', '>', 0)
            .limit(limit)
            .orderBy('rate', 'asc')
            .offset(offset);
    }
    async createPosition(userId, balance, currencyType, rate) {
        let results = await this.knex('currency_exchange_position').insert({
            'user_id': userId,
            'balance': balance,
            'currency_type': currencyType,
            'rate': rate,
        });
        return results[0];
    }
    async recordPositionFunding(positionId, amount) {
        await this.knex('currency_exchange_fund').insert({
            'position_id': positionId,
            'amount': amount,
        });
    }
    async getPositionFunding(positionId) {
        return this.knex('currency_exchange_fund').select('amount', 'created_at as createdAt').where({
            'position_id': positionId,
        }).orderBy('id', 'desc');
    }
    async getHistoricalExchangeRecords(currencyType) {
        return this.knex('currency_exchange_position')
            .select('currency_exchange_record.amount_purchased as amountPurchased', 'currency_exchange_record.amount_sold as amountSold', 'currency_exchange_record.created_at as createdAt', 'currency_exchange_position.rate', 'currency_exchange_record.buyer_user_id as buyerUserId', 'currency_exchange_position.user_id as sellerUserId').innerJoin('currency_exchange_record', 'currency_exchange_record.position_id', 'currency_exchange_position.id').where({
            'currency_exchange_position.currency_type': currencyType,
        }).orderBy('currency_exchange_record.id', 'desc');
    }
    async getPositionById(id) {
        let result = await this.knex('currency_exchange_position')
            .select('id as positionId', 'user_id as userId', 'balance', 'currency_type as currencyType', 'rate', 'created_at as createdAt', 'updated_at as updatedAt')
            .where({
            'id': id,
        })
            .limit(1);
        if (!result[0]) {
            throw new Error('InvalidPositionId');
        }
        return result[0];
    }
    async subtractFromPositionBalance(positionId, amountToSubtract) {
        await this.knex('currency_exchange_position').decrement('balance', amountToSubtract).where({
            'id': positionId,
        }).limit(1);
    }
    async recordCurrencyExchange(positionId, buyerUserId, amountPurchased, amountSold) {
        let results = await this.knex('currency_exchange_record').insert({
            'buyer_user_id': buyerUserId,
            'position_id': positionId,
            'amount_purchased': amountPurchased,
            'amount_sold': amountSold,
        });
        return results[0];
    }
}
exports.default = CurrencyExchangeDAL;

