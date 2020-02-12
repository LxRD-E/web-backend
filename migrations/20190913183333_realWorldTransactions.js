/**
 * Add Real-World Transactions
 */

exports.up = async (knex, Promise) => {
    await knex.schema.createTable("currency_products", (t) => {
        // id
        t.increments('id').primary().unsigned();
        // USD Price
        t.float('usd_price').notNullable();
        // Currency Amt
        t.integer('currency_amount').notNullable();
        // Bonus Item ID
        t.integer('bonus_catalogid').notNullable().defaultTo(0);
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.dropTable("currency_products");
};