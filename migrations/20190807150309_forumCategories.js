exports.up = async (knex, Promise) => {
    await knex.schema.createTable("forum_categories", (t) => {
        t.increments('id').primary();
        t.string("title", 64);
        t.string("description", 256);
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.dropTable("forum_categories");
};