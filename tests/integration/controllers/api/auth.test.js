const assert = require('assert');
const crypto = require('crypto');
const CAPTCHA_RESPONSE = `captcha-bypass-integration-testing`;
const getAxios = require('../../helpers/axios');
const TOTP = require('chai-totp');

describe('/api/v1/auth/signup', () => {
    it('Should register a new account, retrieve valid session', async () => {
        const usernameToUse = crypto.randomBytes(8).toString('hex');
        const passwordToUse = `$e3ur3pa$$w0rd`;
        const birthDay = 1;
        const birthMonth = 12;
        const birthYear = 2000;
        
        let axios = getAxios();
        let signupResponse = await axios.post('auth/signup', {
            "username": usernameToUse,
            "password": passwordToUse,
            "birth": [
                birthDay,
                birthMonth,
                birthYear
            ],
            "captcha": CAPTCHA_RESPONSE,
        });
        assert.strictEqual(typeof signupResponse.data.username, 'string');
        assert.strictEqual(signupResponse.data.username, usernameToUse);
        assert.strictEqual(typeof signupResponse.data.userId, 'number');
        // uhh probably ok, so try to make request only authenticated user can make
        let modHistory = await axios.get('/auth/moderation/history');
        assert.strictEqual(modHistory.status, 200);
        assert.strictEqual(Array.isArray(modHistory.data), true);
        // test OK
    }).timeout(5000);
});

