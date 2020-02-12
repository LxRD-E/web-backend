/**
 * Add Post count to Users Table
*/
exports.up = async (knex, Promise) => {
    await knex.schema.alterTable("users", (t) => {
        t.integer("forum_postcount").notNullable().defaultTo(0);
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.alterTable("users", (t) => {
        t.dropColumn("forum_postcount");
    });
};