exports.up = async (knex, Promise) => {
    await knex.schema.alterTable("forum_threads", (t) => {
        t.integer("userid", 20).notNullable();
        t.dateTime("date_created").notNullable();
        t.dateTime("date_edited").notNullable();
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.alterTable("forum_threads", (t) => {
        t.dropColumn("userid");
        t.dropColumn("date_created");
        t.dropColumn("date_edited");
    });
};