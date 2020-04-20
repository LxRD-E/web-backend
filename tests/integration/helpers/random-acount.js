const getAxios = require('./axios');
const assert = require('assert');
const crypto = require('crypto');
const CAPTCHA_RESPONSE = `captcha-bypass-integration-testing`;
const normalAxios = require('axios').default;
/**
 * Create a random account, and return an axios instance
 * with the session attached.
 * @param {{verifiedEmail?: boolean startPrimary?: number startSecondary?: number}} options
 */
module.exports = async (options = undefined) => {
    const usernameToUse = crypto.randomBytes(8).toString('hex');
    const passwordToUse = `$e3ur3pa$$w0rd`;
    const birthDay = 1;
    const birthMonth = 12;
    const birthYear = 2000;
    
    let extraHeaders = {};
    if (options) {
        if (options.verifiedEmail) {
            extraHeaders['x-verified-email'] = crypto.randomBytes(8).toString('hex')+'@gmail.com';
        }
        if (options.startPrimary) {
            extraHeaders['x-start-primary'] = options.startPrimary;
        }
        if (options.startSecondary) {
            extraHeaders['x-start-secondary'] = options.startSecondary;
        }
    }
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
    }, {
        headers: extraHeaders,
    });
    assert.strictEqual(typeof signupResponse.data.username, 'string');
    assert.strictEqual(signupResponse.data.username, usernameToUse);
    assert.strictEqual(typeof signupResponse.data.userId, 'number');
    return axios;
}