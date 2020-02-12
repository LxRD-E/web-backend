/**
 * Add Balances to Groups
 */

exports.up = async (knex, Promise) => {
    /**
     * Add Group Balances
     */
    await knex.schema.alterTable("groups", (t) => {
        t.integer("balance_one").notNullable().defaultTo(0);
        t.integer("balance_two").notNullable().defaultTo(0);
    });
};

exports.down = async (knex, Promise) => {
    /**
     * Remove Group Balances
     */
    await knex.schema.alterTable("groups", (t) => {
        t.dropColumn('balance_one');
        t.dropColumn('balance_two');
    });
};