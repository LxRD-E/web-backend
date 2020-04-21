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

describe('CurrencyExchange().historicalCharts()', () => {
    it('Should call this.currencyExchange.getHistoricalExchangeRecords() and await it', async () => {
        const CURRENCY_TYPE = 1;
        controller.currencyExchange = {
            async getHistoricalExchangeRecords(currencyType) {
                assert.strictEqual(currencyType, CURRENCY_TYPE);
                return [];
            }
        }
        await controller.historicalCharts(CURRENCY_TYPE);
        // pass
    });
    it('Should throw due to invalid currencyType specified', async () => {
        const CURRENCY_TYPE = 69;
        controller.currencyExchange = {
            async historicalCharts(currencyType) {
                throw new Error('historical charts called for invalid currency');
            }
        }
        await throwsBR('InvalidCurrency', controller.historicalCharts(CURRENCY_TYPE));
        // pass
    })
});

describe('CurrencyExchange.metadata()', () => {
    it('Should grab currency conversion metadata', async () => {
        const results = controller.metadata();
        assert.strictEqual(results.isEnabled, true);
        assert.strictEqual(results.maximumOpenPositions, 100);
        // Pass
    });
});

describe('CurrencyExchange.getPositionFundingHistoryById()', () => {
    it('Should grab position funding history by id', async () => {
        const POSITION_ID = 1;
        const RESULTS = [];
        controller.currencyExchange.getPositionFunding = async (id) => {
            assert.strictEqual(id, POSITION_ID);
            return RESULTS;
        }
        const results = await controller.getPositionFundingHistoryById(POSITION_ID);
        assert.strictEqual(results, RESULTS);
        // Pass
    });
});

describe('CurrencyExchange.getPositions()', () => {
   it('Should grab currency exchange positions with valid limit, offset', async () => {
       const USER_ID = 1;
       const LIMIT = 73;
       const OFFSET = 123;
       let resultsArr = [];
       controller.currencyExchange.getOpenPositionsByUserId = async (userId, limit, offset) => {
           assert.strictEqual(userId, USER_ID);
           assert.strictEqual(limit, LIMIT);
           assert.strictEqual(offset, OFFSET);
           return resultsArr;
       }
       const results = await controller.getPositions(USER_ID, LIMIT, OFFSET);
       assert.strictEqual(results, resultsArr);
       // Pass
   });
});

describe('CurrencyExchange.getPositionById()', () => {
    it('Should grab currency exchange position by id', async () => {
        const POSITION_ID = 1;
        let resultsArr = [];
        controller.currencyExchange.getPositionById = async (id) => {
            assert.strictEqual(id, POSITION_ID);
            return resultsArr;
        }
        const results = await controller.getPositionById(POSITION_ID);
        assert.strictEqual(results, resultsArr);
        // Pass
    });
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
    it('Should try to create a position for the authenticated user but fail due to invalid currency', async () => {
        const BALANCE = 100;
        const RATE = 0.015;
        const CURRENCY = 3;
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
                BadRequest: controller.BadRequest,
                Conflict: controller.Conflict,
            })
        }
        await throwsBR('InvalidCurrency', controller.createPosition(session, BALANCE, CURRENCY, RATE));
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
    it('Should try to create a position for the authenticated user but fail due to balance too small', async () => {
        const BALANCE = 1;
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
        await throwsBR('BalanceTooSmall', controller.createPosition(session, BALANCE, CURRENCY, RATE));
        assert.strictEqual(badRequestCalled, 0);
        // pass
    });
    it('Should try to create a position for the authenticated user but fail due to user not having enough currency', async () => {
        const BALANCE = 100;
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
                        return []; // no positions
                    },
                    async createPosition(userId, balance, currencyType, rate, forUpdate) {
                        throw new Error('createPosition was called');
                    },
                    async recordPositionFunding(positionId, amount, forUpdate) {
                        throw new Error('recordPositionFunding was called');
                    }
                },
                economy: {
                    async subtractFromUserBalance(userId, amount, currency) {
                        throw 1; // not enough currency error
                    },
                    async createTransaction(userIdTo, userIdFrom, amount, currency, type, description, fromType, toType, catalogId, userInventoryId) {
                        throw new Error('createTransaction was called even though user does not have enough currency');
                    }
                },
                BadRequest: controller.BadRequest,
            })
        }
        await throwsBR('NotEnoughCurrency', controller.createPosition(session, BALANCE, CURRENCY, RATE));
        // pass
    });
    it('Should try to create a position for the authenticated user but fail due to db issue with subtractFromUserBalance()', async () => {
        const BALANCE = 100;
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
                        return []; // no positions
                    },
                    async createPosition(userId, balance, currencyType, rate, forUpdate) {
                        throw new Error('createPosition was called');
                    },
                    async recordPositionFunding(positionId, amount, forUpdate) {
                        throw new Error('recordPositionFunding was called');
                    }
                },
                economy: {
                    async subtractFromUserBalance(userId, amount, currency) {
                        throw new Error('Example Database Issue');
                    },
                    async createTransaction(userIdTo, userIdFrom, amount, currency, type, description, fromType, toType, catalogId, userInventoryId) {
                        throw new Error('createTransaction was called even though user does not have enough currency');
                    }
                },
                BadRequest: controller.BadRequest,
            })
        }
        try {
            await controller.createPosition(session, BALANCE, CURRENCY, RATE);
            throw new Error('create position executed ok with db exception');
        }catch(e) {
            assert.strictEqual(e.message, 'Example Database Issue');
            // pass
        }
    });
    it('Should try to create a position for the authenticated user but fail due to user already owning 100 positions', async () => {
        const BALANCE = 100;
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
                        let _i = 0;
                        let _x = [];
                        while (_i < 100) {
                            _x.push({});
                            _i++;
                        }
                        return _x; // 100 positions
                    },
                    async createPosition(userId, balance, currencyType, rate, forUpdate) {
                        throw new Error('createPosition was called');
                    },
                    async recordPositionFunding(positionId, amount, forUpdate) {
                        throw new Error('recordPositionFunding was called');
                    }
                },
                economy: {
                    async subtractFromUserBalance(userId, amount, currency) {
                        throw new Error('subtractFromUserBalance called');
                    },
                    async createTransaction(userIdTo, userIdFrom, amount, currency, type, description, fromType, toType, catalogId, userInventoryId) {
                        throw new Error('createTransaction was called even though user does not have enough currency');
                    }
                },
                BadRequest: controller.BadRequest,
                Conflict: controller.Conflict,
            })
        }
        await throwsC('ReachedMaximumOpenPositions', controller.createPosition(session, BALANCE, CURRENCY, RATE));
        // pass
    });
});

