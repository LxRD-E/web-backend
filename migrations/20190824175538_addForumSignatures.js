/**
 * Add Forum Signatures to users table
 */
exports.up = async (knex, Promise) => {
    await knex.schema.alterTable("users", (t) => {
        t.string("forum_signature").defaultTo(null);
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.alterTable("users", (t) => {
        t.dropColumn("forum_signature");
    });
};