/**
 * Add catalog_comments.is_deleted
 */

exports.up = async (knex, Promise) => {
    await knex.schema.alterTable("trades", (t) => {
        t.integer('userid_one_primary').defaultTo(0).unsigned().notNullable();
        t.integer('userid_two_primary').defaultTo(0).unsigned().notNullable();
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.alterTable("trades", (t) => {
        t.dropColumn('userid_one_primary');
        t.dropColumn('userid_two_primary');
    });
};