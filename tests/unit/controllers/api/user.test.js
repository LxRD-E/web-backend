process.env.NODE_ENV = 'test';
const assert = require('assert');
const userController = require('../../../../dist/controllers/v1/user').UsersController;
const controller = new userController();

/**
 * confirm controller method throws invaliduserid and badrequest
 * @param {Promise<any>} inp 
 */
const throwsInvalidUserId = async (inp) => {
    try {
        await inp;
        throw new Error('method resolved even though a throw was expected.');
    }catch(e) {
        console.log(e);
        assert.strictEqual(e instanceof controller.BadRequest, true, 'error should be badrequest');
        assert.strictEqual(e.message, 'InvalidUserId', 'should be InvalidUserId error code');
    }
}

describe('UsersController().getInfo()', () => {
    it('Should resolve with valid userInfo', async () => {
        const USER_ID = 1;
        const ACCOUNT_STATUS = 1;
        controller.user = {
            getInfo: (id, columns) => {
                assert.strictEqual(id, USER_ID);
                assert.strictEqual(typeof columns, 'undefined');
                return {
                    // 1 is OK
                    accountStatus: ACCOUNT_STATUS,
                    userId: id,
                };
            },
        }
        let results = await controller.getInfo(USER_ID);
        assert.strictEqual(results.accountStatus, 1, 'accountStatus should match pre-specified accountStatus');
        assert.strictEqual(results.userId, USER_ID, 'userId should match requested userId');
    });
});

describe('UsersController().getInfoByUsername()', () => {
    it('Should resolve with valid userinfo (userId and accountStatus)', async () => {
        const USERNAME = 'System';
        const USER_ID = 1;
        const ACCOUNT_STATUS = 1;
        controller.user = {
            userNameToId: (name) => {
                assert.strictEqual(name, USERNAME);
                return USER_ID;
            },
            getInfo: (id) => {
                assert.strictEqual(id, USER_ID);
                return {
                    userId: USER_ID,
                    accountStatus: ACCOUNT_STATUS,
                }
            },
        };
        let result = await controller.getInfoByUsername(USERNAME);
        assert.strictEqual(result.userId, USER_ID, 'returned userid should match specified userId');
        assert.strictEqual(result.accountStatus, ACCOUNT_STATUS, 'returned account status should match specified status');
    });
    it('Should reject due to invalid username', async () => {
        const USERNAME = 'System';
        const USER_ID = 1;
        const ACCOUNT_STATUS = 1;
        controller.user = {
            userNameToId: (name) => {
                assert.strictEqual(name, USERNAME);
                throw false;
            },
            getInfo: (id) => {
                assert.strictEqual(id, USER_ID);
                return {
                    userId: USER_ID,
                    accountStatus: ACCOUNT_STATUS,
                }
            },
        };
        try {
            await controller.getInfoByUsername(USERNAME);
            throw new Error('getInfoByUsername() passed for invalid userId');
        }catch(e) {
            assert.strictEqual(e instanceof controller.BadRequest, true, 'bad request should be returned');
            assert.strictEqual(e.message, 'InvalidUsername','InvalidUsername code should be returned');
        }
    });
});

describe('UsersController().getAvatar()', () => {
    it('Should resolve with user avatar', async () => {
        const USER_ID = 1;
        const EXPECTED_HATS = [
            {
                'hello': 'world',
            }
        ];
        const EXPECTED_COLORS = [
            {
                'legr': 1
            }
        ]
        controller.user = {
            getAvatar: (id) => {
                assert.strictEqual(id, USER_ID, 'userId passed to getAvatar() should match pre-specified userId');
                return EXPECTED_HATS;
            },
            getAvatarColors: (id) => {
                assert.strictEqual(id, USER_ID, 'userId pass to getAvatarColors() should match pre-specified userId');
                return EXPECTED_COLORS;
            }
        };
        let results = await controller.getAvatar(USER_ID);
        assert.strictEqual(typeof results, 'object', 'result should be object');
        assert.strictEqual(Array.isArray(results.color), true, 'result color should be array');
        assert.strictEqual(Array.isArray(results.avatar), true, 'avatar items should be array');
        assert.deepStrictEqual(results.avatar, EXPECTED_HATS, 'hats should equal expected result');
        assert.deepStrictEqual(results.color, EXPECTED_COLORS, 'result should include expected colors');
    });
});


describe('UsersController().getFriends()', () => {
    it('Should resolve with user friends (0)', async () => {
        const USER_ID = 1;
        const FRIEND_COUNT = 0;
        controller.user = {
            getInfo: (id) => {
                assert.strictEqual(id, USER_ID);
                return {
                    accountStatus: 1,
                };
            },
            getFriends: (id) => {
                assert.strictEqual(id, USER_ID);
                return [];
            },
            countFriends: (id) => {
                assert.strictEqual(id, USER_ID);
                return FRIEND_COUNT;
            },
        }
        let results = await controller.getFriends(USER_ID);
        assert.strictEqual(results.friends.length, FRIEND_COUNT, '0 friends');
        assert.strictEqual(results.total,FRIEND_COUNT,'0 friends total');
    });
    it('Should resolve with user friends (not 0) and respect limit, offset, sortmode', async () => {
        const USER_ID = 1;
        const FRIEND_COUNT = 5;
        const FRIENDS_ARR = [
            {},{},{},{},{}  
        ];
        const limit = 5;
        const offset = 1;
        const sort = 'desc';
        controller.user = {
            getInfo: (id) => {
                assert.strictEqual(id, USER_ID);
                return {
                    accountStatus: 1,
                };
            },
            getFriends: (id, off, lim, sor) => {
                assert.strictEqual(off, offset);
                assert.strictEqual(lim, limit);
                assert.strictEqual(sor, sort);
                assert.strictEqual(id, USER_ID);
                return FRIENDS_ARR;
            },
            countFriends: (id) => {
                assert.strictEqual(id, USER_ID);
                return FRIEND_COUNT;
            },
        }
        let results = await controller.getFriends(USER_ID, offset, limit, sort);
        assert.strictEqual(results.friends.length, FRIEND_COUNT, 'friends arr count should match FRIEND_COUNT');
        assert.strictEqual(results.total,FRIEND_COUNT,'total friends should match FRIEND_COUNT');
    });
});