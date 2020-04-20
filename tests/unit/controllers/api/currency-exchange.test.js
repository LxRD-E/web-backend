process.env.NODE_ENV = 'test';
const assert = require('assert');
const currencyExchangeController = require('../../../../dist/controllers/v1/currency-exchange').default;
/**
 * @type {CurrencyExchangeController}
 */
const controller = new currencyExchangeController();

/**
 * confirm controller method throws invaliduserid and badrequest
 * @param {Promise<any>} inp
 */
const throwsInvalidUserId = async (inp) => {
    try {
        await inp;
        throw new Error('method resolved even though a throw was expected.');
    }catch(e) {
        assert.strictEqual(e instanceof controller.BadRequest, true, 'error should be badrequest');
        assert.strictEqual(e.message, 'InvalidUserId', 'should be InvalidUserId error code');
    }
}
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
        assert.strictEqual(e instanceof controller.BadRequest, true, 'error should be badrequest');
        assert.strictEqual(e.message, code, 'should be '+code+' error code');
    }
}

describe('CurrencyExchange().getPositionsByCurrencyType()', () => {
    it('Should call this.currencyExchange.getOpenPositionsByCurrency() and await it', async () => {
        const CURRENCY_TYPE = 1;
        const CUSTOM_OFFSET = 196581;
        const CUSTOM_LIMIT = 94;
        controller.currencyExchange = {
            async getOpenPositionsByCurrency(currencyType, limit, offset, forUpdate = []) {
                assert.strictEqual(currencyType, CURRENCY_TYPE, 'should match specified currency type');
                assert.strictEqual(limit, CUSTOM_LIMIT);
                assert.strictEqual(offset, CUSTOM_OFFSET);
                return []; // return empty arr
            }
        }
        await controller.getPositionsByCurrencyType(CURRENCY_TYPE, CUSTOM_LIMIT, CUSTOM_OFFSET);
        // pass
    });
    it('Should throw due to invalid currencyType specified', async () => {
        const CURRENCY_TYPE = 69;
        controller.currencyExchange = {
            async getOpenPositionsByCurrency(currencyType, limit, offset, forUpdate = []) {
                assert.strictEqual(currencyType, CURRENCY_TYPE, 'should match specified currency type');
                return []; // return empty arr
            }
        }
        await throwsBR('InvalidCurrency', controller.getPositionsByCurrencyType(CURRENCY_TYPE));
        // pass
    })
});

