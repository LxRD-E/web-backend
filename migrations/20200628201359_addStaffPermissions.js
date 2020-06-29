/**
 * Add staff permissions for more concise control
 */

exports.up = async (knex, Promise) => {
    await knex.schema.createTable('user_staff_permission', t => {
        t.bigInteger('user_id').notNullable().unsigned(); // staff user id
        t.integer('permission').notNullable().unsigned(); // the permission enum
        t.datetime('created_at').notNullable().defaultTo(knex.fn.now()); // date the permission was created
        t.datetime('updated_at').notNullable().defaultTo(knex.fn.now()); // date the permission was last modified

        t.unique(['user_id','permission']); // prevent duplicate permissions
        t.index(['user_id']); // allow fast lookups
    });
    // migrate old users
    await knex('users').update({'user_staff': 1}).where('user_staff','>',1);
    // give special perms to owners
    await knex('users').update({'user_staff': 100}).where({
        'id': 5,
    });
    await knex('users').update({'user_staff': 100}).where({
        'id': 2,
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.dropTable("user_staff_permission");
};