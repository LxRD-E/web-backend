/**
 * Forgot to add a forum body to forum_posts ;-;
*/
exports.up = async (knex, Promise) => {
    await knex.schema.alterTable("forum_posts", (t) => {
        t.text("post_body").notNullable();
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.alterTable("forum_posts", (t) => {
        t.dropColumn("post_body");
    });
};