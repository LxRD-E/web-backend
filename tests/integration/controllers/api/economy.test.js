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
    it('Should attempt to purchase a still for-sale collectible catalog item 10 times at once, but only have one attempt succeed due to race condition preventions', async () => {
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
                assert.strictEqual(item.status, 409, 'error status should be 409');
                assert.strictEqual(item.data.error.code, 'AlreadyOwns', 'error code should inform user that they do not have enough currency (NotEnoughCurrency)');
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
    it('Should attempt to purchase a still for-sale collectible catalog item 3 times at once, but only have one attempt succeed due to race condition preventions', async () => {
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
                assert.strictEqual(item.data.error.code, 'AlreadyOwns', 'error code should inform user they already own the item');
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
    /*
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
    */
});

describe('POST /api/v1/economy/trades/{tradeId}', () => {
    it('Should allow user1 to buy a collectible item, user2 to buy a collectible item, user1 to send a trade to user2, and user2 should be able to accept the trade and own item', async () => {
        let userOne = await account({
            verifiedEmail: true,
        });
        let userTwo = await account({
            verifiedEmail: true,
        });

        const CATALOG_ID = 1058;
        const EXPECTED_PRICE = 10;
        const EXPECTED_CURRENCY = 2;
        const EXPECTED_SELLERID = 1;

        // buy user1's item
        let buyOne = await userOne.post('/economy/'+CATALOG_ID+'/buy', {
            userInventoryId: 0,
            expectedSellerId: EXPECTED_SELLERID,
            expectedPrice: EXPECTED_PRICE,
            expectedCurrency: EXPECTED_CURRENCY,
        });
        assert.strictEqual(buyOne.status, 200);
        // buy user2's item
        let buyTwo = await userTwo.post('/economy/'+CATALOG_ID+'/buy', {
            userInventoryId: 0,
            expectedSellerId: EXPECTED_SELLERID,
            expectedPrice: EXPECTED_PRICE,
            expectedCurrency: EXPECTED_CURRENCY,
        });
        assert.strictEqual(buyTwo.status, 200);

        // grab user1 info
        let userOneInfo = await userOne.get('/auth/current-user');
        let userOneId = userOneInfo.data.userId;
        // grab inventory of user1
        let userOneInv = await userOne.get('/user/'+userOneId+'/inventory/collectibles?sort=desc&limit=100');
        assert.strictEqual(userOneInv.status, 200);
        // grab userInventoryId of item
        let offerUserInventoryId = userOneInv.data.items[0]['userInventoryId'];
        // do same for user2
        let userTwoInfo = await userTwo.get('/auth/current-user');
        let userTwoId = userTwoInfo.data.userId;
        let userTwoInv = await userTwo.get('/user/'+userTwoId+'/inventory/collectibles?sort=desc&limit=100');
        assert.strictEqual(userTwoInv.status, 200);
        let requestUserInventoryId = userTwoInv.data.items[0]['userInventoryId'];

        // create trade
        let create = await userOne.put('/economy/trades/user/'+userTwoId+'/request', {
            offerItems: [
                offerUserInventoryId,
            ],
            requestedItems: [
                requestUserInventoryId,
            ],
            // no currency in trade ...
        });
        assert.strictEqual(create.status, 200);

        // user two grab trades
        let trades = await userTwo.get('/economy/trades/inbound');
        assert.strictEqual(trades.status, 200);
        let firstTradeId = trades.data[0]['tradeId'];
        // accept trade
        let accept = await userTwo.post('/economy/trades/'+firstTradeId, {});
        assert.strictEqual(accept.status, 200);

        let userOneNewInvenory = await userOne.get('/user/'+userOneId+'/inventory/collectibles?sort=desc&limit=100');
        assert.strictEqual(userOneNewInvenory.status, 200);
        assert.strictEqual(userOneNewInvenory.data.items[0]['userInventoryId'], requestUserInventoryId);

        let userTwoNewInventory = await userTwo.get('/user/'+userTwoId+'/inventory/collectibles?sort=desc&limit=100');
        assert.strictEqual(userTwoNewInventory.status, 200);
        assert.strictEqual(userTwoNewInventory.data.items[0]['userInventoryId'], offerUserInventoryId);
        // pass
    });
    it('Should allow user1 to buy a collectible item, user2 to buy a collectible item, user1 to send a trade to user2, and user2 should be able to accept the trade and own item and get 1000 offered currency (bringing user2 balance to 1500, user1 balance to 0)', async () => {
        const USER_ONE_OFFER_PRIMARY = 1000;
        const USER_TWO_START_PRIMARY = 500;
        const USER_ONE_START_PRIMARY = 1000;
        let userOne = await account({
            verifiedEmail: true,
            startPrimary: USER_ONE_START_PRIMARY,
        });
        
        let userTwo = await account({
            verifiedEmail: true,
            startPrimary: USER_TWO_START_PRIMARY,
        });

        const CATALOG_ID = 1058;
        const EXPECTED_PRICE = 10;
        const EXPECTED_CURRENCY = 2;
        const EXPECTED_SELLERID = 1;

        // buy user1's item
        let buyOne = await userOne.post('/economy/'+CATALOG_ID+'/buy', {
            userInventoryId: 0,
            expectedSellerId: EXPECTED_SELLERID,
            expectedPrice: EXPECTED_PRICE,
            expectedCurrency: EXPECTED_CURRENCY,
        });
        assert.strictEqual(buyOne.status, 200);
        // buy user2's item
        let buyTwo = await userTwo.post('/economy/'+CATALOG_ID+'/buy', {
            userInventoryId: 0,
            expectedSellerId: EXPECTED_SELLERID,
            expectedPrice: EXPECTED_PRICE,
            expectedCurrency: EXPECTED_CURRENCY,
        });
        assert.strictEqual(buyTwo.status, 200);

        // grab user1 info
        let userOneInfo = await userOne.get('/auth/current-user');
        let userOneId = userOneInfo.data.userId;
        // grab inventory of user1
        let userOneInv = await userOne.get('/user/'+userOneId+'/inventory/collectibles?sort=desc&limit=100');
        assert.strictEqual(userOneInv.status, 200);
        // grab userInventoryId of item
        let offerUserInventoryId = userOneInv.data.items[0]['userInventoryId'];
        // do same for user2
        let userTwoInfo = await userTwo.get('/auth/current-user');
        let userTwoId = userTwoInfo.data.userId;
        let userTwoInv = await userTwo.get('/user/'+userTwoId+'/inventory/collectibles?sort=desc&limit=100');
        assert.strictEqual(userTwoInv.status, 200);
        let requestUserInventoryId = userTwoInv.data.items[0]['userInventoryId'];



        // create trade
        let create = await userOne.put('/economy/trades/user/'+userTwoId+'/request', {
            offerItems: [
                offerUserInventoryId,
            ],
            requestedItems: [
                requestUserInventoryId,
            ],
            offerPrimary: USER_ONE_OFFER_PRIMARY,
            // no currency in trade ...
        });
        assert.strictEqual(create.status, 200);

        // user two grab trades
        let trades = await userTwo.get('/economy/trades/inbound');
        assert.strictEqual(trades.status, 200);
        let firstTradeId = trades.data[0]['tradeId'];
        // accept trade
        let accept = await userTwo.post('/economy/trades/'+firstTradeId, {});
        assert.strictEqual(accept.status, 200);

        let userOneNewInvenory = await userOne.get('/user/'+userOneId+'/inventory/collectibles?sort=desc&limit=100');
        assert.strictEqual(userOneNewInvenory.status, 200);
        assert.strictEqual(userOneNewInvenory.data.items[0]['userInventoryId'], requestUserInventoryId);

        let userTwoNewInventory = await userTwo.get('/user/'+userTwoId+'/inventory/collectibles?sort=desc&limit=100');
        assert.strictEqual(userTwoNewInventory.status, 200);
        assert.strictEqual(userTwoNewInventory.data.items[0]['userInventoryId'], offerUserInventoryId);
        // grab balance
        let userTwoBalance = await userTwo.get('/auth/current-user');
        assert.strictEqual(userTwoBalance.data.primaryBalance, USER_ONE_OFFER_PRIMARY + USER_TWO_START_PRIMARY, 'user2 should get offered currency added to balance');
        let userOneBalance = await userOne.get('/auth/current-user');
        assert.strictEqual(userOneBalance.data.primaryBalance, USER_ONE_START_PRIMARY - USER_ONE_OFFER_PRIMARY, 'user one balance should be start balance - offered primary');
        // pass
    });
    it('Should allow user1 to buy a collectible item, user2 to buy a collectible item, user1 to send a trade to user2, and user2 should try to accept the trade but fail due to user1 not having currency anymore', async () => {
        const USER_ONE_OFFER_PRIMARY = 1000;
        const USER_TWO_START_PRIMARY = 500;
        const USER_ONE_START_PRIMARY = 1000;
        let userOne = await account({
            verifiedEmail: true,
            startPrimary: USER_ONE_START_PRIMARY,
        });
        
        let userTwo = await account({
            verifiedEmail: true,
            startPrimary: USER_TWO_START_PRIMARY,
        });

        const CATALOG_ID = 1058;
        const EXPECTED_PRICE = 10;
        const EXPECTED_CURRENCY = 2;
        const EXPECTED_SELLERID = 1;

        // buy user1's item
        let buyOne = await userOne.post('/economy/'+CATALOG_ID+'/buy', {
            userInventoryId: 0,
            expectedSellerId: EXPECTED_SELLERID,
            expectedPrice: EXPECTED_PRICE,
            expectedCurrency: EXPECTED_CURRENCY,
        });
        assert.strictEqual(buyOne.status, 200);
        // buy user2's item
        let buyTwo = await userTwo.post('/economy/'+CATALOG_ID+'/buy', {
            userInventoryId: 0,
            expectedSellerId: EXPECTED_SELLERID,
            expectedPrice: EXPECTED_PRICE,
            expectedCurrency: EXPECTED_CURRENCY,
        });
        assert.strictEqual(buyTwo.status, 200);

        // grab user1 info
        let userOneInfo = await userOne.get('/auth/current-user');
        let userOneId = userOneInfo.data.userId;
        // grab inventory of user1
        let userOneInv = await userOne.get('/user/'+userOneId+'/inventory/collectibles?sort=desc&limit=100');
        assert.strictEqual(userOneInv.status, 200);
        // grab userInventoryId of item
        let offerUserInventoryId = userOneInv.data.items[0]['userInventoryId'];
        // do same for user2
        let userTwoInfo = await userTwo.get('/auth/current-user');
        let userTwoId = userTwoInfo.data.userId;
        let userTwoInv = await userTwo.get('/user/'+userTwoId+'/inventory/collectibles?sort=desc&limit=100');
        assert.strictEqual(userTwoInv.status, 200);
        let requestUserInventoryId = userTwoInv.data.items[0]['userInventoryId'];



        // create trade
        let create = await userOne.put('/economy/trades/user/'+userTwoId+'/request', {
            offerItems: [
                offerUserInventoryId,
            ],
            requestedItems: [
                requestUserInventoryId,
            ],
            offerPrimary: USER_ONE_OFFER_PRIMARY,
            // no currency in trade ...
        });
        assert.strictEqual(create.status, 200);

        // user one spend currency on conversion
        let currencyConversion = await userOne.put('/economy/currency/convert', {
            "currency": 1,
            "amount": 1
        });
        assert.strictEqual(currencyConversion.status, 200);
        // user two grab trades
        let trades = await userTwo.get('/economy/trades/inbound');
        assert.strictEqual(trades.status, 200);
        let firstTradeId = trades.data[0]['tradeId'];
        // accept trade
        let accept = await userTwo.post('/economy/trades/'+firstTradeId, {});
        assert.strictEqual(accept.status, 409);
        assert.strictEqual(accept.data.error.code, 'TradeCannotBeCompleted');
        // pass
    });
    it('Should allow user1 to buy a collectible item, user2 to buy a collectible item, user1 to send a trade to user2, and user2 should try to accept the trade but fail due to user2 not having enough currency in request', async () => {
        const USER_ONE_REQUEST_PRIMARY = 1000;
        const USER_TWO_START_PRIMARY = 500;
        const USER_ONE_START_PRIMARY = 1000;
        let userOne = await account({
            verifiedEmail: true,
            startPrimary: USER_ONE_START_PRIMARY,
        });
        
        let userTwo = await account({
            verifiedEmail: true,
            startPrimary: USER_TWO_START_PRIMARY,
        });

        const CATALOG_ID = 1058;
        const EXPECTED_PRICE = 10;
        const EXPECTED_CURRENCY = 2;
        const EXPECTED_SELLERID = 1;

        // buy user1's item
        let buyOne = await userOne.post('/economy/'+CATALOG_ID+'/buy', {
            userInventoryId: 0,
            expectedSellerId: EXPECTED_SELLERID,
            expectedPrice: EXPECTED_PRICE,
            expectedCurrency: EXPECTED_CURRENCY,
        });
        assert.strictEqual(buyOne.status, 200);
        // buy user2's item
        let buyTwo = await userTwo.post('/economy/'+CATALOG_ID+'/buy', {
            userInventoryId: 0,
            expectedSellerId: EXPECTED_SELLERID,
            expectedPrice: EXPECTED_PRICE,
            expectedCurrency: EXPECTED_CURRENCY,
        });
        assert.strictEqual(buyTwo.status, 200);

        // grab user1 info
        let userOneInfo = await userOne.get('/auth/current-user');
        let userOneId = userOneInfo.data.userId;
        // grab inventory of user1
        let userOneInv = await userOne.get('/user/'+userOneId+'/inventory/collectibles?sort=desc&limit=100');
        assert.strictEqual(userOneInv.status, 200);
        // grab userInventoryId of item
        let offerUserInventoryId = userOneInv.data.items[0]['userInventoryId'];
        // do same for user2
        let userTwoInfo = await userTwo.get('/auth/current-user');
        let userTwoId = userTwoInfo.data.userId;
        let userTwoInv = await userTwo.get('/user/'+userTwoId+'/inventory/collectibles?sort=desc&limit=100');
        assert.strictEqual(userTwoInv.status, 200);
        let requestUserInventoryId = userTwoInv.data.items[0]['userInventoryId'];



        // create trade
        let create = await userOne.put('/economy/trades/user/'+userTwoId+'/request', {
            offerItems: [
                offerUserInventoryId,
            ],
            requestedItems: [
                requestUserInventoryId,
            ],
            requestPrimary: USER_ONE_REQUEST_PRIMARY,
            // no currency in trade ...
        });
        assert.strictEqual(create.status, 200);

        // user two grab trades
        let trades = await userTwo.get('/economy/trades/inbound');
        assert.strictEqual(trades.status, 200);
        let firstTradeId = trades.data[0]['tradeId'];
        // accept trade
        let accept = await userTwo.post('/economy/trades/'+firstTradeId, {});
        assert.strictEqual(accept.status, 409);
        assert.strictEqual(accept.data.error.code, 'TradeCannotBeCompleted');
        // pass
    });
    it('Should allow user1 to buy a collectible item, user2 to buy a collectible item, user1 to send 4 trades to user2, and then user2 accept all 4 at once but only have one go through due to race condition prevention', async () => {
        let userOne = await account({
            verifiedEmail: true,
        });
        let userTwo = await account({
            verifiedEmail: true,
        });

        const CATALOG_ID = 1058;
        const EXPECTED_PRICE = 10;
        const EXPECTED_CURRENCY = 2;
        const EXPECTED_SELLERID = 1;

        // buy user1's item
        let buyOne = await userOne.post('/economy/'+CATALOG_ID+'/buy', {
            userInventoryId: 0,
            expectedSellerId: EXPECTED_SELLERID,
            expectedPrice: EXPECTED_PRICE,
            expectedCurrency: EXPECTED_CURRENCY,
        });
        assert.strictEqual(buyOne.status, 200);
        // buy user2's item
        let buyTwo = await userTwo.post('/economy/'+CATALOG_ID+'/buy', {
            userInventoryId: 0,
            expectedSellerId: EXPECTED_SELLERID,
            expectedPrice: EXPECTED_PRICE,
            expectedCurrency: EXPECTED_CURRENCY,
        });
        assert.strictEqual(buyTwo.status, 200);

        // grab user1 info
        let userOneInfo = await userOne.get('/auth/current-user');
        let userOneId = userOneInfo.data.userId;
        // grab inventory of user1
        let userOneInv = await userOne.get('/user/'+userOneId+'/inventory/collectibles?sort=desc&limit=100');
        assert.strictEqual(userOneInv.status, 200);
        // grab userInventoryId of item
        let offerUserInventoryId = userOneInv.data.items[0]['userInventoryId'];
        // do same for user2
        let userTwoInfo = await userTwo.get('/auth/current-user');
        let userTwoId = userTwoInfo.data.userId;
        let userTwoInv = await userTwo.get('/user/'+userTwoId+'/inventory/collectibles?sort=desc&limit=100');
        assert.strictEqual(userTwoInv.status, 200);
        let requestUserInventoryId = userTwoInv.data.items[0]['userInventoryId'];

        // create trades
        let create = await userOne.put('/economy/trades/user/'+userTwoId+'/request', {
            offerItems: [
                offerUserInventoryId,
            ],
            requestedItems: [
                requestUserInventoryId,
            ],
            // no currency in trade ...
        });
        assert.strictEqual(create.status, 200);
        // create trades
        let createTwo = await userOne.put('/economy/trades/user/'+userTwoId+'/request', {
            offerItems: [
                offerUserInventoryId,
            ],
            requestedItems: [
                requestUserInventoryId,
            ],
            // no currency in trade ...
        });
        assert.strictEqual(createTwo.status, 200);
        // create trades
        let createThree = await userOne.put('/economy/trades/user/'+userTwoId+'/request', {
            offerItems: [
                offerUserInventoryId,
            ],
            requestedItems: [
                requestUserInventoryId,
            ],
            // no currency in trade ...
        });
        assert.strictEqual(createThree.status, 200);
        // create trades
        let createFour = await userOne.put('/economy/trades/user/'+userTwoId+'/request', {
            offerItems: [
                offerUserInventoryId,
            ],
            requestedItems: [
                requestUserInventoryId,
            ],
            // no currency in trade ...
        });
        assert.strictEqual(createFour.status, 200);

        // user two grab trades
        let trades = await userTwo.get('/economy/trades/inbound');
        assert.strictEqual(trades.status, 200);
        let promises = [];
        for (const item of trades.data) {
            promises.push((async () => {
                /**
                 * @type {any}
                 */
                let data = await userTwo.post('/economy/trades/'+item.tradeId, {});
                data.tradeId = item.tradeId;
                return data;
            })())
        }
        let results = await Promise.all(promises);
        let okRespones = 0;
        let acceptedTradeId = 0;
        for (const item of results) {
            if (item.status === 200) {
                acceptedTradeId = item.tradeId;
                okRespones++;
            }else{
                assert.strictEqual(item.status, 409, '409 error with code OneOrMoreItemsNotAvailable should be returned');
                assert.strictEqual(item.data.error.code, 'OneOrMoreItemsNotAvailable', 'error code: OneOrMoreItemsNotAvailable should be returned');
            }
        }
        assert.strictEqual(okRespones, 1, 'only one trade should go through');

        let userOneNewInvenory = await userOne.get('/user/'+userOneId+'/inventory/collectibles?sort=desc&limit=100');
        assert.strictEqual(userOneNewInvenory.status, 200);
        assert.strictEqual(userOneNewInvenory.data.items[0]['userInventoryId'], requestUserInventoryId);
        assert.strictEqual(userOneNewInvenory.data.items.length, 1, 'user one should have one item');

        let userTwoNewInventory = await userTwo.get('/user/'+userTwoId+'/inventory/collectibles?sort=desc&limit=100');
        assert.strictEqual(userTwoNewInventory.status, 200);
        assert.strictEqual(userTwoNewInventory.data.items[0]['userInventoryId'], offerUserInventoryId);
        assert.strictEqual(userTwoNewInventory.data.items.length, 1, 'user two should have one item');
        // pass
    });
});