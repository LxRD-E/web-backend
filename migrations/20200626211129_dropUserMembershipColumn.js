exports.up = async (knex, Promise) => {
    await knex.schema.alterTable("users", (t) => {
        t.dropColumn('user_membership')
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.alterTable("users", (t) => {
        t.dateTime("user_membership");
    });
};