/**
 * Add users.2fa_enabled  & users.2fa_secret
 */

exports.up = async (knex, Promise) => {
    /**
     * Add 2fa_enabled & 2fa_secret
     */
    await knex.schema.alterTable("users", (t) => {
        t.boolean('2fa_enabled').notNullable().defaultTo(false);
        t.string('2fa_secret',255).defaultTo(null);
    });
};

exports.down = async (knex, Promise) => {
    /**
     * Remove 2fa_enabled & 2fa_secret
     */
    await knex.schema.alterTable("users", (t) => {
        t.dropColumn('2fa_enabled');
        t.dropColumn('2fa_secret');
    });
};