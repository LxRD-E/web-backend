/**
 * Clear thumbnail hashes and re-generate thumbs. This will take a very long time (about 10-30 seconds per user)
 */
const _staffController = require('../dist/controllers/v1/staff').StaffController;
const staff = new _staffController();

const util = require('util');
const sleep = util.promisify(setTimeout);
exports.up = async (knex, Promise) => {
    // temp
    let oldInnoDbValue = await knex.raw(`show variables like 'innodb_lock_wait_timeout';`);
    let oldLockTimeout = parseInt(oldInnoDbValue[0][0]['Value'], 10);
    if (!oldLockTimeout || isNaN(oldLockTimeout)) {
        throw new Error('innodb_lock_wait_timeout invalid. are you using mysql?');
    }
    // insane amount is temporary
    await knex.raw(`set innodb_lock_wait_timeout=?;`, [100000]);
    // delete hashes
    await knex('thumbnail_hashes').delete();
    // delete thumbs
    await knex('thumbnails').delete().where({'type': 'user'}).orderBy('reference_id','asc');
    let errorsWhileRendering = [];
    // grab all users
    let users = await knex('users').select('id').orderBy('id', 'asc');
    for (const user of users) {
        // gen thumbnail
        try {
            let data = await staff.regenAvatar({staff: 2,}, user.id, true, true, false);
            await knex('thumbnails').insert({
                'reference_id': user.id,
                'type': 'user',
                'url': data.url,
            });
        }catch(e) {
            console.error(e);
            errorsWhileRendering.push(e);
            await sleep(500);
        }
        console.log('avatar complete for',user.id);
    }

    if (errorsWhileRendering.length !== 0) {
        console.error(errorsWhileRendering);
    }
    // maybe just a few failed for some reason? otherwise, throw it since a lot failed
    if (errorsWhileRendering.length > 100) {
        console.error(errorsWhileRendering.length,'renders failed');
        throw new Error(errorsWhileRendering);
    }
    // reset to default
    await knex.raw(`set innodb_lock_wait_timeout=?;`, [oldLockTimeout]);
};

exports.down = async (knex, Promise) => {
    throw new Error('you cannot undo this migration.');
};