describe('/api/v1/auth/login', () => {
    it('Should generate a new account, then succesfully login to it', async () => {
        const usernameToUse = crypto.randomBytes(8).toString('hex');
        const passwordToUse = `$e3ur3pa$$w0rd`;
        const birthDay = 1;
        const birthMonth = 12;
        const birthYear = 2000;
        
        let signupResponse = await getAxios().post('/auth/signup', {
            "username": usernameToUse,
            "password": passwordToUse,
            "birth": [
                birthDay,
                birthMonth,
                birthYear
            ],
            "captcha": CAPTCHA_RESPONSE,
        });
        // make sure it worked
        assert.strictEqual(typeof signupResponse.data.userId, 'number');
        // now try to signin
        let newAxios = getAxios();
        let loginResponse = await newAxios.post('/auth/login', {
            username: usernameToUse,
            password: passwordToUse,
        });
        assert.strictEqual(typeof loginResponse.data.userId, 'number');
        assert.strictEqual(typeof loginResponse.data.username, 'string');
        assert.strictEqual(typeof loginResponse.data.twoFactor, 'undefined');
        assert.strictEqual(typeof loginResponse.data.isTwoFactorRequired, 'boolean');
        assert.strictEqual(loginResponse.data.isTwoFactorRequired, false);
        // confirm login worked
        let modHistory = await newAxios.get('/auth/moderation/history');
        assert.strictEqual(modHistory.status, 200);
        assert.strictEqual(Array.isArray(modHistory.data), true);
    });
    it('Should generate a new account, then get a 400 InvalidUsernameOrPassword error', async () => {
        const usernameToUse = crypto.randomBytes(8).toString('hex');
        const passwordToUse = `$e3ur3pa$$w0rd`;
        const birthDay = 1;
        const birthMonth = 12;
        const birthYear = 2000;
        
        let signupResponse = await getAxios().post('/auth/signup', {
            "username": usernameToUse,
            "password": passwordToUse,
            "birth": [
                birthDay,
                birthMonth,
                birthYear
            ],
            "captcha": CAPTCHA_RESPONSE,
        });
        // make sure it worked
        assert.strictEqual(typeof signupResponse.data.userId, 'number');
        // now try to signin
        let newAxios = getAxios();
        let loginResponse = await newAxios.post('/auth/login', {
            username: usernameToUse,
            password: passwordToUse+'_invalid',
        });
        assert.strictEqual(loginResponse.status, 400, 'Status Code should be 409');
        assert.strictEqual(typeof loginResponse.data.error, 'object', 'Error data should be object');
        assert.strictEqual(typeof loginResponse.data.error.code, 'string', 'Error code should be string');
        assert.strictEqual(loginResponse.data.error.code, 'InvalidUsernameOrPassword', 'Error code should be invalid username/password');
        // confirm login DID NOT work
        let modHistory = await newAxios.get('/auth/moderation/history');
        assert.strictEqual(modHistory.status, 401, 'Modhistory should return 401');
        assert.strictEqual(Array.isArray(modHistory.data), false, 'Modhistory data must not be an array');
    });
    it('Should generate a new account, enable 2 factor, then login', async () => {
        const usernameToUse = crypto.randomBytes(8).toString('hex');
        const passwordToUse = `$e3ur3pa$$w0rd`;
        const birthDay = 1;
        const birthMonth = 12;
        const birthYear = 2000;
        
        let signupAxios = getAxios();
        let signupResponse = await signupAxios.post('/auth/signup', {
            "username": usernameToUse,
            "password": passwordToUse,
            "birth": [
                birthDay,
                birthMonth,
                birthYear
            ],
            "captcha": CAPTCHA_RESPONSE,
        });
        // make sure it worked
        assert.strictEqual(typeof signupResponse.data.userId, 'number');
        // generate 2fa
        let enableTwoFactor = await signupAxios.post('/auth/generate-totp-secret', {});
        let secret = enableTwoFactor.data.secret;
        // grab token
        const totp2 = new TOTP(secret.base32);
        let token = totp2.genOTP()
        // enable 2fa
        let twoFactorEnableResp = await signupAxios.patch('/auth/totp', {
            "secret": secret.base32,
            "token": token,
            "password": passwordToUse,
        });
        assert.strictEqual(twoFactorEnableResp.status, 200, 'TOTP response should be OK');
        // now try to signin
        let newAxios = getAxios();
        let loginResponse = await newAxios.post('/auth/login', {
            username: usernameToUse,
            password: passwordToUse,
        });
        assert.strictEqual(loginResponse.status, 200, 'Response should be 200');
        assert.strictEqual(typeof loginResponse.data.userId, 'number', 'userId should be in response body');
        assert.strictEqual(loginResponse.data.isTwoFactorRequired, true, 'Twofactor should be required');
        assert.strictEqual(typeof loginResponse.data.twoFactor, 'string');
        let twoFactorJwt = loginResponse.data.twoFactor;
        // confirm login DID NOT work
        let modHistory = await newAxios.get('/auth/moderation/history');
        assert.strictEqual(modHistory.status, 401, 'Modhistory should return 401');
        assert.strictEqual(Array.isArray(modHistory.data), false, 'Modhistory data not be an array');
        // Now, try to login with 2fa data
        let newToken = totp2.genOTP();
        let newLoginRequest = await newAxios.post('/auth/login/two-factor', {
            'code': twoFactorJwt,
            'token': newToken,
        });
        assert.strictEqual(newLoginRequest.status, 200, 'Response should be OK');
        assert.strictEqual(typeof newLoginRequest.data.userId, 'number', 'Response should contain userId as number');
        assert.strictEqual(newLoginRequest.data.userId, signupResponse.data.userId, 'Response should contain userId that is the same as the one from signup');
        // confirm login DID work
        let modHistoryTwo = await newAxios.get('/auth/moderation/history');
        assert.strictEqual(modHistoryTwo.status, 200, 'Modhistory should return 200');
        assert.strictEqual(Array.isArray(modHistoryTwo.data), true, 'Modhistory data be an array');
    });
    it('Should generate a new account, enable 2 factor, then fail logging in due to invalid totp code', async () => {
        const usernameToUse = crypto.randomBytes(8).toString('hex');
        const passwordToUse = `$e3ur3pa$$w0rd`;
        const birthDay = 1;
        const birthMonth = 12;
        const birthYear = 2000;
        
        let signupAxios = getAxios();
        let signupResponse = await signupAxios.post('/auth/signup', {
            "username": usernameToUse,
            "password": passwordToUse,
            "birth": [
                birthDay,
                birthMonth,
                birthYear
            ],
            "captcha": CAPTCHA_RESPONSE,
        });
        // make sure it worked
        assert.strictEqual(typeof signupResponse.data.userId, 'number');
        // generate 2fa
        let enableTwoFactor = await signupAxios.post('/auth/generate-totp-secret', {});
        let secret = enableTwoFactor.data.secret;
        // grab token
        const totp2 = new TOTP(secret.base32);
        let token = totp2.genOTP()
        // enable 2fa
        let twoFactorEnableResp = await signupAxios.patch('/auth/totp', {
            "secret": secret.base32,
            "token": token,
            "password": passwordToUse,
        });
        assert.strictEqual(twoFactorEnableResp.status, 200, 'TOTP response should be OK');
        // now try to signin
        let newAxios = getAxios();
        let loginResponse = await newAxios.post('/auth/login', {
            username: usernameToUse,
            password: passwordToUse,
        });
        assert.strictEqual(loginResponse.status, 200, 'Response should be 200');
        assert.strictEqual(typeof loginResponse.data.userId, 'number', 'userId should be in response body');
        assert.strictEqual(loginResponse.data.isTwoFactorRequired, true, 'Twofactor should be required');
        assert.strictEqual(typeof loginResponse.data.twoFactor, 'string');
        let twoFactorJwt = loginResponse.data.twoFactor;
        let fakeToken = '581968';
        if (totp2.genOTP() === fakeToken) {
            fakeToken = '018601';
        }
        // Now, try to login with 2fa data
        let newLoginRequest = await newAxios.post('/auth/login/two-factor', {
            'code': twoFactorJwt,
            'token': fakeToken,
        });
        assert.strictEqual(newLoginRequest.status, 400, 'Response should be BAD');
        assert.strictEqual(typeof newLoginRequest.data.userId, 'undefined', 'Response should NOT contain userId as number');
        assert.strictEqual(typeof newLoginRequest.data.error, 'object', 'Response must contain error object');
        assert.strictEqual(newLoginRequest.data.error.code, 'InvalidTwoFactorCode', 'Response correct error code (InvalidTwoFactorCode)');
        // confirm login DID NOT work
        let modHistory = await newAxios.get('/auth/moderation/history');
        assert.strictEqual(modHistory.status, 401, 'Modhistory should return 401');
        assert.strictEqual(Array.isArray(modHistory.data), false, 'Modhistory data not be an array');
    });
});