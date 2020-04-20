/**
 * Add is_developer boolean to users table, which allows users to create/edit games
 *
 * eg:
 * if (user.is_developer === 1) {
 *     await createGame();
 * }else{
 *     throw new Error('Invalid Permissions');
 * }
 */

exports.up = async (knex, Promise) => {
    await knex.schema.alterTable("users", (t) => {
        t.boolean('is_developer').notNullable().defaultTo(false);
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.alterTable("users", (t) => {
        t.dropColumn('is_developer');
    });
};