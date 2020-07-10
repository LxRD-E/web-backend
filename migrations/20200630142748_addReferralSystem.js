/**
 * Add referral system
 */

exports.up = async (knex, Promise) => {
    // table for the referral codes
    await knex.schema.createTable('user_referral', t => {
        t.bigIncrements('id').primary().unsigned(); // referral id
        t.bigInteger('user_id').notNullable().unsigned(); // user id

        t.datetime('created_at').notNullable().defaultTo(knex.fn.now()); // date the referral code was created
        t.datetime('updated_at').notNullable().defaultTo(knex.fn.now()); // date the referral code was last modified

        t.unique('user_id'); // prevent duplicate codes
    });
    await knex.schema.alterTable('user_referral', t => {
        t.foreign('user_id').references('users.id');
    });
    // actually used referral codes by users who signed up
    await knex.schema.createTable('user_referral_use', t => {
        t.bigIncrements('id').primary().unsigned(); // internal
        t.bigInteger('user_id').notNullable().unsigned(); // user id who used the code
        t.bigInteger('referral_id').notNullable().unsigned(); // id of the referral code used

        t.datetime('created_at').notNullable().defaultTo(knex.fn.now()); // date the referral code was used
        t.datetime('updated_at').notNullable().defaultTo(knex.fn.now()); // date the referral code was last modified

        t.unique('user_id'); // prevent duplicate referral codes being used by one user (also add an index to user_id for fast lookups)
        t.index(['referral_id']); // add an index to the referral_id
    });
    await knex.schema.alterTable('user_referral_use', t => {
        t.foreign('user_id').references('users.id'); // user id foreign
        t.foreign('referral_id').references('user_referral.id'); // referral id foreign
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.alterTable('user_referral', t => {
        t.dropForeign(['user_id']);
    })
    await knex.schema.alterTable('user_referral_use', t => {
        t.dropForeign(['user_id']);
        t.dropForeign(['referral_id']);
    })
    await knex.schema.dropTable("user_referral");
    await knex.schema.dropTable("user_referral_use");
};