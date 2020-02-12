/**
 * Change encoding from some latin thing to utf8mb4_unicode_ci
 */
exports.up = async (knex, Promise) => {
    await knex.schema.alterTable('catalog', (t) => {
        t.string('name', 256).collate('utf8mb4_unicode_ci').alter();
        t.string('description', 1024).collate('utf8mb4_unicode_ci').alter();
    });
    await knex.schema.alterTable('catalog_comments', (t) => {
        t.text('comment').collate('utf8mb4_unicode_ci').alter();
    });
    await knex.schema.alterTable('chat_messages', (t) => {
        t.string('content', 255).collate('utf8mb4_unicode_ci').alter();
    });
    await knex.schema.alterTable('forum_posts', (t) => {
        t.text('post_body').collate('utf8mb4_unicode_ci').alter();
    });
    await knex.schema.alterTable('forum_subcategories', (t) => {
        t.string('title',64).collate('utf8mb4_unicode_ci').alter();
        t.string('description',256).collate('utf8mb4_unicode_ci').alter();
    });
    await knex.schema.alterTable('forum_threads', (t) => {
        t.string('title',64).collate('utf8mb4_unicode_ci').alter();
    });
    await knex.schema.alterTable('groups', (t) => {
        t.string('name',75).collate('utf8mb4_unicode_ci').alter();
        t.text('description').collate('utf8mb4_unicode_ci').alter();
    });
    await knex.schema.alterTable('group_roles', (t) => {
        t.string('name',50).collate('utf8mb4_unicode_ci').alter();
        t.string('description',100).collate('utf8mb4_unicode_ci').alter();
    });
    await knex.schema.alterTable('group_shout', (t) => {
        t.text('shout').collate('utf8mb4_unicode_ci').alter();
    });
    await knex.schema.alterTable('group_wall', (t) => {
        t.text('content').collate('utf8mb4_unicode_ci').alter();
    });
    await knex.schema.alterTable('user_messages', (t) => {
        t.string('message_subject', 128).collate('utf8mb4_unicode_ci').alter();
        t.text('message_body').collate('utf8mb4_unicode_ci').alter();
    });
    await knex.schema.alterTable('user_staff_comments', (t) => {
        t.text('comment').collate('utf8mb4_unicode_ci').alter();
    });
    await knex.schema.alterTable('user_status', (t) => {
        t.string('status',255).collate('utf8mb4_unicode_ci').alter();
    });
    await knex.schema.alterTable('users', (t) => {
        t.string('user_status',128).collate('utf8mb4_unicode_ci').alter();
        t.string('user_blurb',1024).collate('utf8mb4_unicode_ci').alter();
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.alterTable('catalog', (t) => {
        t.string('name', 512).collate('latin1_swedish_ci').alter();
        t.string('description', 4096).collate('latin1_swedish_ci').alter();
    });
    await knex.schema.alterTable('catalog_comments', (t) => {
        t.text('comment').collate('latin1_swedish_ci').alter();
    });
    await knex.schema.alterTable('chat_messages', (t) => {
        t.string('content', 255).collate('latin1_swedish_ci').alter();
    });
    await knex.schema.alterTable('forum_posts', (t) => {
        t.text('post_body').collate('latin1_swedish_ci').alter();
    });
    await knex.schema.alterTable('forum_subcategories', (t) => {
        t.string('title',64).collate('latin1_swedish_ci').alter();
        t.string('description',256).collate('latin1_swedish_ci').alter();
    });
    await knex.schema.alterTable('forum_threads', (t) => {
        t.string('title',64).collate('latin1_swedish_ci').alter();
    });
    await knex.schema.alterTable('groups', (t) => {
        t.string('name',75).collate('latin1_swedish_ci').alter();
        t.text('description').collate('latin1_swedish_ci').alter();
    });
    await knex.schema.alterTable('group_roles', (t) => {
        t.string('name',50).collate('latin1_swedish_ci').alter();
        t.string('description',100).collate('latin1_swedish_ci').alter();
    });
    await knex.schema.alterTable('group_shout', (t) => {
        t.text('shout').collate('latin1_swedish_ci').alter();
    });
    await knex.schema.alterTable('group_wall', (t) => {
        t.text('content').collate('latin1_swedish_ci').alter();
    });
    await knex.schema.alterTable('user_messages', (t) => {
        t.string('message_subject', 128).collate('latin1_swedish_ci').alter();
        t.text('message_body').collate('latin1_swedish_ci').alter();
    });
    await knex.schema.alterTable('user_staff_comments', (t) => {
        t.text('comment').collate('latin1_swedish_ci').alter();
    });
    await knex.schema.alterTable('user_status', (t) => {
        t.string('status',255).collate('latin1_swedish_ci').alter();
    });
    await knex.schema.alterTable('users', (t) => {
        t.string('user_status',128).collate('utf8mb4_bin').alter(); // idk why this was binary
        t.string('user_blurb',1024).collate('latin1_swedish_ci').alter();
    });
};
