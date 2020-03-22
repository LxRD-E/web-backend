const account = require('../../helpers/random-acount');
const assert = require('assert');

describe('daily stipend test', () => {
    it('should contain a daily stipend in the transaction history', async () => {
        let axios = await account();
        let transactions = await axios.get('/economy/transactions?offset=0');
        assert.strictEqual(transactions.status, 200, 'transaction page status should be ok');
        assert.strictEqual(Array.isArray(transactions.data), true, 'transactions page should be array');
        assert.strictEqual(transactions.data.length, 1, 'there should only be one transaction');
        let firstTransaction = transactions.data[0];
        assert.strictEqual(firstTransaction.userId, 1, 'userid should be system (1)');
        assert.strictEqual(firstTransaction.amount, 10, 'transaction should contain 10 currency');
        assert.strictEqual(firstTransaction.currency, 2, 'first transaction should be in secondary');
        assert.strictEqual(firstTransaction.userInventoryId, null, 'first transaction userInventoryId should be null');
        assert.strictEqual(firstTransaction.description, 'Daily Stipend', 'transaction should have description of daily stipend');
        assert.strictEqual(firstTransaction.transactionType, 2, 'first transaction should have transaction type of 2');
        // confirm balance
        let userinfo = await axios.get('/auth/current-user');
        assert.strictEqual(userinfo.status, 200, 'user info response should be ok');
        // confirm balance
        assert.strictEqual(userinfo.data.secondaryBalance, 10, 'secondary balance should be 10');
        assert.strictEqual(userinfo.data.primaryBalance, 0, 'primary balance should be 0');
        // pass
    });
});

