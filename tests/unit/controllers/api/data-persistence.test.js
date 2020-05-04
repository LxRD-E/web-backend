process.env.NODE_ENV = 'test';
const assert = require('assert');
const dataPersistenceController = require('../../../../dist/controllers/v1/data-persistence').default;
const controller = new dataPersistenceController();

/**
 * confirm controller method throws BadRequest with the specified error code
 * @param {string} code
 * @param {Promise<any>} inp
 */
const throwsBR = async (code, inp) => {
    try {
        await inp;
        throw new Error('method resolved even though a throw was expected.');
    }catch(e) {
        assert.strictEqual(e instanceof controller.BadRequest, true, e);
        assert.strictEqual(e.message, code, 'should be '+code+' error code');
    }
}
/**
 * confirm controller method throws Conflict with the specified error code
 * @param {string} code
 * @param {Promise<any>} inp
 */
const throwsC = async (code, inp) => {
    try {
        await inp;
        throw new Error('method resolved even though a throw was expected.');
    }catch(e) {
        assert.strictEqual(e instanceof controller.Conflict, true, e);
        assert.strictEqual(e.message, code, 'should be '+code+' error code');
    }
}

describe('DataPersistence().set()', () => {
    it('Should set a valid key and value (userId owner)', async () => {
        const gameId = 1;
        const key = 'hello';
        const value = {
            value: 'world',
        };
        const session = {
            userId: 1,
        }
        let callsToSet = 0;
        controller.dataPersistence.set = async (gameId, key, value) => {
            callsToSet++;
        }
        let callsToGetGameInfo = 0;
        controller.game.getInfo = async (gameIdParam, columns) => {
            callsToGetGameInfo++;
            assert.strictEqual(Array.isArray(columns), true);
            assert.strictEqual(columns.includes('creatorId'), true);
            assert.strictEqual(columns.includes('creatorType'), true);
            assert.strictEqual(gameIdParam, gameId);
            return {
                creatorType: 0,
                creatorId: session.userId,
            };
        }
        await controller.set(session, gameId, key, value);
        assert.strictEqual(callsToSet, 1);
        assert.strictEqual(callsToGetGameInfo, 1);
        // done;
    });
    it('Should set a valid key and value (groupId owner)', async () => {
        const gameId = 1;
        const key = 'hello';
        const value = {
            value: 'world',
        };
        const groupId = 6163;
        const session = {
            userId: 1,
        }
        let callsToSet = 0;
        controller.dataPersistence.set = async (gameId, key, value) => {
            callsToSet++;
        }
        let callsToGetGameInfo = 0;
        controller.game.getInfo = async (gameIdParam, columns) => {
            callsToGetGameInfo++;
            assert.strictEqual(Array.isArray(columns), true);
            assert.strictEqual(columns.includes('creatorId'), true);
            assert.strictEqual(columns.includes('creatorType'), true);
            assert.strictEqual(gameIdParam, gameId);
            return {
                creatorType: 1,
                creatorId: groupId,
            };
        }
        let callsToGetGroupInfo = 0;
        controller.group.getInfo = async (groupIdParam) => {
            callsToGetGroupInfo++;
            assert.strictEqual(groupIdParam, groupId);
            return {
                groupOwnerUserId: session.userId,
            }
        }
        await controller.set(session, gameId, key, value);
        assert.strictEqual(callsToSet, 1);
        assert.strictEqual(callsToGetGameInfo, 1);
        assert.strictEqual(callsToGetGroupInfo, 1);
        // done;
    });
    it('Should try to set a valid key and value (groupId owner) but fail due to user not owning group', async () => {
        const gameId = 1;
        const key = 'hello';
        const value = {
            value: 'world',
        };
        const groupId = 6163;
        const session = {
            userId: 1,
        }
        let callsToSet = 0;
        controller.dataPersistence.set = async (gameId, key, value) => {
            callsToSet++;
        }
        let callsToGetGameInfo = 0;
        controller.game.getInfo = async (gameIdParam, columns) => {
            callsToGetGameInfo++;
            assert.strictEqual(Array.isArray(columns), true);
            assert.strictEqual(columns.includes('creatorId'), true);
            assert.strictEqual(columns.includes('creatorType'), true);
            assert.strictEqual(gameIdParam, gameId);
            return {
                creatorType: 1,
                creatorId: groupId,
            };
        }
        let callsToGetGroupInfo = 0;
        controller.group.getInfo = async (groupIdParam) => {
            callsToGetGroupInfo++;
            assert.strictEqual(groupIdParam, groupId);
            return {
                groupOwnerUserId: session.userId+1,
            }
        }
        try {
            await controller.set(session, gameId, key, value);
            throw new Error('Set completed with invalid owner');
        }catch(e) {
            assert.strictEqual(e.message, 'Unauthorized');
            assert.strictEqual(e instanceof controller.Conflict, true);
        }
        assert.strictEqual(callsToSet, 0);
        assert.strictEqual(callsToGetGameInfo, 1);
        assert.strictEqual(callsToGetGroupInfo, 1);
        // done;
    });
    it('Should try to set a valid key and value (userId owner) but fail due to user not owning game', async () => {
        const gameId = 1;
        const key = 'hello';
        const value = {
            value: 'world',
        };
        const session = {
            userId: 1,
        }
        let callsToSet = 0;
        controller.dataPersistence.set = async (gameId, key, value) => {
            callsToSet++;
        }
        let callsToGetGameInfo = 0;
        controller.game.getInfo = async (gameIdParam, columns) => {
            callsToGetGameInfo++;
            assert.strictEqual(Array.isArray(columns), true);
            assert.strictEqual(columns.includes('creatorId'), true);
            assert.strictEqual(columns.includes('creatorType'), true);
            assert.strictEqual(gameIdParam, gameId);
            return {
                creatorType: 0,
                creatorId: session.userId+1,
            };
        }
        let callsToGetGroupInfo = 0;
        controller.group.getInfo = async (groupIdParam) => {
            callsToGetGroupInfo++;
        }
        try {
            await controller.set(session, gameId, key, value);
            throw new Error('Set completed with invalid owner');
        }catch(e) {
            assert.strictEqual(e.message, 'Unauthorized');
            assert.strictEqual(e instanceof controller.Conflict, true);
        }
        assert.strictEqual(callsToSet, 0);
        assert.strictEqual(callsToGetGameInfo, 1);
        assert.strictEqual(callsToGetGroupInfo, 0);
        // done;
    });
});


