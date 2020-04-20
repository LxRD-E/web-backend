const account = require('../../helpers/random-acount');
const assert = require('assert');
const axios = require('axios').default;

describe('/api/v1/positions/create', () => {
    it('Should allow userOne to purchase a new position, userTwo to buy all of position', async () => {
        const positionStartAmount = 100;
        const positionRate = 10;
        const userTwoBuyAmount = 100;
        const expectedAmountForUserOneAfterSale = 1000;
        /**
         * @type {AxiosInstance}
         */
        let userOne = await account({
            verifiedEmail: true,
            startPrimary: positionStartAmount,
        });
        /**
         * @type {AxiosInstance}
         */
        let userTwo = await account({
            verifiedEmail: true,
            startSecondary: expectedAmountForUserOneAfterSale,
        })
        // create position
        let createPosition = await userOne.post('/currency-exchange/positions/create', {
            balance: positionStartAmount, // Start with a balance of 100 primary
            currency: 1, // I want to give primary for secondary
            rate: positionRate, // My rate is 10 secondary for my 1 primary
        });
        assert.strictEqual(createPosition.status, 200, 'Should create successfully');
        let positionId = createPosition.data.positionId;
        assert.strictEqual(typeof positionId, 'number', 'PositionId should be defined in body as number');
        // confirm position was created properly
        let positionData = await userOne.get('/currency-exchange/positions/'+positionId);
        assert.strictEqual(positionData.status, 200);
        assert.strictEqual(positionData.data.balance, positionStartAmount, 'balance should be same as defined');
        assert.strictEqual(positionData.data.rate, positionRate, 'position rate should be same as defined');
        // confirm amount was subtracted from creator
        let userInfoOne = await userOne.get('/auth/current-user');
        assert.strictEqual(userInfoOne.data.primaryBalance, 0, 'balance should now be 0');
        // now, usertwo needs to buy the position
        let buyPosition = await userTwo.post('/currency-exchange/positions/'+positionId+'/purchase', {
            amount: userTwoBuyAmount, // buy all of the userOne's balance
        });
        assert.strictEqual(buyPosition.status, 200, 'buy should complete with 200');

        // confirm balance is updated
        let newPositionData = await userOne.get('/currency-exchange/positions/'+positionId);
        assert.strictEqual(newPositionData.status, 200);
        assert.strictEqual(newPositionData.data.balance, 0, 'balance should be 0 (empty)');
        // confirm userOne balance is updated
        let newUserInfoOne = await userOne.get('/auth/current-user');
        assert.strictEqual(newUserInfoOne.data.primaryBalance, 0, 'primary balance should still be 0');
        // add 10 to balance cuz daily stipend
        assert.strictEqual(newUserInfoOne.data.secondaryBalance, expectedAmountForUserOneAfterSale + 10, 'secondary balance should be expected');
        // confirm userTwo balance is updated
        let userInfoTwo = await userTwo.get('/auth/current-user');
        assert.strictEqual(userInfoTwo.data.primaryBalance, userTwoBuyAmount, 'primary balance should be what was purchased');
        // balance of 10 cuz daily stipend
        assert.strictEqual(userInfoTwo.data.secondaryBalance, 10, 'secondary balance should be 0');
        // pass
    });
    it('Should allow userOne to purchase a new position, userOne to delete position, userTwo to try to buy all of position but fail', async () => {
        const positionStartAmount = 100;
        const positionRate = 10;
        const userTwoBuyAmount = 100;
        const expectedAmountForUserOneAfterSale = 1000;
        /**
         * @type {AxiosInstance}
         */
        let userOne = await account({
            verifiedEmail: true,
            startPrimary: positionStartAmount,
        });
        /**
         * @type {AxiosInstance}
         */
        let userTwo = await account({
            verifiedEmail: true,
            startSecondary: expectedAmountForUserOneAfterSale,
        })
        // create position
        let createPosition = await userOne.post('/currency-exchange/positions/create', {
            balance: positionStartAmount, // Start with a balance of 100 primary
            currency: 1, // I want to give primary for secondary
            rate: positionRate, // My rate is 10 secondary for my 1 primary
        });
        assert.strictEqual(createPosition.status, 200, 'Should create successfully');
        let positionId = createPosition.data.positionId;
        assert.strictEqual(typeof positionId, 'number', 'PositionId should be defined in body as number');
        // confirm position was created properly
        let positionData = await userOne.get('/currency-exchange/positions/'+positionId);
        assert.strictEqual(positionData.status, 200);
        assert.strictEqual(positionData.data.balance, positionStartAmount, 'balance should be same as defined');
        assert.strictEqual(positionData.data.rate, positionRate, 'position rate should be same as defined');
        // confirm amount was subtracted from creator
        let userInfoOne = await userOne.get('/auth/current-user');
        assert.strictEqual(userInfoOne.data.primaryBalance, 0, 'balance should now be 0');
        // take position offsale
        let positionDelete = await userOne.delete('/currency-exchange/positions/'+positionId);
        assert.strictEqual(positionDelete.status, 200);
        // confirm balance is back to normal
        let userInfoOneAfterDeletion = await userOne.get('/auth/current-user');
        assert.strictEqual(userInfoOneAfterDeletion.data.primaryBalance, positionStartAmount, 'balance should now be positionStartAmount');
        // confirm balance was updated
        let newPositionData = await userOne.get('/currency-exchange/positions/'+positionId);
        assert.strictEqual(newPositionData.status, 200);
        assert.strictEqual(newPositionData.data.balance, 0, 'balance should be 0 (empty)');
        // now, usertwo needs to buy the position
        let buyPosition = await userTwo.post('/currency-exchange/positions/'+positionId+'/purchase', {
            amount: userTwoBuyAmount, // buy all of the userOne's balance
        });
        assert.strictEqual(buyPosition.status, 409, 'request should fail');
        assert.strictEqual(buyPosition.data.error.code, 'NotEnoughInPositionBalance');
        // confirm userOne balance is updated
        let newUserInfoOne = await userOne.get('/auth/current-user');
        assert.strictEqual(newUserInfoOne.data.primaryBalance, userTwoBuyAmount, 'primary balance should be userTwoBuyAmount');
        // add 10 to balance cuz daily stipend
        assert.strictEqual(newUserInfoOne.data.secondaryBalance, 10, 'secondary balance of first user should be 10');
        // confirm userTwo balance is updated
        let userInfoTwo = await userTwo.get('/auth/current-user');
        assert.strictEqual(userInfoTwo.data.primaryBalance, 0, 'primary balance should be un-touched (0)');
        // balance of 10 cuz daily stipend
        assert.strictEqual(userInfoTwo.data.secondaryBalance, expectedAmountForUserOneAfterSale + 10, 'secondary balance should be 0');
        // pass
    });
    it('[multi/5 attempts] Should allow userOne to purchase a new position, then all other users should try to buy it but fail except one', async () => {
        const positionStartAmount = 100;
        const positionRate = 10;
        const userTwoBuyAmount = 100;
        const expectedAmountForUserOneAfterSale = 1000;
        /**
         * @type {AxiosInstance}
         */
        let userOne = await account({
            verifiedEmail: true,
            startPrimary: positionStartAmount,
        });

        // create position
        let createPosition = await userOne.post('/currency-exchange/positions/create', {
            balance: positionStartAmount, // Start with a balance of 100 primary
            currency: 1, // I want to give primary for secondary
            rate: positionRate, // My rate is 10 secondary for my 1 primary
        });
        assert.strictEqual(createPosition.status, 200, 'Should create successfully');
        let positionId = createPosition.data.positionId;
        assert.strictEqual(typeof positionId, 'number', 'PositionId should be defined in body as number');


        let makeRequest = async (us) => {
            return await us.post('/currency-exchange/positions/'+positionId+'/purchase', {
                amount: userTwoBuyAmount, // buy all of the userOne's balance
            });
        }
        let accounts = [];
        let attemptsToTry = 5;
        let _i = 0;
        while (_i < attemptsToTry) {
            _i++;
            let createdAccount = await account({
                verifiedEmail: true,
                startSecondary: expectedAmountForUserOneAfterSale,
            });
            accounts.push(createdAccount);
        }
        let _purchasePositionAttempts = [];
        accounts.forEach(acc => {_purchasePositionAttempts.push(makeRequest(acc))});
        let allAttempts = await Promise.all(_purchasePositionAttempts);
        let OKResponses = 0;
        let okResponse = {};
        let successAtt = {};
        allAttempts.forEach(att => {
            if (att.status === 200) {
                okResponse = att;
                OKResponses++;
                successAtt = axios(att.config);
            }else{
                assert.strictEqual(att.status, 409, '409 error code');
                assert.strictEqual(att.data.error.code, 'NotEnoughInPositionBalance', 'not enough in position balance error code');
            }
        })
        assert.strictEqual(OKResponses, 1, 'should only have 1 ok response');
        // pass
    }).timeout(5000);
    it('[multi/2 attempts] Should allow userOne to purchase a new position, then all other users should try to buy it but fail except one', async () => {
        const positionStartAmount = 100;
        const positionRate = 10;
        const userTwoBuyAmount = 100;
        const expectedAmountForUserOneAfterSale = 1000;
        /**
         * @type {AxiosInstance}
         */
        let userOne = await account({
            verifiedEmail: true,
            startPrimary: positionStartAmount,
        });

        // create position
        let createPosition = await userOne.post('/currency-exchange/positions/create', {
            balance: positionStartAmount, // Start with a balance of 100 primary
            currency: 1, // I want to give primary for secondary
            rate: positionRate, // My rate is 10 secondary for my 1 primary
        });
        assert.strictEqual(createPosition.status, 200, 'Should create successfully');
        let positionId = createPosition.data.positionId;
        assert.strictEqual(typeof positionId, 'number', 'PositionId should be defined in body as number');


        let makeRequest = async (us) => {
            return await us.post('/currency-exchange/positions/'+positionId+'/purchase', {
                amount: userTwoBuyAmount, // buy all of the userOne's balance
            });
        }
        let accounts = [];
        let attemptsToTry = 2;
        let _i = 0;
        while (_i < attemptsToTry) {
            _i++;
            let createdAccount = await account({
                verifiedEmail: true,
                startSecondary: expectedAmountForUserOneAfterSale,
            });
            accounts.push(createdAccount);
        }
        let _purchasePositionAttempts = [];
        accounts.forEach(acc => {_purchasePositionAttempts.push(makeRequest(acc))});
        let allAttempts = await Promise.all(_purchasePositionAttempts);
        let OKResponses = 0;
        let okResponse = {};
        let successAtt = {};
        allAttempts.forEach(att => {
            if (att.status === 200) {
                okResponse = att;
                OKResponses++;
                successAtt = axios(att.config);
            }else{
                assert.strictEqual(att.status, 409, '409 error code');
                assert.strictEqual(att.data.error.code, 'NotEnoughInPositionBalance', 'not enough in position balance error code');
            }
        })
        assert.strictEqual(OKResponses, 1, 'should only have 1 ok response');
        // pass
    }).timeout(5000);
    it('[multi/10 attempts] Should allow userOne to purchase a new position, then all other users should try to buy it but fail except one', async () => {
        const positionStartAmount = 100;
        const positionRate = 10;
        const userTwoBuyAmount = 100;
        const expectedAmountForUserOneAfterSale = 1000;
        /**
         * @type {AxiosInstance}
         */
        let userOne = await account({
            verifiedEmail: true,
            startPrimary: positionStartAmount,
        });

        // create position
        let createPosition = await userOne.post('/currency-exchange/positions/create', {
            balance: positionStartAmount, // Start with a balance of 100 primary
            currency: 1, // I want to give primary for secondary
            rate: positionRate, // My rate is 10 secondary for my 1 primary
        });
        assert.strictEqual(createPosition.status, 200, 'Should create successfully');
        let positionId = createPosition.data.positionId;
        assert.strictEqual(typeof positionId, 'number', 'PositionId should be defined in body as number');


        let makeRequest = async (us) => {
            return await us.post('/currency-exchange/positions/'+positionId+'/purchase', {
                amount: userTwoBuyAmount, // buy all of the userOne's balance
            });
        }
        let accounts = [];
        let attemptsToTry = 10;
        let _i = 0;
        while (_i < attemptsToTry) {
            _i++;
            let createdAccount = await account({
                verifiedEmail: true,
                startSecondary: expectedAmountForUserOneAfterSale,
            });
            accounts.push(createdAccount);
        }
        let _purchasePositionAttempts = [];
        accounts.forEach(acc => {_purchasePositionAttempts.push(makeRequest(acc))});
        let allAttempts = await Promise.all(_purchasePositionAttempts);
        let OKResponses = 0;
        let okResponse = {};
        let successAtt = {};
        allAttempts.forEach(att => {
            if (att.status === 200) {
                okResponse = att;
                OKResponses++;
                successAtt = axios(att.config);
            }else{
                assert.strictEqual(att.status, 409, '409 error code');
                assert.strictEqual(att.data.error.code, 'NotEnoughInPositionBalance', 'not enough in position balance error code');
            }
        })
        assert.strictEqual(OKResponses, 1, 'should only have 1 ok response');
        // pass
    }).timeout(5000);
    it('[multi/25 attempts] Should allow userOne to purchase a new position, then all other users should try to buy it but fail except one', async () => {
        const positionStartAmount = 100;
        const positionRate = 10;
        const userTwoBuyAmount = 100;
        const expectedAmountForUserOneAfterSale = 1000;
        /**
         * @type {AxiosInstance}
         */
        let userOne = await account({
            verifiedEmail: true,
            startPrimary: positionStartAmount,
        });

        // create position
        let createPosition = await userOne.post('/currency-exchange/positions/create', {
            balance: positionStartAmount, // Start with a balance of 100 primary
            currency: 1, // I want to give primary for secondary
            rate: positionRate, // My rate is 10 secondary for my 1 primary
        });
        assert.strictEqual(createPosition.status, 200, 'Should create successfully');
        let positionId = createPosition.data.positionId;
        assert.strictEqual(typeof positionId, 'number', 'PositionId should be defined in body as number');


        let makeRequest = async (us) => {
            return await us.post('/currency-exchange/positions/'+positionId+'/purchase', {
                amount: userTwoBuyAmount, // buy all of the userOne's balance
            });
        }
        let accounts = [];
        let attemptsToTry = 25;
        let _i = 0;
        while (_i < attemptsToTry) {
            _i++;
            let createdAccount = await account({
                verifiedEmail: true,
                startSecondary: expectedAmountForUserOneAfterSale,
            });
            accounts.push(createdAccount);
        }
        let _purchasePositionAttempts = [];
        accounts.forEach(acc => {_purchasePositionAttempts.push(makeRequest(acc))});
        let allAttempts = await Promise.all(_purchasePositionAttempts);
        let OKResponses = 0;
        let okResponse = {};
        let successAtt = {};
        allAttempts.forEach(att => {
            if (att.status === 200) {
                okResponse = att;
                OKResponses++;
                successAtt = axios(att.config);
            }else{
                assert.strictEqual(att.status, 409, '409 error code');
                assert.strictEqual(att.data.error.code, 'NotEnoughInPositionBalance', 'not enough in position balance error code');
            }
        })
        assert.strictEqual(OKResponses, 1, 'should only have 1 ok response');
        // pass
    }).timeout(10000);
    it('[multi/10 attempts - same user] Should allow userOne to purchase a new position, then userTwo should try to buy it many times but fail except one', async () => {
        const positionStartAmount = 100;
        const positionRate = 10;
        const userTwoBuyAmount = 100;
        const expectedAmountForUserOneAfterSale = 1000;
        /**
         * @type {AxiosInstance}
         */
        let userOne = await account({
            verifiedEmail: true,
            startPrimary: positionStartAmount,
        });

        // create position
        let createPosition = await userOne.post('/currency-exchange/positions/create', {
            balance: positionStartAmount, // Start with a balance of 100 primary
            currency: 1, // I want to give primary for secondary
            rate: positionRate, // My rate is 10 secondary for my 1 primary
        });
        assert.strictEqual(createPosition.status, 200, 'Should create successfully');
        let positionId = createPosition.data.positionId;
        assert.strictEqual(typeof positionId, 'number', 'PositionId should be defined in body as number');


        let makeRequest = async (us) => {
            return await us.post('/currency-exchange/positions/'+positionId+'/purchase', {
                amount: userTwoBuyAmount, // buy all of the userOne's balance
            });
        }
        let attemptsToTry = 10;
        let _purchasePositionAttempts = [];
        let _i = 0;
        let createdAccount = await account({
            verifiedEmail: true,
            startSecondary: expectedAmountForUserOneAfterSale,
        });
        while (_i < attemptsToTry) {
            _purchasePositionAttempts.push(makeRequest(createdAccount));
            _i++;
        }
        let allAttempts = await Promise.all(_purchasePositionAttempts);
        let OKResponses = 0;
        let okResponse = {};
        let successAtt = {};
        allAttempts.forEach(att => {
            if (att.status === 200) {
                okResponse = att;
                OKResponses++;
                successAtt = axios(att.config);
            }else{
                assert.strictEqual(att.status, 409, '409 error code');
                assert.strictEqual(att.data.error.code, 'NotEnoughInPositionBalance', 'not enough in position balance error code');
            }
        })
        assert.strictEqual(OKResponses, 1, 'should only have 1 ok response');
        // pass
    }).timeout(10000);
});