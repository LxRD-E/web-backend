/**
 * Game Server DB
 */

exports.up = async (knex, Promise) => {
    await knex.schema.createTable("game_server", (t) => {
        t.increments('id').primary().unsigned();
        t.integer('game_id').notNullable();
        t.datetime('created_at').notNullable().defaultTo(knex.fn.now());
        t.integer('player_count').notNullable().defaultTo(0);
        t.integer('is_closed').notNullable().defaultTo(0); // 0 = false, 1 = true
    });
    await knex.schema.createTable("game_server_player", (t) => {
        t.increments('id').primary().unsigned();
        t.integer('game_server_id').notNullable().unsigned();
        t.integer('user_id').unsigned().notNullable();
        t.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.dropTable("game_server");
    await knex.schema.dropTable("game_server_player");
};