describe('CurrencyExchange.createPosition()', () => {
   it('Should create a position for the authenticated user', async () => {
       const BALANCE = 100;
       const RATE = 1;
       const CURRENCY = 1;
       const session = {
           userId: 1,
           username: 'Unit Test',
       };
       const FOR_UPDATE = [
           'users',
           'currency_exchange_position',
           'currency_exchange_fund',
       ];

       let returnedPositionId = 2525;
       controller.transaction = (cb) => {
           return cb({
               currencyExchange: {
                   async getOpenPositionsByUserId(userId, limit, offset, forUpdate = []) {
                       assert.strictEqual(userId, session.userId);
                       assert.strictEqual(limit, 100);
                       assert.deepEqual(forUpdate, FOR_UPDATE);
                       // for now, just return an empty array
                       return [];
                   },
                   async createPosition(userId, balance, currencyType, rate, forUpdate) {
                       assert.strictEqual(userId, session.userId);
                       assert.strictEqual(balance, BALANCE);
                       assert.strictEqual(currencyType, CURRENCY);
                       assert.strictEqual(rate, RATE);
                       assert.deepEqual(forUpdate, FOR_UPDATE);
                       return returnedPositionId;
                   },
                   async recordPositionFunding(positionId, amount, forUpdate) {
                       assert.strictEqual(positionId, returnedPositionId);
                       assert.strictEqual(amount, BALANCE);
                       assert.deepEqual(forUpdate, FOR_UPDATE);
                   }
               },
               economy: {
                   async subtractFromUserBalance(userId, amount, currency) {
                       assert.strictEqual(userId, session.userId);
                       assert.strictEqual(amount, BALANCE);
                       assert.strictEqual(currency, CURRENCY);
                   },
                   async createTransaction(userIdTo, userIdFrom, amount, currency, type, description, fromType, toType, catalogId, userInventoryId) {
                       assert.strictEqual(userIdTo, session.userId);
                       assert.strictEqual(userIdFrom, 1);
                       assert.strictEqual(amount, -BALANCE);
                       assert.strictEqual(currency, CURRENCY);
                       assert.strictEqual(type, 17);
                       assert.strictEqual(fromType, 0);
                       assert.strictEqual(toType, 0);
                   }
               },
               BadRequest: () => {
                   throw new Error('Bad Request was called for no reason.');
               },
           })
       }
       let results = await controller.createPosition(session, BALANCE, CURRENCY, RATE);
       assert.strictEqual(results.positionId, returnedPositionId);
       // pass
    });
   it('Should try to create a position for the authenticated user but fail due to rate too small', async () => {
        const BALANCE = 100;
        const RATE = 0.015;
        const CURRENCY = 1;
        const session = {
            userId: 1,
            username: 'Unit Test',
        };

        let badRequestCalled = 0;
        controller.transaction = (cb) => {
            return cb({
                currencyExchange: {
                    async getOpenPositionsByUserId(userId, limit, offset, forUpdate = []) {
                        throw new Error('getOpenPositionsByUserId was called for invalid rate');
                    },
                    async createPosition(userId, balance, currencyType, rate, forUpdate) {
                        throw new Error('createPosition was called for invalid rate');
                    },
                    async recordPositionFunding(positionId, amount, forUpdate) {
                        throw new Error('recordPositionFunding was called for invalid rate');
                    }
                },
                economy: {
                    async subtractFromUserBalance(userId, amount, currency) {
                        throw new Error('subtractFromUserBalance was called for invalid rate');
                    },
                    async createTransaction(userIdTo, userIdFrom, amount, currency, type, description, fromType, toType, catalogId, userInventoryId) {
                        throw new Error('createTransaction was called for invalid rate');
                    }
                },
                BadRequest: (msg) => {
                    badRequestCalled++;
                },
            })
        }
        await throwsBR('RateTooSmall', controller.createPosition(session, BALANCE, CURRENCY, RATE));
        assert.strictEqual(badRequestCalled, 0);
        // pass
   });
    it('Should try to create a position for the authenticated user but fail due to rate too big', async () => {
        const BALANCE = 100;
        const RATE = 105;
        const CURRENCY = 1;
        const session = {
            userId: 1,
            username: 'Unit Test',
        };

        let badRequestCalled = 0;
        controller.transaction = (cb) => {
            return cb({
                currencyExchange: {
                    async getOpenPositionsByUserId(userId, limit, offset, forUpdate = []) {
                        throw new Error('getOpenPositionsByUserId was called for invalid rate');
                    },
                    async createPosition(userId, balance, currencyType, rate, forUpdate) {
                        throw new Error('createPosition was called for invalid rate');
                    },
                    async recordPositionFunding(positionId, amount, forUpdate) {
                        throw new Error('recordPositionFunding was called for invalid rate');
                    }
                },
                economy: {
                    async subtractFromUserBalance(userId, amount, currency) {
                        throw new Error('subtractFromUserBalance was called for invalid rate');
                    },
                    async createTransaction(userIdTo, userIdFrom, amount, currency, type, description, fromType, toType, catalogId, userInventoryId) {
                        throw new Error('createTransaction was called for invalid rate');
                    }
                },
                BadRequest: (msg) => {
                    badRequestCalled++;
                },
            })
        }
        await throwsBR('RateTooLarge', controller.createPosition(session, BALANCE, CURRENCY, RATE));
        assert.strictEqual(badRequestCalled, 0);
        // pass
    });
    it('Should try to create a position for the authenticated user but fail due to balance invalid (not integer)', async () => {
        const BALANCE = 15.5
        const RATE = 10;
        const CURRENCY = 1;
        const session = {
            userId: 1,
            username: 'Unit Test',
        };

        let badRequestCalled = 0;
        controller.transaction = (cb) => {
            return cb({
                currencyExchange: {
                    async getOpenPositionsByUserId(userId, limit, offset, forUpdate = []) {
                        throw new Error('getOpenPositionsByUserId was called for invalid rate');
                    },
                    async createPosition(userId, balance, currencyType, rate, forUpdate) {
                        throw new Error('createPosition was called for invalid rate');
                    },
                    async recordPositionFunding(positionId, amount, forUpdate) {
                        throw new Error('recordPositionFunding was called for invalid rate');
                    }
                },
                economy: {
                    async subtractFromUserBalance(userId, amount, currency) {
                        throw new Error('subtractFromUserBalance was called for invalid rate');
                    },
                    async createTransaction(userIdTo, userIdFrom, amount, currency, type, description, fromType, toType, catalogId, userInventoryId) {
                        throw new Error('createTransaction was called for invalid rate');
                    }
                },
                BadRequest: (msg) => {
                    badRequestCalled++;
                },
            })
        }
        await throwsBR('InvalidBalance', controller.createPosition(session, BALANCE, CURRENCY, RATE));
        assert.strictEqual(badRequestCalled, 0);
        // pass
    });
});