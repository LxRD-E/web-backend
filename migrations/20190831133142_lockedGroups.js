/**
 * Add a Group Status Type to groups to allow groups to be locked
 */
exports.up = async (knex, Promise) => {
    await knex.schema.alterTable("groups", (t) => {
        t.integer("status").notNullable().defaultTo(0);
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.alterTable("groups", (t) => {
        t.dropColumn("status");
    });
};