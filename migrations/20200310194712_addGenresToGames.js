/**
 * Add genres to games
 */

exports.up = async (knex, Promise) => {
    await knex.schema.alterTable("game", (t) => {
        t.integer('genre').unsigned().defaultTo(1).notNullable();
    });
};

exports.down = async (knex, Promise) => {
    /**
     * Remove genre column
     */
    await knex.schema.alterTable("game", (t) => {
        t.dropColumn('genre');
    });
};