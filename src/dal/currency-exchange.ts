/**
 * Imports
 */
import * as model from '../models/models';
import _init from './_init';

/**
 * Currency Exchange Data Access Layer
 */
export default class CurrencyExchangeDAL extends _init {
    public async getOpenPositionsByUserId(
        userId: number,
        limit: number,
        offset: number,
    ): Promise<model.currencyExchange.OpenCurrencyPositionsEntry[]>{
        return this.knex('currency_exchange_position')
            .select(
            'id as positionId',
            'user_id as userId',
            'balance',
            'currency_type as currencyType',
            'rate',
            'created_at as createdAt',
            'updated_at as updatedAt')
            .where({
                'user_id': userId,
            })
            .andWhere('balance', '>', 0)
            .limit(limit)
            .offset(offset);
    }

    public async getOpenPositionsByCurrency(
        currencyType: model.economy.currencyType,
        limit: number,
        offset: number,
    ): Promise<model.currencyExchange.OpenCurrencyPositionsEntry[]>{
        return this.knex('currency_exchange_position')
            .select(
                'id as positionId',
                'user_id as userId',
                'balance',
                'currency_type as currencyType',
                'rate',
                'created_at as createdAt',
                'updated_at as updatedAt')
            .where({
                'currency_type': currencyType,
            })
            .andWhere('balance', '>', 0)
            .limit(limit)
            .orderBy('rate','asc') // order by lowest rate
            .offset(offset);
    }

    /**
     * Create a position (only insert into table). Returns the ID of the position.
     * @param userId
     * @param balance
     * @param currencyType
     * @param rate
     */
    public async createPosition(userId: number, balance: number, currencyType: model.economy.currencyType, rate: number): Promise<number> {
        let results = await this.knex('currency_exchange_position').insert({
            'user_id': userId,
            'balance': balance,
            'currency_type': currencyType,
            'rate': rate,
        });
        return results[0] as number;
    }

    public async recordPositionFunding(positionId: number, amount: number): Promise<void> {
        await this.knex('currency_exchange_fund').insert({
            'position_id': positionId,
            'amount': amount,
        });
    }

    /**
     * Get funding data for position
     * @param positionId
     */
    public async getPositionFunding(positionId: number): Promise<model.currencyExchange.PositionFundingHistory[]> {
        return this.knex('currency_exchange_fund').select(
            'amount',
            'created_at as createdAt',
        ).where({
            'position_id': positionId,
        }).orderBy('id','desc');
    }

    public async getHistoricalExchangeRecords(currencyType: model.economy.currencyType): Promise<model.currencyExchange.HistoricalExchangeRecord[]> {
        return this.knex('currency_exchange_position')
            .select(
                'currency_exchange_record.amount_purchased as amountPurchased',
                'currency_exchange_record.amount_sold as amountSold',
                'currency_exchange_record.created_at as createdAt',
                'currency_exchange_position.rate',
                'currency_exchange_record.buyer_user_id as buyerUserId',
                'currency_exchange_position.user_id as sellerUserId',
            ).innerJoin(
                'currency_exchange_record',
                'currency_exchange_record.position_id',
                'currency_exchange_position.id'
            ).where({
                'currency_exchange_position.currency_type': currencyType,
            }).orderBy('currency_exchange_record.id','desc');
    }

    public async getPositionById(id: number): Promise<model.currencyExchange.OpenCurrencyPositionsEntry> {
        let result = await this.knex('currency_exchange_position')
            .select(
                'id as positionId',
                'user_id as userId',
                'balance',
                'currency_type as currencyType',
                'rate',
                'created_at as createdAt',
                'updated_at as updatedAt')
            .where({
                'id': id,
            })
            .limit(1)
        if (!result[0]) {
            throw new Error('InvalidPositionId');
        }
        return result[0];
    }

    /**
     * Subtract currency amount from a position
     * @param positionId
     * @param amountToSubtract
     */
    public async subtractFromPositionBalance(positionId: number, amountToSubtract: number): Promise<void> {
        await this.knex('currency_exchange_position').decrement('balance', amountToSubtract).where({
            'id': positionId,
        }).limit(1);
    }

    public async recordCurrencyExchange(positionId: number, buyerUserId: number, amountPurchased: number, amountSold: number): Promise<number> {
        let results = await this.knex('currency_exchange_record').insert({
            'buyer_user_id': buyerUserId,
            'position_id': positionId,
            'amount_purchased': amountPurchased,
            'amount_sold': amountSold,
        });
        return results[0] as number;
    }
}