describe('CurrencyExchange.closePosition()', () => {
    it('Should close a position created by the authenticated user', async () => {
        const POSITION_ID = 1986;
        const BALANCE = 100;
        const CURRENCY = 1;
        const session = {
            userId: 1,
            username: 'Unit Test',
        };
        const FOR_UPDATE = [
            'users',
            'currency_exchange_fund',
            'currency_exchange_position',
        ];

        controller.transaction = (cb) => {
            return cb({
                currencyExchange: {
                    async getPositionById(id, forUpdate = []) {
                        assert.strictEqual(id, POSITION_ID);
                        assert.deepEqual(forUpdate, FOR_UPDATE);
                        // for now, just return an empty array
                        return {
                            userId: session.userId,
                            balance: BALANCE,
                            currencyType: CURRENCY,
                        };
                    },
                    async recordPositionFunding(positionId, amount, forUpdate) {
                        assert.strictEqual(positionId, POSITION_ID);
                        assert.strictEqual(amount, -BALANCE);
                        assert.deepEqual(forUpdate, FOR_UPDATE);
                    },
                    async subtractFromPositionBalance(positionId, amountToSubtract, forUpdate = []) {
                        assert.strictEqual(amountToSubtract, BALANCE);
                        assert.strictEqual(positionId, POSITION_ID);
                        assert.deepEqual(forUpdate, FOR_UPDATE);
                        // ok
                    }
                },
                economy: {
                    async addToUserBalanceV2(userId, amount, currency, forUpdate) {
                        assert.strictEqual(userId, session.userId);
                        assert.strictEqual(amount, BALANCE);
                        assert.strictEqual(currency, CURRENCY);
                        assert.deepEqual(forUpdate, FOR_UPDATE);
                        // ok
                    },
                    async createTransaction(userIdTo, userIdFrom, amount, currency, type, description, fromType, toType, catalogId, userInventoryId) {
                        assert.strictEqual(userIdTo, session.userId);
                        assert.strictEqual(userIdFrom, session.userId);
                        assert.strictEqual(amount, BALANCE);
                        assert.strictEqual(currency, CURRENCY);
                        assert.strictEqual(type, 20);
                        assert.strictEqual(fromType, 0);
                        assert.strictEqual(toType, 0);
                        // ok
                    }
                },
                BadRequest: controller.BadRequest,
                Conflict: controller.Conflict,
            })
        }
        await controller.closePosition(session, POSITION_ID);
        // pass
    });
    it('Should try to close a position but fail due to not being created by the authenticated user', async () => {
        const ACTUAL_OWNER_USER_ID = 2;
        const POSITION_ID = 1986;
        const BALANCE = 100;
        const CURRENCY = 1;
        const session = {
            userId: 1,
            username: 'Unit Test',
        };
        assert.notEqual(session.userId, ACTUAL_OWNER_USER_ID, 'ids cannot match');
        const FOR_UPDATE = [
            'users',
            'currency_exchange_fund',
            'currency_exchange_position',
        ];

        controller.transaction = (cb) => {
            return cb({
                currencyExchange: {
                    async getPositionById(id, forUpdate = []) {
                        assert.strictEqual(id, POSITION_ID);
                        assert.deepEqual(forUpdate, FOR_UPDATE);
                        // for now, just return an empty array
                        return {
                            userId: ACTUAL_OWNER_USER_ID,
                            balance: BALANCE,
                            currencyType: CURRENCY,
                        };
                    },
                    async recordPositionFunding(positionId, amount, forUpdate) {
                        throw new Error('recordPositionFunding called');
                    },
                    async subtractFromPositionBalance(positionId, amountToSubtract, forUpdate = []) {
                        throw new Error('subtractFromPositionBalance called');
                        // ok
                    }
                },
                economy: {
                    async addToUserBalanceV2(userId, amount, currency, forUpdate) {
                        throw new Error('addToUserBalanceV2 called');
                        // ok
                    },
                    async createTransaction(userIdTo, userIdFrom, amount, currency, type, description, fromType, toType, catalogId, userInventoryId) {
                        throw new Error('createTransaction  called');
                        // ok
                    }
                },
                BadRequest: controller.BadRequest,
                Conflict: controller.Conflict,
            })
        }
        await throwsC('UserIsNotOwnerOfPosition', controller.closePosition(session, POSITION_ID));
        // pass
    });
    it('Should try to close a position but fail due to balance of position being 0', async () => {
        const POSITION_ID = 1986;
        const BALANCE = 100;
        const CURRENCY = 1;
        const session = {
            userId: 1,
            username: 'Unit Test',
        };
        const FOR_UPDATE = [
            'users',
            'currency_exchange_fund',
            'currency_exchange_position',
        ];

        controller.transaction = (cb) => {
            return cb({
                currencyExchange: {
                    async getPositionById(id, forUpdate = []) {
                        assert.strictEqual(id, POSITION_ID);
                        assert.deepEqual(forUpdate, FOR_UPDATE);
                        // for now, just return an empty array
                        return {
                            userId: session.userId,
                            balance: 0,
                            currencyType: CURRENCY,
                        };
                    },
                    async recordPositionFunding(positionId, amount, forUpdate) {
                        throw new Error('recordPositionFunding called');
                    },
                    async subtractFromPositionBalance(positionId, amountToSubtract, forUpdate = []) {
                        throw new Error('subtractFromPositionBalance called');
                        // ok
                    }
                },
                economy: {
                    async addToUserBalanceV2(userId, amount, currency, forUpdate) {
                        throw new Error('addToUserBalanceV2 called');
                        // ok
                    },
                    async createTransaction(userIdTo, userIdFrom, amount, currency, type, description, fromType, toType, catalogId, userInventoryId) {
                        throw new Error('createTransaction  called');
                        // ok
                    }
                },
                BadRequest: controller.BadRequest,
                Conflict: controller.Conflict,
            })
        }
        await throwsC('PositionAlreadyClosed', controller.closePosition(session, POSITION_ID));
        // pass
    });
});