describe('/api/v1/economy/{catalogId}/buy', () => {
    it('Should purchase a normal item that is for sale, subtract price from balance, confirm transaction exists, confirm exists in inventory, and confirm user cannot purchasing twice', async () => {
        const CATALOG_ID = 1057;
        const EXPECTED_PRICE = 10;
        const EXPECTED_CURRENCY = 2;
        const EXPECTED_SELLERID = 1;

        let axios = await account({
            verifiedEmail: true,
        });
        let resp = await axios.post('/economy/'+CATALOG_ID+'/buy', {
            userInventoryId: 0,
            expectedSellerId: EXPECTED_SELLERID,
            expectedPrice: EXPECTED_PRICE,
            expectedCurrency: EXPECTED_CURRENCY,
        });
        assert.strictEqual(resp.status, 200, 'Status Code should be OK for purchase');
        // confirm exists in transactions
        let transactions = await axios.get('/economy/transactions?offset=0');
        assert.strictEqual(transactions.status, 200, 'transaction page status should be ok');
        assert.strictEqual(Array.isArray(transactions.data), true, 'transactions page should be array');
        let latestTransasction = transactions.data[0];
        assert.notEqual(typeof latestTransasction, 'undefined', 'user should have at least one transaction');
        assert.strictEqual(latestTransasction.userId, EXPECTED_SELLERID, 'sellerid of catalog item should be the expected seller id');
        assert.strictEqual(latestTransasction.amount, -EXPECTED_PRICE, 'price should be the expected price');
        assert.strictEqual(latestTransasction.currency, EXPECTED_CURRENCY, 'currency should be the same as expected above');
        assert.strictEqual(latestTransasction.transactionType, 3, 'transaction type should be 3 (aka purchase of standard item)');
        assert.strictEqual(latestTransasction.catalogId, CATALOG_ID, 'catalog id in transaction should be same as purchased');
        assert.strictEqual(typeof latestTransasction.userInventoryId, 'number', 'transaction userInventoryId should be a number');
        // Now config exists in inventory
        let userinfo = await axios.get('/auth/current-user');
        assert.strictEqual(userinfo.status, 200, 'user info response should be ok');
        let userId = userinfo.data.userId;
        // confirm balance
        assert.strictEqual(userinfo.data.secondaryBalance, 0);
        assert.strictEqual(userinfo.data.primaryBalance, 0);
        // grab inventory
        let inv = await axios.get('/user/'+userId+'/inventory?sort=desc&limit=100&category=1');
        assert.strictEqual(inv.status, 200, 'inventory status code should be 200');
        assert.strictEqual(Array.isArray(inv.data.items), true, 'inventory should be array');
        let firstItem = inv.data.items[0];
        assert.strictEqual(firstItem.catalogId, CATALOG_ID);
        assert.strictEqual(inv.data.items.length, 1, 'collectible inventory should only contain 1 item');
        // try to purchase again
        let purchaseAgain = await axios.post('/economy/'+CATALOG_ID+'/buy', {
            userInventoryId: 0,
            expectedSellerId: EXPECTED_SELLERID,
            expectedPrice: EXPECTED_PRICE,
            expectedCurrency: EXPECTED_CURRENCY,
        });
        assert.strictEqual(purchaseAgain.status, 409, 'Status Code should be 409 for second purchase attempt');
        assert.strictEqual(purchaseAgain.data.error.code, 'AlreadyOwns', 'error code for second purchase attempt should be AlreadyOwns');
        // good
    }).timeout(5000);
    it('Should attempt to purchase a normal item that is NOT for sale and fail', async () => {
        const CATALOG_ID = 1056;
        const EXPECTED_PRICE = 10;
        const EXPECTED_CURRENCY = 2;
        const EXPECTED_SELLERID = 1;

        let axios = await account({
            verifiedEmail: true,
        });
        let resp = await axios.post('/economy/'+CATALOG_ID+'/buy', {
            userInventoryId: 0,
            expectedSellerId: EXPECTED_SELLERID,
            expectedPrice: EXPECTED_PRICE,
            expectedCurrency: EXPECTED_CURRENCY,
        });
        assert.strictEqual(resp.status, 400, 'Status Code should be 400 for purchase');
        assert.strictEqual(resp.data.error.code, 'NoLongerForSale', 'error code should indicate item is no longer for sale');
        // confirm does not exist in transactions
        let transactions = await axios.get('/economy/transactions?offset=0');
        assert.strictEqual(transactions.status, 200, 'transaction page status should be ok');
        assert.strictEqual(Array.isArray(transactions.data), true, 'transactions page should be array');
        assert.strictEqual(transactions.data.length, 1, 'there should only be daily stipend transaction');
        // Now confirm does not exist in inventory
        let userinfo = await axios.get('/auth/current-user');
        assert.strictEqual(userinfo.status, 200, 'user info response should be ok');
        let userId = userinfo.data.userId;
        // confirm balance
        assert.strictEqual(userinfo.data.secondaryBalance, 10, 'secondary balance should not be affected by transaction');
        assert.strictEqual(userinfo.data.primaryBalance, 0);
        // grab inventory
        let inv = await axios.get('/user/'+userId+'/inventory?sort=desc&limit=100&category=1');
        assert.strictEqual(inv.status, 200, 'inventory status code should be 200');
        assert.strictEqual(Array.isArray(inv.data.items), true, 'inventory should be array');
        assert.strictEqual(inv.data.items.length, 0, 'collectible inventory should contain 0 items');
        // good
    }).timeout(5000);
    it('Should attempt to purchase a normal item that is for sale but with price changed, and fail', async () => {
        const CATALOG_ID = 1057;
        const EXPECTED_PRICE = 5;
        const EXPECTED_CURRENCY = 2;
        const EXPECTED_SELLERID = 1;

        let axios = await account({
            verifiedEmail: true,
        });
        let resp = await axios.post('/economy/'+CATALOG_ID+'/buy', {
            userInventoryId: 0,
            expectedSellerId: EXPECTED_SELLERID,
            expectedPrice: EXPECTED_PRICE,
            expectedCurrency: EXPECTED_CURRENCY,
        });
        assert.strictEqual(resp.status, 400, 'Status Code should be 400 for purchase');
        assert.strictEqual(resp.data.error.code, 'PriceHasChanged', 'error code should indicate item price has changed');
        // confirm does not exist in transactions
        let transactions = await axios.get('/economy/transactions?offset=0');
        assert.strictEqual(transactions.status, 200, 'transaction page status should be ok');
        assert.strictEqual(Array.isArray(transactions.data), true, 'transactions page should be array');
        assert.strictEqual(transactions.data.length, 1, 'there should only be daily stipend transaction');
        // Now confirm does not exist in inventory
        let userinfo = await axios.get('/auth/current-user');
        assert.strictEqual(userinfo.status, 200, 'user info response should be ok');
        let userId = userinfo.data.userId;
        // confirm balance
        assert.strictEqual(userinfo.data.secondaryBalance, 10, 'secondary balance should not be affected by transaction');
        assert.strictEqual(userinfo.data.primaryBalance, 0);
        // grab inventory
        let inv = await axios.get('/user/'+userId+'/inventory?sort=desc&limit=100&category=1');
        assert.strictEqual(inv.status, 200, 'inventory status code should be 200');
        assert.strictEqual(Array.isArray(inv.data.items), true, 'inventory should be array');
        assert.strictEqual(inv.data.items.length, 0, 'collectible inventory should contain 0 items');
        // good
    }).timeout(5000);
    it('Should attempt to purchase a normal item that is for sale but with currency changed, and fail', async () => {
        const CATALOG_ID = 1057;
        const EXPECTED_PRICE = 10;
        const EXPECTED_CURRENCY = 1;
        const EXPECTED_SELLERID = 1;

        let axios = await account({
            verifiedEmail: true,
        });
        let resp = await axios.post('/economy/'+CATALOG_ID+'/buy', {
            userInventoryId: 0,
            expectedSellerId: EXPECTED_SELLERID,
            expectedPrice: EXPECTED_PRICE,
            expectedCurrency: EXPECTED_CURRENCY,
        });
        assert.strictEqual(resp.status, 400, 'Status Code should be 400 for purchase');
        assert.strictEqual(resp.data.error.code, 'CurrencyHasChanged', 'error code should indicate item price has changed');
        // confirm does not exist in transactions
        let transactions = await axios.get('/economy/transactions?offset=0');
        assert.strictEqual(transactions.status, 200, 'transaction page status should be ok');
        assert.strictEqual(Array.isArray(transactions.data), true, 'transactions page should be array');
        assert.strictEqual(transactions.data.length, 1, 'there should only be daily stipend transaction');
        // Now confirm does not exist in inventory
        let userinfo = await axios.get('/auth/current-user');
        assert.strictEqual(userinfo.status, 200, 'user info response should be ok');
        let userId = userinfo.data.userId;
        // confirm balance
        assert.strictEqual(userinfo.data.secondaryBalance, 10, 'secondary balance should not be affected by transaction');
        assert.strictEqual(userinfo.data.primaryBalance, 0);
        // grab inventory
        let inv = await axios.get('/user/'+userId+'/inventory?sort=desc&limit=100&category=1');
        assert.strictEqual(inv.status, 200, 'inventory status code should be 200');
        assert.strictEqual(Array.isArray(inv.data.items), true, 'inventory should be array');
        assert.strictEqual(inv.data.items.length, 0, 'collectible inventory should contain 0 items');
        // good
    }).timeout(5000);
    it('Should purchase a unique collectible item that is still for sale, subtract price from balance, confirm transaction exists, confirm exists in inventory, and confirm user cannot purchasing twice', async () => {
        const CATALOG_ID = 1058;
        const EXPECTED_PRICE = 10;
        const EXPECTED_CURRENCY = 2;
        const EXPECTED_SELLERID = 1;

        let axios = await account({
            verifiedEmail: true,
        });
        let resp = await axios.post('/economy/'+CATALOG_ID+'/buy', {
            userInventoryId: 0,
            expectedSellerId: EXPECTED_SELLERID,
            expectedPrice: EXPECTED_PRICE,
            expectedCurrency: EXPECTED_CURRENCY,
        });
        assert.strictEqual(resp.status, 200, 'Status Code should be OK for purchase');
        // confirm exists in transactions
        let transactions = await axios.get('/economy/transactions?offset=0');
        assert.strictEqual(transactions.status, 200, 'transaction page status should be ok');
        assert.strictEqual(Array.isArray(transactions.data), true, 'transactions page should be array');
        let latestTransasction = transactions.data[0];
        assert.notEqual(typeof latestTransasction, 'undefined', 'user should have at least one transaction');
        assert.strictEqual(latestTransasction.userId, EXPECTED_SELLERID, 'sellerid of catalog item should be the expected seller id');
        assert.strictEqual(latestTransasction.amount, -EXPECTED_PRICE, 'price should be the expected price');
        assert.strictEqual(latestTransasction.currency, EXPECTED_CURRENCY, 'currency should be the same as expected above');
        assert.strictEqual(latestTransasction.transactionType, 3, 'transaction type should be 3 (aka purchase of standard item)');
        assert.strictEqual(latestTransasction.catalogId, CATALOG_ID, 'catalog id in transaction should be same as purchased');
        assert.strictEqual(typeof latestTransasction.userInventoryId, 'number', 'transaction userInventoryId should be a number');
        // Now config exists in inventory
        let userinfo = await axios.get('/auth/current-user');
        assert.strictEqual(userinfo.status, 200, 'user info response should be ok');
        let userId = userinfo.data.userId;
        // confirm balance
        assert.strictEqual(userinfo.data.secondaryBalance, 0);
        assert.strictEqual(userinfo.data.primaryBalance, 0);
        // grab inventory
        let inv = await axios.get('/user/'+userId+'/inventory/collectibles?sort=desc&limit=100');
        assert.strictEqual(inv.status, 200, 'inventory status code should be 200');
        assert.strictEqual(Array.isArray(inv.data.items), true, 'inventory should be array');
        let firstItem = inv.data.items[0];
        assert.strictEqual(firstItem.catalogId, CATALOG_ID);
        assert.strictEqual(inv.data.items.length, 1, 'collectible inventory should only contain 1 item');
        // try to purchase again
        let purchaseAgain = await axios.post('/economy/'+CATALOG_ID+'/buy', {
            userInventoryId: 0,
            expectedSellerId: EXPECTED_SELLERID,
            expectedPrice: EXPECTED_PRICE,
            expectedCurrency: EXPECTED_CURRENCY,
        });
        assert.strictEqual(purchaseAgain.status, 409, 'Status Code should be 409 for second purchase attempt');
        assert.strictEqual(purchaseAgain.data.error.code, 'AlreadyOwns', 'error code for second purchase attempt should be AlreadyOwns');
        // good
    }).timeout(5000);
    it('Should purchase a collectible item being sold by another user, subtract price from balance, confirm transaction exists, confirm exists in inventory, and confirm user cannot purchasing multiple times (with varying levels of data accuracy)', async () => {
        let axios = await account({
            verifiedEmail: true,
        });
        // convert currency
        await axios.put('/economy/currency/convert', {
            "currency": 2,
            "amount": 10
        });
        let CATALOG_ID = 1055;
        let EXPECTED_PRICE = 1;
        let EXPECTED_CURRENCY = 2;
        let EXPECTED_SELLERID = 1;
        let userInventoryId = 0;
        // get seller
        let sellerInfo = await axios.get('/catalog/'+CATALOG_ID+'/sellers?offset=0');
        let cheapest = sellerInfo.data.sellers[0];
        EXPECTED_PRICE = cheapest.price;
        EXPECTED_CURRENCY = 1;
        EXPECTED_SELLERID = cheapest.userId;
        userInventoryId = cheapest.userInventoryId;
        assert.strictEqual(sellerInfo.status, 200, 'SellerInfo results should be 200 OK');
        let resp = await axios.post('/economy/'+CATALOG_ID+'/buy', {
            userInventoryId: userInventoryId,
            expectedSellerId: EXPECTED_SELLERID,
            expectedPrice: EXPECTED_PRICE,
            expectedCurrency: EXPECTED_CURRENCY,
        });
        assert.strictEqual(resp.status, 200, 'Status Code should be OK for purchase');
        // confirm exists in transactions
        let transactions = await axios.get('/economy/transactions?offset=0');
        assert.strictEqual(transactions.status, 200, 'transaction page status should be ok');
        assert.strictEqual(Array.isArray(transactions.data), true, 'transactions page should be array');
        let latestTransasction = transactions.data[0];
        assert.notEqual(typeof latestTransasction, 'undefined', 'user should have at least one transaction');
        assert.strictEqual(latestTransasction.userId, EXPECTED_SELLERID, 'sellerid of catalog item should be the expected seller id');
        assert.strictEqual(latestTransasction.amount, -EXPECTED_PRICE, 'price should be the expected price');
        assert.strictEqual(latestTransasction.currency, EXPECTED_CURRENCY, 'currency should be the same as expected above');
        assert.strictEqual(latestTransasction.transactionType, 3, 'transaction type should be 3 (aka purchase of standard item)');
        assert.strictEqual(latestTransasction.catalogId, CATALOG_ID, 'catalog id in transaction should be same as purchased');
        assert.strictEqual(typeof latestTransasction.userInventoryId, 'number', 'transaction userInventoryId should be a number');
        // Now config exists in inventory
        let userinfo = await axios.get('/auth/current-user');
        assert.strictEqual(userinfo.status, 200, 'user info response should be ok');
        let userId = userinfo.data.userId;
        // confirm balance
        assert.strictEqual(userinfo.data.secondaryBalance, 0);
        assert.strictEqual(userinfo.data.primaryBalance, 0);
        // grab inventory
        let inv = await axios.get('/user/'+userId+'/inventory/collectibles?sort=desc&limit=100');
        assert.strictEqual(inv.status, 200, 'inventory status code should be 200');
        assert.strictEqual(Array.isArray(inv.data.items), true, 'inventory should be array');
        let firstItem = inv.data.items[0];
        assert.strictEqual(firstItem.catalogId, CATALOG_ID);
        assert.strictEqual(inv.data.items.length, 1, 'collectible inventory should only contain 1 item');
        // try to purchase again
        // use default data
        let purchaseAgain = await axios.post('/economy/'+CATALOG_ID+'/buy', {
            userInventoryId: userInventoryId,
            expectedSellerId: EXPECTED_SELLERID,
            expectedPrice: EXPECTED_PRICE,
            expectedCurrency: EXPECTED_CURRENCY,
        });
        assert.strictEqual(purchaseAgain.status, 400, 'Status Code should be 400 for second purchase attempt');
        assert.strictEqual(purchaseAgain.data.error.code, 'PriceHasChanged', 'error code for second purchase attempt should be PriceHasChanged');
        // try to purchase using same data as above with 0 price (same as in DB when item is marked not for sale)
        let purchaseAgainNoPrice = await axios.post('/economy/'+CATALOG_ID+'/buy', {
            userInventoryId: userInventoryId,
            expectedSellerId: EXPECTED_SELLERID,
            expectedPrice: 0,
            expectedCurrency: EXPECTED_CURRENCY,
        });
        assert.strictEqual(purchaseAgainNoPrice.status, 400, 'Status Code should be 400 for third purchase attempt');
        assert.strictEqual(purchaseAgainNoPrice.data.error.code, 'SellerHasChanged', 'error code for third purchase attempt should be SellerHasChanged');
        // try to purchase one more time with authenticated users userid and 0 price; matching database info identically
        let purchaseAgainCorrectInfo = await axios.post('/economy/'+CATALOG_ID+'/buy', {
            userInventoryId: userInventoryId,
            expectedSellerId: userinfo.data.userId,
            expectedPrice: 0,
            expectedCurrency: EXPECTED_CURRENCY,
        });
        assert.strictEqual(purchaseAgainCorrectInfo.status, 400, 'Status Code should be 400 for forth attempt');
        assert.strictEqual(purchaseAgainCorrectInfo.data.error.code, 'ItemNoLongerForSale', 'error code for forth purchase attempt should be ItemNoLongerForSale');
        // good
    }).timeout(5000);
    it('Should attempt to purchase a collectible catalog item 10 times at once, but only have one attempt succeed due to race condition preventions', async () => {
        const CATALOG_ID = 1058;
        const EXPECTED_PRICE = 10;
        const EXPECTED_CURRENCY = 2;
        const EXPECTED_SELLERID = 1;

        let axios = await account({
            verifiedEmail: true,
        });
        // grab csrf
        // (this should fail; it doesnt really matter)
        await axios.post('/economy/'+1+'/buy', {
            userInventoryId: 1,
            expectedSellerId: 1,
            expectedPrice: 1,
            expectedCurrency: 1,
        });
        // make 5 attempts at the same time
        let proms = await Promise.all([
            axios.post('/economy/'+CATALOG_ID+'/buy', {
                userInventoryId: 0,
                expectedSellerId: EXPECTED_SELLERID,
                expectedPrice: EXPECTED_PRICE,
                expectedCurrency: EXPECTED_CURRENCY,
            }),
            axios.post('/economy/'+CATALOG_ID+'/buy', {
                userInventoryId: 0,
                expectedSellerId: EXPECTED_SELLERID,
                expectedPrice: EXPECTED_PRICE,
                expectedCurrency: EXPECTED_CURRENCY,
            }),
            axios.post('/economy/'+CATALOG_ID+'/buy', {
                userInventoryId: 0,
                expectedSellerId: EXPECTED_SELLERID,
                expectedPrice: EXPECTED_PRICE,
                expectedCurrency: EXPECTED_CURRENCY,
            }),
            axios.post('/economy/'+CATALOG_ID+'/buy', {
                userInventoryId: 0,
                expectedSellerId: EXPECTED_SELLERID,
                expectedPrice: EXPECTED_PRICE,
                expectedCurrency: EXPECTED_CURRENCY,
            }),
            axios.post('/economy/'+CATALOG_ID+'/buy', {
                userInventoryId: 0,
                expectedSellerId: EXPECTED_SELLERID,
                expectedPrice: EXPECTED_PRICE,
                expectedCurrency: EXPECTED_CURRENCY,
            }),
            axios.post('/economy/'+CATALOG_ID+'/buy', {
                userInventoryId: 0,
                expectedSellerId: EXPECTED_SELLERID,
                expectedPrice: EXPECTED_PRICE,
                expectedCurrency: EXPECTED_CURRENCY,
            }),
            axios.post('/economy/'+CATALOG_ID+'/buy', {
                userInventoryId: 0,
                expectedSellerId: EXPECTED_SELLERID,
                expectedPrice: EXPECTED_PRICE,
                expectedCurrency: EXPECTED_CURRENCY,
            }),
            axios.post('/economy/'+CATALOG_ID+'/buy', {
                userInventoryId: 0,
                expectedSellerId: EXPECTED_SELLERID,
                expectedPrice: EXPECTED_PRICE,
                expectedCurrency: EXPECTED_CURRENCY,
            }),
            axios.post('/economy/'+CATALOG_ID+'/buy', {
                userInventoryId: 0,
                expectedSellerId: EXPECTED_SELLERID,
                expectedPrice: EXPECTED_PRICE,
                expectedCurrency: EXPECTED_CURRENCY,
            }),
            axios.post('/economy/'+CATALOG_ID+'/buy', {
                userInventoryId: 0,
                expectedSellerId: EXPECTED_SELLERID,
                expectedPrice: EXPECTED_PRICE,
                expectedCurrency: EXPECTED_CURRENCY,
            }),
        ]);
        let resp;
        let twoHundredResponseCount = 0;
        for (const item of proms) {
            if (item.status === 200) {
                resp = item;
                twoHundredResponseCount++;
            }else{
                assert.strictEqual(item.status, 409);
                assert.strictEqual(item.data.error.code, 'Cooldown');
            }
        }
        assert.strictEqual(twoHundredResponseCount, 1, '200 response count should be exactly 1');
        if (!resp) {
            throw new Error('There should be at least one valid response in race condition testing')
        }
        assert.strictEqual(resp.status, 200, 'Status Code should be OK for at least one purchase');
        // confirm exists in transactions
        let transactions = await axios.get('/economy/transactions?offset=0');
        assert.strictEqual(transactions.status, 200, 'transaction page status should be ok');
        assert.strictEqual(Array.isArray(transactions.data), true, 'transactions page should be array');
        assert.strictEqual(transactions.data.length, 2, 'transaciton history should only contain 2 items (daily stipend and recent transaction)')
        let latestTransasction = transactions.data[0];
        assert.notEqual(typeof latestTransasction, 'undefined', 'user should have at least one transaction');
        assert.strictEqual(latestTransasction.userId, EXPECTED_SELLERID, 'sellerid of catalog item should be the expected seller id');
        assert.strictEqual(latestTransasction.amount, -EXPECTED_PRICE, 'price should be the expected price');
        assert.strictEqual(latestTransasction.currency, EXPECTED_CURRENCY, 'currency should be the same as expected above');
        assert.strictEqual(latestTransasction.transactionType, 3, 'transaction type should be 3 (aka purchase of standard item)');
        assert.strictEqual(latestTransasction.catalogId, CATALOG_ID, 'catalog id in transaction should be same as purchased');
        assert.strictEqual(typeof latestTransasction.userInventoryId, 'number', 'transaction userInventoryId should be a number');
        // Now config exists in inventory
        let userinfo = await axios.get('/auth/current-user');
        assert.strictEqual(userinfo.status, 200, 'user info response should be ok');
        let userId = userinfo.data.userId;
        // confirm balance
        assert.strictEqual(userinfo.data.secondaryBalance, 0);
        assert.strictEqual(userinfo.data.primaryBalance, 0);
        // grab inventory
        let inv = await axios.get('/user/'+userId+'/inventory/collectibles?sort=desc&limit=100');
        assert.strictEqual(inv.status, 200, 'inventory status code should be 200');
        assert.strictEqual(Array.isArray(inv.data.items), true, 'inventory should be array');
        let firstItem = inv.data.items[0];
        assert.strictEqual(firstItem.catalogId, CATALOG_ID);
        assert.strictEqual(inv.data.items.length, 1, 'collectible inventory should only contain 1 item');
        // good
    }).timeout(5000);
    it('Should attempt to purchase a collectible catalog item 3 times at once, but only have one attempt succeed due to race condition preventions', async () => {
        const CATALOG_ID = 1058;
        const EXPECTED_PRICE = 10;
        const EXPECTED_CURRENCY = 2;
        const EXPECTED_SELLERID = 1;

        let axios = await account({
            verifiedEmail: true,
        });
        // grab csrf
        // (this should fail; it doesnt really matter)
        await axios.post('/economy/'+1+'/buy', {
            userInventoryId: 1,
            expectedSellerId: 1,
            expectedPrice: 1,
            expectedCurrency: 1,
        });
        // make 5 attempts at the same time
        let proms = await Promise.all([
            axios.post('/economy/'+CATALOG_ID+'/buy', {
                userInventoryId: 0,
                expectedSellerId: EXPECTED_SELLERID,
                expectedPrice: EXPECTED_PRICE,
                expectedCurrency: EXPECTED_CURRENCY,
            }),
            axios.post('/economy/'+CATALOG_ID+'/buy', {
                userInventoryId: 0,
                expectedSellerId: EXPECTED_SELLERID,
                expectedPrice: EXPECTED_PRICE,
                expectedCurrency: EXPECTED_CURRENCY,
            }),
            axios.post('/economy/'+CATALOG_ID+'/buy', {
                userInventoryId: 0,
                expectedSellerId: EXPECTED_SELLERID,
                expectedPrice: EXPECTED_PRICE,
                expectedCurrency: EXPECTED_CURRENCY,
            }),
        ]);
        let resp;
        let twoHundredResponseCount = 0;
        for (const item of proms) {
            if (item.status === 200) {
                resp = item;
                twoHundredResponseCount++;
            }else{
                assert.strictEqual(item.status, 409, 'response code should be 409 if it is not 200');
                assert.strictEqual(item.data.error.code, 'Cooldown', 'error code should be Cooldown');
            }
        }
        assert.strictEqual(twoHundredResponseCount, 1, '200 response count should be exactly 1');
        if (!resp) {
            throw new Error('There should be at least one valid response in race condition testing')
        }
        assert.strictEqual(resp.status, 200, 'Status Code should be OK for at least one purchase');
        // confirm exists in transactions
        let transactions = await axios.get('/economy/transactions?offset=0');
        assert.strictEqual(transactions.status, 200, 'transaction page status should be ok');
        assert.strictEqual(Array.isArray(transactions.data), true, 'transactions page should be array');
        assert.strictEqual(transactions.data.length, 2, 'transaciton history should only contain 2 items (daily stipend and recent transaction)')
        let latestTransasction = transactions.data[0];
        assert.notEqual(typeof latestTransasction, 'undefined', 'user should have at least one transaction');
        assert.strictEqual(latestTransasction.userId, EXPECTED_SELLERID, 'sellerid of catalog item should be the expected seller id');
        assert.strictEqual(latestTransasction.amount, -EXPECTED_PRICE, 'price should be the expected price');
        assert.strictEqual(latestTransasction.currency, EXPECTED_CURRENCY, 'currency should be the same as expected above');
        assert.strictEqual(latestTransasction.transactionType, 3, 'transaction type should be 3 (aka purchase of standard item)');
        assert.strictEqual(latestTransasction.catalogId, CATALOG_ID, 'catalog id in transaction should be same as purchased');
        assert.strictEqual(typeof latestTransasction.userInventoryId, 'number', 'transaction userInventoryId should be a number');
        // Now confirm exists in inventory\
        // grab userinfo
        let userinfo = await axios.get('/auth/current-user');
        assert.strictEqual(userinfo.status, 200, 'user info response should be ok');
        let userId = userinfo.data.userId;
        // confirm balance
        assert.strictEqual(userinfo.data.secondaryBalance, 0);
        assert.strictEqual(userinfo.data.primaryBalance, 0);
        // grab inventory
        let inv = await axios.get('/user/'+userId+'/inventory/collectibles?sort=desc&limit=100');
        assert.strictEqual(inv.status, 200, 'inventory status code should be 200');
        assert.strictEqual(Array.isArray(inv.data.items), true, 'inventory should be array');
        let firstItem = inv.data.items[0];
        assert.strictEqual(firstItem.catalogId, CATALOG_ID);
        assert.strictEqual(inv.data.items.length, 1, 'collectible inventory should only contain 1 item');
        // good
    }).timeout(5000);
    it('Should attempt to purchase a catalog item, but fail due to not having a verified email address', async () => {
        const CATALOG_ID = 1058;
        const EXPECTED_PRICE = 10;
        const EXPECTED_CURRENCY = 2;
        const EXPECTED_SELLERID = 1;

        let axios = await account();
        // make 5 attempts at the same time
        let resp = await axios.post('/economy/'+CATALOG_ID+'/buy', {
            userInventoryId: 0,
            expectedSellerId: EXPECTED_SELLERID,
            expectedPrice: EXPECTED_PRICE,
            expectedCurrency: EXPECTED_CURRENCY,
        })

        assert.strictEqual(resp.status, 409, 'Status Code should be 409 due to user not having verified email');
        assert.strictEqual(resp.data.error.code, 'ConstraintEmailVerificationRequired', 'Email verification required should be the error code');
        // confirm exists in transactions
        let transactions = await axios.get('/economy/transactions?offset=0');
        assert.strictEqual(transactions.status, 200, 'transaction page status should be ok');
        assert.strictEqual(Array.isArray(transactions.data), true, 'transactions page should be array');
        assert.strictEqual(transactions.data.length, 1, 'transaciton history should contain 1 item (daily stipend)')
        // Now confirm exists in inventory\
        // grab userinfo
        let userinfo = await axios.get('/auth/current-user');
        assert.strictEqual(userinfo.status, 200, 'user info response should be ok');
        let userId = userinfo.data.userId;
        // confirm balance
        assert.strictEqual(userinfo.data.secondaryBalance, 10);
        assert.strictEqual(userinfo.data.primaryBalance, 0);
        // grab inventory
        let inv = await axios.get('/user/'+userId+'/inventory/collectibles?sort=desc&limit=100');
        assert.strictEqual(inv.status, 200, 'inventory status code should be 200');
        assert.strictEqual(Array.isArray(inv.data.items), true, 'inventory should be array');
        assert.strictEqual(inv.data.items.length, 0, 'inventory should contain 0 items');
        // good
    }).timeout(5000);
});