/**
 * Add Deleted Option for accounts that are deleted from the website
 */

exports.up = async (knex, Promise) => {
    /**
     * Add Is Deleted Column
     */
    await knex.schema.alterTable("users", (t) => {
        t.integer("account_status").notNullable().defaultTo(0);
    });
};

exports.down = async (knex, Promise) => {
    /**
     * Remove Ban Is Deleted Column
     */
    await knex.schema.alterTable("users", (t) => {
        t.dropColumn('account_status');
    });
};