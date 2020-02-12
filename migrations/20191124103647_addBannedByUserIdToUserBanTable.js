/**
 * Add Deleted Option for accounts that are deleted from the website
 */

exports.up = async (knex, Promise) => {
    /**
     * Add Is Deleted Column
     */
    await knex.schema.alterTable("user_moderation", (t) => {
        t.integer("actor_userid").notNullable().defaultTo(1);
    });
};

exports.down = async (knex, Promise) => {
    /**
     * Remove Ban Is Deleted Column
     */
    await knex.schema.alterTable("user_moderation", (t) => {
        t.dropColumn('actor_userid');
    });
};