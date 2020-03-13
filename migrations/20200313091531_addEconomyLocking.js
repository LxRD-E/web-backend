/**
 * Add economy_lock to users
 */

exports.up = async (knex, Promise) => {
    await knex.schema.alterTable("users", (t) => {
        t.boolean('economy_lock').defaultTo(false).notNullable();
        t.datetime('economy_lock_date').notNullable().defaultTo(knex.fn.now()); // date lock was created
    });
};

exports.down = async (knex, Promise) => {
    /**
     * Remove economy_lock
     */
    await knex.schema.alterTable("users", (t) => {
        t.dropColumn('economy_lock');
        t.dropColumn('economy_lock_date');
    });
};