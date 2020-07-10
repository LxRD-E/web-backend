/**
 * Convert users.id to unsigned bigint auto increment
 */

exports.up = async (knex, Promise) => {
    // alter users table to use unsigned
    await knex.raw('ALTER TABLE `users` CHANGE `id` `id` BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT;')
};

exports.down = async (knex, Promise) => {
    // alter users table to use signed
    await knex.raw('ALTER TABLE `users` CHANGE `id` `id` BIGINT(20) NOT NULL AUTO_INCREMENT;')
};