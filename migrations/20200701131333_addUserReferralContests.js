/**
 * Add referral contest system
 */

exports.up = async (knex, Promise) => {
    // table for the referral codes
    await knex.schema.createTable('user_referral_contest', t => {
        t.bigIncrements('id').primary().unsigned(); // contest id

        t.datetime('created_at').notNullable().defaultTo(knex.fn.now()); // date the contest was created
        t.datetime('updated_at').defaultTo(null); // date the contest was last modified

        t.datetime('ended_at').defaultTo(null); // date the contest ended. null = not ended
        t.bigInteger('winner_user_id').unsigned().defaultTo(null) // the user id who won the contest
    });
    // actually used referral codes by users who signed up
    await knex.schema.createTable('user_referral_contest_entry', t => {
        t.bigIncrements('id').primary().unsigned(); // entry id
        t.bigInteger('user_id').notNullable().unsigned(); // user id who was entered
        t.bigInteger('referral_id').notNullable().unsigned(); // id of the referral code used
        t.bigInteger('contest_id').notNullable().unsigned(); // id of the referral code used
        t.integer('type').notNullable(); // the entry type (1 = user was referred, 2 = user referred another user)

        t.datetime('created_at').notNullable().defaultTo(knex.fn.now()); // date the contest entry was created
        t.datetime('updated_at').notNullable().defaultTo(knex.fn.now()); // date the contest entry was last modified

        t.index(['referral_id']); // add an index to the referral_id
        t.index(['user_id']); // user id index
        t.index(['contest_id']); // contest id index
    });
    await knex.schema.alterTable('user_referral_contest_entry', t => {
        t.foreign('user_id').references('users.id'); // user id foreign
        t.foreign('referral_id').references('user_referral.id'); // referral id foreign
        t.foreign('contest_id').references('user_referral_contest.id'); // contest id foreign
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.alterTable('user_referral_contest_entry', t => {
        t.dropForeign(['user_id']);
        t.dropForeign(['referral_id']);
    })
    await knex.schema.dropTable("user_referral_contest");
    await knex.schema.dropTable("user_referral_contest_entry");
};