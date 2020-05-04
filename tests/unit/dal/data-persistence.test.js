process.env.NODE_ENV = 'test';
const assert = require('assert');
const dataPersistenceDAL = require('../../../dist/dal/data-persistence').default;
const dal = new dataPersistenceDAL();

describe('dal.DataPersistence().set()', () => {
    it('Should set a valid key and value', async () => {
        const gameId = 1;
        const key = 'hello';
        const value = 'world';
        const expectedKey = 'dp_game_'+gameId.toString()+'_'+key;
        let callToSet = 0;
        dal.redis = {
            async set (key, passedValue) {
                assert.strictEqual(key, expectedKey);
                assert.strictEqual(passedValue, JSON.stringify({type: typeof value, value: value}));
                callToSet++;
                // Ok
            }
        }
        await dal.set(gameId, key, value);
        assert.strictEqual(callToSet, 1);
    });
    const options = [
        undefined,
        null,
        '',
    ]
    for (const option of options) {
        it('Should delete key due to "'+option+'" being passed', async () => {
            const gameId = 1;
            const key = 'hello';
            const value = option;
            const expectedKey = 'dp_game_'+gameId.toString()+'_'+key;
            let callToDelete = 0;
            dal.redis = {
                async set() {
                    throw new Error('Set should not be called for undefined key');
                },
                async del (key) {
                    assert.strictEqual(key, expectedKey);
                    callToDelete++;
                    // Ok
                }
            }
            await dal.set(gameId, key, value);
            assert.strictEqual(callToDelete, 1);
        });
    }
});

describe('dal.DataPersistence().get()', () => {
   it('Should grab the key specified', async () => {
      const gameId = 25;
      const key = 'hello';
      const value = 'world';
      const expectedKey = 'dp_game_'+gameId.toString()+'_'+key;
      dal.redis = {
          async get(key) {
              assert.strictEqual(key, expectedKey);
              return JSON.stringify({type: typeof value, value: value});
          }
      }
      let val = await dal.get(gameId, key);
      assert.strictEqual(val, value);
      // Ok
   });
});