describe('DataPersistence().get()', () => {
    it('Should get a valid key and value (userId owner)', async () => {
        const gameId = 1;
        const key = 'hello';
        const value = {
            value: 'world',
        };
        const session = {
            userId: 1,
        }
        let callsToGet = 0;
        controller.dataPersistence.get = async (gameId, key) => {
            callsToGet++;
            return value.value;
        }
        let callsToGetGameInfo = 0;
        controller.game.getInfo = async (gameIdParam, columns) => {
            callsToGetGameInfo++;
            assert.strictEqual(Array.isArray(columns), true);
            assert.strictEqual(columns.includes('creatorId'), true);
            assert.strictEqual(columns.includes('creatorType'), true);
            assert.strictEqual(gameIdParam, gameId);
            return {
                creatorType: 0,
                creatorId: session.userId,
            };
        }
        let results = await controller.get(session, gameId, key);
        assert.strictEqual(results.value, value.value);
        assert.strictEqual(callsToGet, 1);
        assert.strictEqual(callsToGetGameInfo, 1);
        // done;
    });
    it('Should get a valid key and value (groupId owner)', async () => {
        const gameId = 1;
        const key = 'hello';
        const value = {
            value: 'world',
        };
        const groupId = 6163;
        const session = {
            userId: 1,
        }
        let callsToGet = 0;
        controller.dataPersistence.get = async (gameId, key) => {
            callsToGet++;
            return value.value;
        }
        let callsToGetGameInfo = 0;
        controller.game.getInfo = async (gameIdParam, columns) => {
            callsToGetGameInfo++;
            assert.strictEqual(Array.isArray(columns), true);
            assert.strictEqual(columns.includes('creatorId'), true);
            assert.strictEqual(columns.includes('creatorType'), true);
            assert.strictEqual(gameIdParam, gameId);
            return {
                creatorType: 1,
                creatorId: groupId,
            };
        }
        let callsToGetGroupInfo = 0;
        controller.group.getInfo = async (groupIdParam) => {
            callsToGetGroupInfo++;
            assert.strictEqual(groupIdParam, groupId);
            return {
                groupOwnerUserId: session.userId,
            }
        }
        let results = await controller.get(session, gameId, key);
        assert.strictEqual(results.value, value.value);
        assert.strictEqual(callsToGet, 1);
        assert.strictEqual(callsToGetGameInfo, 1);
        assert.strictEqual(callsToGetGroupInfo, 1);
        // done;
    });
    it('Should get a valid key and value but fail due to user not owning game (userId owner)', async () => {
        const gameId = 1;
        const key = 'hello';
        const value = {
            value: 'world',
        };
        const groupId = 6163;
        const session = {
            userId: 1,
        }
        let callsToGet = 0;
        controller.dataPersistence.get = async (gameId, key) => {
            callsToGet++;
            return value.value;
        }
        let callsToGetGameInfo = 0;
        controller.game.getInfo = async (gameIdParam, columns) => {
            callsToGetGameInfo++;
            assert.strictEqual(Array.isArray(columns), true);
            assert.strictEqual(columns.includes('creatorId'), true);
            assert.strictEqual(columns.includes('creatorType'), true);
            assert.strictEqual(gameIdParam, gameId);
            return {
                creatorType: 0,
                creatorId: session.userId+1,
            };
        }
        let results = await throwsC('Unauthorized', controller.get(session, gameId, key));
        assert.strictEqual(callsToGet, 0);
        assert.strictEqual(callsToGetGameInfo, 1);
        // done;
    });
    it('Should get a valid key and value but fail due to user not owning game (groupId owner)', async () => {
        const gameId = 1;
        const key = 'hello';
        const value = {
            value: 'world',
        };
        const groupId = 6163;
        const session = {
            userId: 1,
        }
        let callsToGet = 0;
        controller.dataPersistence.get = async (gameId, key) => {
            callsToGet++;
            return value.value;
        }
        let callsToGetGameInfo = 0;
        controller.game.getInfo = async (gameIdParam, columns) => {
            callsToGetGameInfo++;
            assert.strictEqual(Array.isArray(columns), true);
            assert.strictEqual(columns.includes('creatorId'), true);
            assert.strictEqual(columns.includes('creatorType'), true);
            assert.strictEqual(gameIdParam, gameId);
            return {
                creatorType: 1,
                creatorId: groupId,
            };
        }
        let callsToGetGroupInfo = 0;
        controller.group.getInfo = async (groupIdParam) => {
            callsToGetGroupInfo++;
            assert.strictEqual(groupIdParam, groupId);
            return {
                groupOwnerUserId: session.userId+1,
            }
        }
        let results = await throwsC('Unauthorized', controller.get(session, gameId, key));
        assert.strictEqual(callsToGet, 0);
        assert.strictEqual(callsToGetGameInfo, 1);
        assert.strictEqual(callsToGetGroupInfo, 1);
        // done;
    });
});