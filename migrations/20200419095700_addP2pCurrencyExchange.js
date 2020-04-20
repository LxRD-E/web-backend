/**
 * Add p2p currency exchange
 */

exports.up = async (knex, Promise) => {
    await knex.schema.createTable("currency_exchange_position", (t) => {
        t.bigIncrements('id').primary().unsigned(); // internal
        t.bigInteger('user_id').notNullable().unsigned(); // userid
        t.bigInteger('balance').notNullable().unsigned(); // current balance of the position
        t.integer('currency_type').notNullable().unsigned(); // currency type to sell
        t.float('rate').notNullable().unsigned(); // current rate (minimum amount a person can buy is this * 100 if float)
        t.datetime('created_at').notNullable().defaultTo(knex.fn.now()); // date position was created
        t.datetime('updated_at').notNullable().defaultTo(knex.fn.now()); // date position was updated

        // Add indexes
        t.index('user_id');
        t.index(['rate','balance','currency_type']);
    });
    await knex.schema.createTable('currency_exchange_record', t => {
        t.bigIncrements('id').primary().unsigned(); // internal
        t.bigInteger('buyer_user_id').notNullable().unsigned(); // buyer id
        t.bigInteger('position_id').notNullable().unsigned(); // currency_exchange_position.id
        t.bigInteger('amount_purchased').notNullable().unsigned(); // amount of currency that was purchased (given to buyer_user_id)
        t.bigInteger('amount_sold').notNullable().unsigned(); // amount of currency that was sold (given to owner of currency_exchange_position.id)
        t.datetime('created_at').notNullable().defaultTo(knex.fn.now()); // date transaction was purchased
        t.datetime('updated_at').notNullable().defaultTo(knex.fn.now()); // date transaction was updated

        // Add indexes
        t.index('buyer_user_id');
        t.index('position_id');
    });
    await knex.schema.createTable('currency_exchange_fund', t => {
        t.bigIncrements('id').primary().unsigned(); // internal
        t.bigInteger('position_id').notNullable().unsigned(); // currency_exchange_position.id
        t.bigInteger('amount').notNullable(); // amount of currency that was added (or removed) to/from position
        t.datetime('created_at').notNullable().defaultTo(knex.fn.now()); // date transaction was purchased
        t.datetime('updated_at').notNullable().defaultTo(knex.fn.now()); // date transaction was updated

        // Add indexes
        t.index('position_id');
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.dropTable("currency_exchange_position");
    await knex.schema.dropTable("currency_exchange_record");
    await knex.schema.dropTable("currency_exchange_fund");
};