describe('CurrencyExchange.purchasePosition()', () => {
    it('Should purchase a position (buying primary)', async () => {
        const POSITION_OWNER = 2;
        const POSITION_ID = 1986;
        const BALANCE = 100;
        const AMOUNT_TO_BUY = 100;
        const RATE = 10;
        const CURRENCY = 1;
        const session = {
            userId: 1,
            username: 'Unit Test',
        };
        assert.notEqual(session.userId, POSITION_OWNER, 'position owner and buyer id cannot be the same');
        const FOR_UPDATE = [
            'users',
            'currency_exchange_position',
            'currency_exchange_record',
        ];

        controller.transaction = (cb) => {
            return cb({
                currencyExchange: {
                    async getPositionById(id, forUpdate = []) {
                        assert.strictEqual(id, POSITION_ID);
                        assert.deepEqual(forUpdate, FOR_UPDATE);
                        // for now, just return an empty array
                        return {
                            userId: POSITION_OWNER,
                            balance: BALANCE,
                            currencyType: CURRENCY,
                            rate: RATE,
                            positionId: POSITION_ID,
                        };
                    },
                    async recordPositionFunding(positionId, amount, forUpdate) {
                        assert.strictEqual(positionId, POSITION_ID);
                        assert.strictEqual(amount, -BALANCE);
                        assert.deepEqual(forUpdate, FOR_UPDATE);
                    },
                    async subtractFromPositionBalance(positionId, amountToSubtract, forUpdate = []) {
                        assert.strictEqual(amountToSubtract, BALANCE);
                        assert.strictEqual(positionId, POSITION_ID);
                        assert.deepEqual(forUpdate, FOR_UPDATE);
                        // ok
                    },
                    async recordCurrencyExchange(positionId, buyerUserId, amountPurchased, amountSold, forUpdate) {
                        assert.strictEqual(positionId, POSITION_ID);
                        assert.strictEqual(buyerUserId, session.userId);
                        assert.strictEqual(amountPurchased, AMOUNT_TO_BUY);
                        assert.strictEqual(amountSold, AMOUNT_TO_BUY * RATE);
                        assert.deepEqual(forUpdate, FOR_UPDATE);
                        // Pass
                    }
                },
                economy: {
                    async addToUserBalanceV2(userId, amount, currency, forUpdate) {
                        assert.deepEqual(forUpdate, FOR_UPDATE);
                        if (userId === session.userId) {
                            assert.strictEqual(userId, session.userId);
                            assert.strictEqual(amount, AMOUNT_TO_BUY);
                            assert.strictEqual(currency, CURRENCY);
                        }else if (userId === POSITION_OWNER) {
                            assert.strictEqual(userId, POSITION_OWNER);
                            assert.strictEqual(amount, AMOUNT_TO_BUY * RATE);
                            assert.strictEqual(currency, CURRENCY === 1 ? 2 : 1);
                            // Ok
                        }else{
                            throw new Error('addToUserBalanceV2 called with id of neither position owner or buyer');
                        }
                        // ok
                    },
                    async createTransaction(userIdTo, userIdFrom, amount, currency, type, description, fromType, toType, catalogId, userInventoryId) {
                        if (userIdTo === session.userId) {
                            if (currency === CURRENCY) {
                                assert.strictEqual(userIdTo, session.userId);
                                assert.strictEqual(userIdFrom, POSITION_OWNER);
                                assert.strictEqual(amount, BALANCE);
                                assert.strictEqual(currency, CURRENCY);
                                assert.strictEqual(type, 18);
                                assert.strictEqual(fromType, 0);
                                assert.strictEqual(toType, 0);
                            }else{
                                assert.strictEqual(userIdTo, session.userId);
                                assert.strictEqual(userIdFrom, POSITION_OWNER);
                                assert.strictEqual(amount, -(BALANCE * RATE));
                                assert.strictEqual(currency, CURRENCY === 1 ? 2 : 1);
                                assert.strictEqual(type, 18);
                                assert.strictEqual(fromType, 0);
                                assert.strictEqual(toType, 0);
                            }

                        }else if (userIdTo === POSITION_OWNER) {
                            assert.strictEqual(userIdTo, POSITION_OWNER);
                            assert.strictEqual(userIdFrom, session.userId);
                            assert.strictEqual(amount, (BALANCE * RATE));
                            assert.strictEqual(currency, CURRENCY === 1 ? 2 : 1);
                            assert.strictEqual(type, 19);
                            assert.strictEqual(fromType, 0);
                            assert.strictEqual(toType, 0);
                        }else{
                            throw new Error('Invalid userId passed to createTransaction(). it is for neither buyer or seller');
                        }

                        // ok
                    },
                    async subtractFromUserBalanceV2(userId, amount, currency, forUpdate) {
                        assert.strictEqual(userId, session.userId);
                        assert.strictEqual(amount, AMOUNT_TO_BUY * RATE);
                        assert.strictEqual(currency, CURRENCY === 1 ? 2 : 1);
                        assert.deepEqual(forUpdate, FOR_UPDATE);
                        // Ok
                    }
                },
                user: {
                    async getInfo(id, specificColumns, forUpdate) {
                        if (id === session.userId) {
                            assert.strictEqual(id, session.userId);
                            assert.deepEqual(specificColumns, ['primaryBalance','secondaryBalance']);
                            assert.deepEqual(forUpdate, FOR_UPDATE);
                            return {
                                primaryBalance: AMOUNT_TO_BUY * RATE,
                                secondaryBalance: AMOUNT_TO_BUY * RATE,
                            };
                        }else if (id === POSITION_OWNER) {
                            assert.strictEqual(id, POSITION_OWNER);
                            assert.deepEqual(specificColumns, ['accountStatus']);
                            assert.deepEqual(forUpdate, FOR_UPDATE);
                            return {
                                accountStatus: 0,
                            };
                        }else{
                            throw new Error('Invalid userId passed to getInfo(): it is not seller or buyer');
                        }
                    }
                },
                BadRequest: controller.BadRequest,
                Conflict: controller.Conflict,
            })
        }
        await controller.purchasePosition(session, POSITION_ID, AMOUNT_TO_BUY);
        // pass
    });
    it('Should purchase a position (buying secondary)', async () => {
        const POSITION_OWNER = 2;
        const POSITION_ID = 1986;
        const BALANCE = 100;
        const AMOUNT_TO_BUY = 100;
        const RATE = 0.1;
        const CURRENCY = 2;
        const session = {
            userId: 1,
            username: 'Unit Test',
        };
        assert.notEqual(session.userId, POSITION_OWNER, 'position owner and buyer id cannot be the same');
        const FOR_UPDATE = [
            'users',
            'currency_exchange_position',
            'currency_exchange_record',
        ];

        controller.transaction = (cb) => {
            return cb({
                currencyExchange: {
                    async getPositionById(id, forUpdate = []) {
                        assert.strictEqual(id, POSITION_ID);
                        assert.deepEqual(forUpdate, FOR_UPDATE);
                        // for now, just return an empty array
                        return {
                            userId: POSITION_OWNER,
                            balance: BALANCE,
                            currencyType: CURRENCY,
                            rate: RATE,
                            positionId: POSITION_ID,
                        };
                    },
                    async recordPositionFunding(positionId, amount, forUpdate) {
                        assert.strictEqual(positionId, POSITION_ID);
                        assert.strictEqual(amount, -BALANCE);
                        assert.deepEqual(forUpdate, FOR_UPDATE);
                    },
                    async subtractFromPositionBalance(positionId, amountToSubtract, forUpdate = []) {
                        assert.strictEqual(amountToSubtract, BALANCE);
                        assert.strictEqual(positionId, POSITION_ID);
                        assert.deepEqual(forUpdate, FOR_UPDATE);
                        // ok
                    },
                    async recordCurrencyExchange(positionId, buyerUserId, amountPurchased, amountSold, forUpdate) {
                        assert.strictEqual(positionId, POSITION_ID);
                        assert.strictEqual(buyerUserId, session.userId);
                        assert.strictEqual(amountPurchased, AMOUNT_TO_BUY);
                        assert.strictEqual(amountSold, AMOUNT_TO_BUY * RATE);
                        assert.deepEqual(forUpdate, FOR_UPDATE);
                        // Pass
                    }
                },
                economy: {
                    async addToUserBalanceV2(userId, amount, currency, forUpdate) {
                        assert.deepEqual(forUpdate, FOR_UPDATE);
                        if (userId === session.userId) {
                            assert.strictEqual(userId, session.userId);
                            assert.strictEqual(amount, AMOUNT_TO_BUY);
                            assert.strictEqual(currency, CURRENCY);
                        }else if (userId === POSITION_OWNER) {
                            assert.strictEqual(userId, POSITION_OWNER);
                            assert.strictEqual(amount, AMOUNT_TO_BUY * RATE);
                            assert.strictEqual(currency, CURRENCY === 1 ? 2 : 1);
                            // Ok
                        }else{
                            throw new Error('addToUserBalanceV2 called with id of neither position owner or buyer');
                        }
                        // ok
                    },
                    async createTransaction(userIdTo, userIdFrom, amount, currency, type, description, fromType, toType, catalogId, userInventoryId) {
                        if (userIdTo === session.userId) {
                            if (currency === CURRENCY) {
                                assert.strictEqual(userIdTo, session.userId);
                                assert.strictEqual(userIdFrom, POSITION_OWNER);
                                assert.strictEqual(amount, BALANCE);
                                assert.strictEqual(currency, CURRENCY);
                                assert.strictEqual(type, 18);
                                assert.strictEqual(fromType, 0);
                                assert.strictEqual(toType, 0);
                            }else{
                                assert.strictEqual(userIdTo, session.userId);
                                assert.strictEqual(userIdFrom, POSITION_OWNER);
                                assert.strictEqual(amount, -(BALANCE * RATE));
                                assert.strictEqual(currency, CURRENCY === 1 ? 2 : 1);
                                assert.strictEqual(type, 18);
                                assert.strictEqual(fromType, 0);
                                assert.strictEqual(toType, 0);
                            }

                        }else if (userIdTo === POSITION_OWNER) {
                            assert.strictEqual(userIdTo, POSITION_OWNER);
                            assert.strictEqual(userIdFrom, session.userId);
                            assert.strictEqual(amount, (BALANCE * RATE));
                            assert.strictEqual(currency, CURRENCY === 1 ? 2 : 1);
                            assert.strictEqual(type, 19);
                            assert.strictEqual(fromType, 0);
                            assert.strictEqual(toType, 0);
                        }else{
                            throw new Error('Invalid userId passed to createTransaction(). it is for neither buyer or seller');
                        }

                        // ok
                    },
                    async subtractFromUserBalanceV2(userId, amount, currency, forUpdate) {
                        assert.strictEqual(userId, session.userId);
                        assert.strictEqual(amount, AMOUNT_TO_BUY * RATE);
                        assert.strictEqual(currency, CURRENCY === 1 ? 2 : 1);
                        assert.deepEqual(forUpdate, FOR_UPDATE);
                        // Ok
                    }
                },
                user: {
                    async getInfo(id, specificColumns, forUpdate) {
                        if (id === session.userId) {
                            assert.strictEqual(id, session.userId);
                            assert.deepEqual(specificColumns, ['primaryBalance', 'secondaryBalance']);
                            assert.deepEqual(forUpdate, FOR_UPDATE);
                            return {
                                primaryBalance: AMOUNT_TO_BUY * RATE,
                                secondaryBalance: AMOUNT_TO_BUY * RATE,
                            };
                        }else if (id === POSITION_OWNER) {
                            assert.strictEqual(id, POSITION_OWNER);
                            assert.deepEqual(specificColumns, ['accountStatus']);
                            assert.deepEqual(forUpdate, FOR_UPDATE);
                            return {
                                accountStatus: 0,
                            };
                        }else{
                            throw new Error('id passed to getInfo() is of neither seller or buyer');
                        }
                    }
                },
                BadRequest: controller.BadRequest,
                Conflict: controller.Conflict,
            })
        }
        await controller.purchasePosition(session, POSITION_ID, AMOUNT_TO_BUY);
        // pass
    });
    it('Should try to purchase a position but fail due to seller being deleted', async () => {
        const POSITION_ID = 1986;
        const BALANCE = 100;
        const AMOUNT_TO_BUY = 100;
        const RATE = 10;
        const CURRENCY = 1;
        const session = {
            userId: 1,
            username: 'Unit Test',
        };
        const POSITION_OWNER = 2;
        assert.notEqual(POSITION_OWNER, session.userId);
        const FOR_UPDATE = [
            'users',
            'currency_exchange_position',
            'currency_exchange_record',
        ];

        controller.transaction = (cb) => {
            return cb({
                currencyExchange: {
                    async getPositionById(id, forUpdate = []) {
                        assert.strictEqual(id, POSITION_ID);
                        assert.deepEqual(forUpdate, FOR_UPDATE);
                        // for now, just return an empty array
                        return {
                            userId: POSITION_OWNER,
                            balance: BALANCE,
                            currencyType: CURRENCY,
                            rate: RATE,
                            positionId: POSITION_ID,
                        };
                    },
                    async recordPositionFunding(positionId, amount, forUpdate) {
                        assert.strictEqual(positionId, POSITION_ID);
                        assert.strictEqual(amount, -BALANCE);
                        assert.deepEqual(forUpdate, FOR_UPDATE);
                        // Ok
                    },
                    async subtractFromPositionBalance(positionId, amountToSubtract, forUpdate = []) {
                        assert.strictEqual(positionId, POSITION_ID);
                        assert.strictEqual(amountToSubtract, BALANCE);
                        assert.deepEqual(forUpdate, FOR_UPDATE);
                        // Ok
                    },
                    async recordCurrencyExchange(positionId, buyerUserId, amountPurchased, amountSold, forUpdate) {
                        throw new Error('recordCurrencyExchange() called');
                    }
                },
                economy: {
                    async addToUserBalanceV2(userId, amount, currency, forUpdate) {
                        assert.strictEqual(userId, POSITION_OWNER);
                        assert.strictEqual(amount, BALANCE);
                        assert.strictEqual(currency, CURRENCY);
                        assert.deepEqual(forUpdate, FOR_UPDATE);
                        // Ok
                    },
                    async createTransaction(userIdTo, userIdFrom, amount, currency, type, description, fromType, toType, catalogId, userInventoryId) {
                        assert.strictEqual(userIdTo, POSITION_OWNER);
                        assert.strictEqual(userIdFrom, POSITION_OWNER);
                        assert.strictEqual(amount, BALANCE);
                        assert.strictEqual(currency, CURRENCY);
                        assert.strictEqual(type, 20);
                        assert.strictEqual(fromType, 0);
                        assert.strictEqual(toType, 0);
                    },
                    async subtractFromUserBalanceV2(userId, amount, currency, forUpdate) {
                        throw new Error('subtractFromUserBalanceV2() called');
                    }
                },
                user: {
                    async getInfo(id, specificColumns, forUpdate) {
                        if (id === session.userId) {
                            return {
                                primaryBalance: 10000,
                                secondaryBalance: 10000,
                            };
                        }else if (id === POSITION_OWNER) {
                            assert.strictEqual(id, POSITION_OWNER);
                            assert.deepEqual(specificColumns, ['accountStatus']);
                            return {
                                accountStatus: 3,
                            };
                        }else{
                            throw new Error('id passed to getInfo() is from neither buyer or seller');
                        }
                    }
                },
                BadRequest: controller.BadRequest,
                Conflict: controller.Conflict,
            })
        }
        await throwsC('PositionNoLongerAvailable', controller.purchasePosition(session, POSITION_ID, AMOUNT_TO_BUY));
        // pass
    });
    it('Should try to purchase a position owned by the authenticated user but fail', async () => {
        const POSITION_ID = 1986;
        const BALANCE = 100;
        const AMOUNT_TO_BUY = 100;
        const RATE = 10;
        const CURRENCY = 1;
        const session = {
            userId: 1,
            username: 'Unit Test',
        };
        const POSITION_OWNER = session.userId;
        const FOR_UPDATE = [
            'users',
            'currency_exchange_position',
            'currency_exchange_record',
        ];

        controller.transaction = (cb) => {
            return cb({
                currencyExchange: {
                    async getPositionById(id, forUpdate = []) {
                        assert.strictEqual(id, POSITION_ID);
                        assert.deepEqual(forUpdate, FOR_UPDATE);
                        // for now, just return an empty array
                        return {
                            userId: POSITION_OWNER,
                            balance: BALANCE,
                            currencyType: CURRENCY,
                            rate: RATE,
                            positionId: POSITION_ID,
                        };
                    },
                    async recordPositionFunding(positionId, amount, forUpdate) {
                        throw new Error('recordPositionFunding() called');
                    },
                    async subtractFromPositionBalance(positionId, amountToSubtract, forUpdate = []) {
                        throw new Error('subtractFromPositionBalance() called');
                    },
                    async recordCurrencyExchange(positionId, buyerUserId, amountPurchased, amountSold, forUpdate) {
                        throw new Error('recordCurrencyExchange() called');
                    }
                },
                economy: {
                    async addToUserBalanceV2(userId, amount, currency, forUpdate) {
                        throw new Error('addToUserBalanceV2() called');
                    },
                    async createTransaction(userIdTo, userIdFrom, amount, currency, type, description, fromType, toType, catalogId, userInventoryId) {
                        throw new Error('createTransaction() called');
                    },
                    async subtractFromUserBalanceV2(userId, amount, currency, forUpdate) {
                        throw new Error('subtractFromUserBalanceV2() called');
                    }
                },
                user: {
                    async getInfo(id, specificColumns, forUpdate) {
                        throw new Error('getInfo() called');
                    }
                },
                BadRequest: controller.BadRequest,
                Conflict: controller.Conflict,
            })
        }
        await throwsC('CannotPurchaseOwnedPosition', controller.purchasePosition(session, POSITION_ID, AMOUNT_TO_BUY));
        // pass
    });
    it('Should try to purchase an invalid position amount (float) and fail', async () => {
        const POSITION_ID = 1986;
        const BALANCE = 100;
        const AMOUNT_TO_BUY = 50.25;
        const RATE = 10;
        const CURRENCY = 1;
        const session = {
            userId: 1,
            username: 'Unit Test',
        };
        const POSITION_OWNER = 2;
        assert.notEqual(POSITION_OWNER, session.userId);

        const FOR_UPDATE = [
            'users',
            'currency_exchange_position',
            'currency_exchange_record',
        ];

        controller.transaction = (cb) => {
            return cb({
                currencyExchange: {
                    async getPositionById(id, forUpdate = []) {
                        assert.strictEqual(id, POSITION_ID);
                        assert.deepEqual(forUpdate, FOR_UPDATE);
                        // for now, just return an empty array
                        return {
                            userId: POSITION_OWNER,
                            balance: BALANCE,
                            currencyType: CURRENCY,
                            rate: RATE,
                            positionId: POSITION_ID,
                        };
                    },
                    async recordPositionFunding(positionId, amount, forUpdate) {
                        throw new Error('recordPositionFunding() called');
                    },
                    async subtractFromPositionBalance(positionId, amountToSubtract, forUpdate = []) {
                        throw new Error('subtractFromPositionBalance() called');
                    },
                    async recordCurrencyExchange(positionId, buyerUserId, amountPurchased, amountSold, forUpdate) {
                        throw new Error('recordCurrencyExchange() called');
                    }
                },
                economy: {
                    async addToUserBalanceV2(userId, amount, currency, forUpdate) {
                        throw new Error('addToUserBalanceV2() called');
                    },
                    async createTransaction(userIdTo, userIdFrom, amount, currency, type, description, fromType, toType, catalogId, userInventoryId) {
                        throw new Error('createTransaction() called');
                    },
                    async subtractFromUserBalanceV2(userId, amount, currency, forUpdate) {
                        throw new Error('subtractFromUserBalanceV2() called');
                    }
                },
                user: {
                    async getInfo(id, specificColumns, forUpdate) {
                        assert.strictEqual(id, session.userId);
                        assert.deepEqual(specificColumns, ['primaryBalance','secondaryBalance']);
                        assert.deepEqual(forUpdate, FOR_UPDATE);
                        return {
                            primaryBalance: AMOUNT_TO_BUY * RATE,
                            secondaryBalance: AMOUNT_TO_BUY * RATE,
                        };
                    }
                },
                BadRequest: controller.BadRequest,
                Conflict: controller.Conflict,
            })
        }
        await throwsC('InvalidPurchaseAmount', controller.purchasePosition(session, POSITION_ID, AMOUNT_TO_BUY));
        // pass
    });
    it('Should try to purchase a position and fail due to not enough currency (buying primary)', async () => {
        const POSITION_ID = 1986;
        const BALANCE = 100;
        const AMOUNT_TO_BUY = 50;
        const RATE = 10;
        const CURRENCY = 1;
        const session = {
            userId: 1,
            username: 'Unit Test',
        };
        const POSITION_OWNER = 2;
        assert.notEqual(POSITION_OWNER, session.userId);

        const FOR_UPDATE = [
            'users',
            'currency_exchange_position',
            'currency_exchange_record',
        ];

        controller.transaction = (cb) => {
            return cb({
                currencyExchange: {
                    async getPositionById(id, forUpdate = []) {
                        assert.strictEqual(id, POSITION_ID);
                        assert.deepEqual(forUpdate, FOR_UPDATE);
                        // for now, just return an empty array
                        return {
                            userId: POSITION_OWNER,
                            balance: BALANCE,
                            currencyType: CURRENCY,
                            rate: RATE,
                            positionId: POSITION_ID,
                        };
                    },
                    async recordPositionFunding(positionId, amount, forUpdate) {
                        throw new Error('recordPositionFunding() called');
                    },
                    async subtractFromPositionBalance(positionId, amountToSubtract, forUpdate = []) {
                        throw new Error('subtractFromPositionBalance() called');
                    },
                    async recordCurrencyExchange(positionId, buyerUserId, amountPurchased, amountSold, forUpdate) {
                        throw new Error('recordCurrencyExchange() called');
                    }
                },
                economy: {
                    async addToUserBalanceV2(userId, amount, currency, forUpdate) {
                        throw new Error('addToUserBalanceV2() called');
                    },
                    async createTransaction(userIdTo, userIdFrom, amount, currency, type, description, fromType, toType, catalogId, userInventoryId) {
                        throw new Error('createTransaction() called');
                    },
                    async subtractFromUserBalanceV2(userId, amount, currency, forUpdate) {
                        throw new Error('subtractFromUserBalanceV2() called');
                    }
                },
                user: {
                    async getInfo(id, specificColumns, forUpdate) {
                        if (id === session.userId) {
                            assert.strictEqual(id, session.userId);
                            assert.deepEqual(specificColumns, ['primaryBalance','secondaryBalance']);
                            assert.deepEqual(forUpdate, FOR_UPDATE);
                            return {
                                primaryBalance: 1,
                                secondaryBalance: 1,
                            };
                        }else if (id === POSITION_OWNER) {
                            assert.strictEqual(id, POSITION_OWNER);
                            assert.deepEqual(specificColumns, ['accountStatus']);
                            assert.deepEqual(forUpdate, FOR_UPDATE);
                            return {
                                accountStatus: 0,
                            };
                        }else{
                            throw new Error('id passed to getInfo() is of neither seller or buyer');
                        }
                    }
                },
                BadRequest: controller.BadRequest,
                Conflict: controller.Conflict,
            })
        }
        await throwsC('NotEnoughCurrency', controller.purchasePosition(session, POSITION_ID, AMOUNT_TO_BUY));
        // pass
    });
    it('Should try to purchase a position and fail due to not enough currency (buying secondary)', async () => {
        const POSITION_ID = 1986;
        const BALANCE = 100;
        const AMOUNT_TO_BUY = 50;
        const RATE = 10;
        const CURRENCY = 2;
        const session = {
            userId: 1,
            username: 'Unit Test',
        };
        const POSITION_OWNER = 2;
        assert.notEqual(POSITION_OWNER, session.userId);

        const FOR_UPDATE = [
            'users',
            'currency_exchange_position',
            'currency_exchange_record',
        ];

        controller.transaction = (cb) => {
            return cb({
                currencyExchange: {
                    async getPositionById(id, forUpdate = []) {
                        assert.strictEqual(id, POSITION_ID);
                        assert.deepEqual(forUpdate, FOR_UPDATE);
                        // for now, just return an empty array
                        return {
                            userId: POSITION_OWNER,
                            balance: BALANCE,
                            currencyType: CURRENCY,
                            rate: RATE,
                            positionId: POSITION_ID,
                        };
                    },
                    async recordPositionFunding(positionId, amount, forUpdate) {
                        throw new Error('recordPositionFunding() called');
                    },
                    async subtractFromPositionBalance(positionId, amountToSubtract, forUpdate = []) {
                        throw new Error('subtractFromPositionBalance() called');
                    },
                    async recordCurrencyExchange(positionId, buyerUserId, amountPurchased, amountSold, forUpdate) {
                        throw new Error('recordCurrencyExchange() called');
                    }
                },
                economy: {
                    async addToUserBalanceV2(userId, amount, currency, forUpdate) {
                        throw new Error('addToUserBalanceV2() called');
                    },
                    async createTransaction(userIdTo, userIdFrom, amount, currency, type, description, fromType, toType, catalogId, userInventoryId) {
                        throw new Error('createTransaction() called');
                    },
                    async subtractFromUserBalanceV2(userId, amount, currency, forUpdate) {
                        throw new Error('subtractFromUserBalanceV2() called');
                    }
                },
                user: {
                    async getInfo(id, specificColumns, forUpdate) {
                        if (id === session.userId) {
                            assert.strictEqual(id, session.userId);
                            assert.deepEqual(specificColumns, ['primaryBalance','secondaryBalance']);
                            assert.deepEqual(forUpdate, FOR_UPDATE);
                            return {
                                primaryBalance: 1,
                                secondaryBalance: 1,
                            };
                        }else if (id === POSITION_OWNER) {
                            assert.strictEqual(id, POSITION_OWNER);
                            assert.deepEqual(specificColumns, ['accountStatus']);
                            assert.deepEqual(forUpdate, FOR_UPDATE);
                            return {
                                accountStatus: 0,
                            };
                        }else{
                            throw new Error('id passed to getInfo() is of neither seller or buyer');
                        }
                    }
                },
                BadRequest: controller.BadRequest,
                Conflict: controller.Conflict,
            })
        }
        await throwsC('NotEnoughCurrency', controller.purchasePosition(session, POSITION_ID, AMOUNT_TO_BUY));
        // pass
    });
    it('Should try to purchase an invalid position amount (float) and fail (below 1)', async () => {
        const POSITION_ID = 1986;
        const BALANCE = 100;
        const AMOUNT_TO_BUY = 0.5;
        const RATE = 1;
        const CURRENCY = 1;
        const session = {
            userId: 1,
            username: 'Unit Test',
        };
        const POSITION_OWNER = 2;
        assert.notEqual(POSITION_OWNER, session.userId);

        const FOR_UPDATE = [
            'users',
            'currency_exchange_position',
            'currency_exchange_record',
        ];

        controller.transaction = (cb) => {
            return cb({
                currencyExchange: {
                    async getPositionById(id, forUpdate = []) {
                        assert.strictEqual(id, POSITION_ID);
                        assert.deepEqual(forUpdate, FOR_UPDATE);
                        // for now, just return an empty array
                        return {
                            userId: POSITION_OWNER,
                            balance: BALANCE,
                            currencyType: CURRENCY,
                            rate: RATE,
                            positionId: POSITION_ID,
                        };
                    },
                    async recordPositionFunding(positionId, amount, forUpdate) {
                        throw new Error('recordPositionFunding() called');
                    },
                    async subtractFromPositionBalance(positionId, amountToSubtract, forUpdate = []) {
                        throw new Error('subtractFromPositionBalance() called');
                    },
                    async recordCurrencyExchange(positionId, buyerUserId, amountPurchased, amountSold, forUpdate) {
                        throw new Error('recordCurrencyExchange() called');
                    }
                },
                economy: {
                    async addToUserBalanceV2(userId, amount, currency, forUpdate) {
                        throw new Error('addToUserBalanceV2() called');
                    },
                    async createTransaction(userIdTo, userIdFrom, amount, currency, type, description, fromType, toType, catalogId, userInventoryId) {
                        throw new Error('createTransaction() called');
                    },
                    async subtractFromUserBalanceV2(userId, amount, currency, forUpdate) {
                        throw new Error('subtractFromUserBalanceV2() called');
                    }
                },
                user: {
                    async getInfo(id, specificColumns, forUpdate) {
                        if (id === session.userId) {
                            assert.strictEqual(id, session.userId);
                            assert.deepEqual(specificColumns, ['primaryBalance','secondaryBalance']);
                            assert.deepEqual(forUpdate, FOR_UPDATE);
                            return {
                                primaryBalance: AMOUNT_TO_BUY * RATE,
                                secondaryBalance: AMOUNT_TO_BUY * RATE,
                            };
                        }else if (id === POSITION_OWNER) {
                            assert.strictEqual(id, POSITION_OWNER);
                            assert.deepEqual(specificColumns, ['accountStatus']);
                            assert.deepEqual(forUpdate, FOR_UPDATE);
                            return {
                                accountStatus: 0,
                            };
                        }else{
                            throw new Error('id passed to getInfo() is of neither seller or buyer');
                        }
                    }
                },
                BadRequest: controller.BadRequest,
                Conflict: controller.Conflict,
            })
        }
        await throwsC('PurchaseAmountTooLow', controller.purchasePosition(session, POSITION_ID, AMOUNT_TO_BUY));
        // pass
    });
    it('Should try to purchase more than a positons balance and fail', async () => {
        const POSITION_ID = 1986;
        const BALANCE = 100;
        const AMOUNT_TO_BUY = 125;
        const RATE = 1;
        const CURRENCY = 1;
        const session = {
            userId: 1,
            username: 'Unit Test',
        };
        const POSITION_OWNER = 2;
        assert.notEqual(POSITION_OWNER, session.userId);

        const FOR_UPDATE = [
            'users',
            'currency_exchange_position',
            'currency_exchange_record',
        ];

        controller.transaction = (cb) => {
            return cb({
                currencyExchange: {
                    async getPositionById(id, forUpdate = []) {
                        assert.strictEqual(id, POSITION_ID);
                        assert.deepEqual(forUpdate, FOR_UPDATE);
                        // for now, just return an empty array
                        return {
                            userId: POSITION_OWNER,
                            balance: BALANCE,
                            currencyType: CURRENCY,
                            rate: RATE,
                            positionId: POSITION_ID,
                        };
                    },
                    async recordPositionFunding(positionId, amount, forUpdate) {
                        throw new Error('recordPositionFunding() called');
                    },
                    async subtractFromPositionBalance(positionId, amountToSubtract, forUpdate = []) {
                        throw new Error('subtractFromPositionBalance() called');
                    },
                    async recordCurrencyExchange(positionId, buyerUserId, amountPurchased, amountSold, forUpdate) {
                        throw new Error('recordCurrencyExchange() called');
                    }
                },
                economy: {
                    async addToUserBalanceV2(userId, amount, currency, forUpdate) {
                        throw new Error('addToUserBalanceV2() called');
                    },
                    async createTransaction(userIdTo, userIdFrom, amount, currency, type, description, fromType, toType, catalogId, userInventoryId) {
                        throw new Error('createTransaction() called');
                    },
                    async subtractFromUserBalanceV2(userId, amount, currency, forUpdate) {
                        throw new Error('subtractFromUserBalanceV2() called');
                    }
                },
                user: {
                    async getInfo(id, specificColumns, forUpdate) {
                        assert.strictEqual(id, session.userId);
                        assert.deepEqual(specificColumns, ['primaryBalance','secondaryBalance']);
                        assert.deepEqual(forUpdate, FOR_UPDATE);
                        return {
                            primaryBalance: AMOUNT_TO_BUY * RATE,
                            secondaryBalance: AMOUNT_TO_BUY * RATE,
                        };
                    }
                },
                BadRequest: controller.BadRequest,
                Conflict: controller.Conflict,
            })
        }
        await throwsC('NotEnoughInPositionBalance', controller.purchasePosition(session, POSITION_ID, AMOUNT_TO_BUY));
        // pass
    });
});