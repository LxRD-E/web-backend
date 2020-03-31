/**
 * Clear thumbnails for catalog and regen all. Will take 5-15 seconds per catalog item
 */
const _catalogController = require('../dist/controllers/v1/catalog').CatalogController;
const catalog = new _catalogController();

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
    // delete thumbs
    await knex('thumbnails').delete().where({'type': 'catalog'}).orderBy('reference_id','asc');
    let errorsWhileRendering = [];
    // grab all items
    let items = await knex('catalog').select('id').orderBy('id', 'asc');
    for (const item of items) {
        // gen thumbnail
        try {
            let data = await catalog.forceThumbnailRegen({staff: 2,}, item.id, true, false);
            await knex('thumbnails').insert({
                'reference_id': item.id,
                'type': 'catalog',
                'url': data.url,
            });
        }catch(e) {
            console.error(e);
            if (e.message === 'This item does not contain any assets') {

            }else{
                errorsWhileRendering.push(e);
                await sleep(500);
            }
        }
        console.log('item render complete for',item.id);
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