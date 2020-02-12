/**
 * Add Real-World Currency Transaction Products
 */

exports.up = async (knex, Promise) => {
    await knex('currency_products').insert({
        'usd_price': 4.99,
        'currency_amount': 399,
    });
    await knex('currency_products').insert({
        'usd_price': 9.99,
        'currency_amount': 899,
    });
    await knex('currency_products').insert({
        'usd_price': 18.99,
        'currency_amount': 1899,
    });
    await knex('currency_products').insert({
        'usd_price': 40.99,
        'currency_amount': 4250,
    });
};

exports.down = async (knex, Promise) => {
    await knex('currency_products').truncate();
};