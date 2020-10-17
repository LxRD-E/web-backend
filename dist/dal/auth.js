"use strict";
/* istanbul ignore next */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
/* istanbul ignore next */
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
/* istanbul ignore next */
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
/* istanbul ignore next */
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/* istanbul ignore next */
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt = require("bcrypt");
const moment = require("moment");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const jwt = require("jsonwebtoken");
const cheerio = require("cheerio");
const Crypto = require("crypto");
const util = require("util");
const axios_1 = require("axios");
const ts_httpexceptions_1 = require("ts-httpexceptions");
const common_1 = require("@tsed/common");
const config_1 = require("../helpers/config");
const redis = require("../helpers/ioredis");
const imageResizer = require("../services/image-resize");
const randomBytes = util.promisify(Crypto.randomBytes);
exports.hashPassword = async (passwd, bcryptLib = bcrypt) => {
    const salt = await bcryptLib.genSalt(10);
    return await bcryptLib.hash(passwd, salt);
};
exports.verifyPassword = async (passwd, hash, bcryptLib = bcrypt) => {
    return await bcryptLib.compare(passwd, hash);
};
exports.saveSession = (req) => {
    return new Promise((resolve, reject) => {
        if (!req.session) {
            reject();
        }
        else {
            req.session.save((err) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        }
    });
};
exports.setSession = async (req, randomBytesLib = randomBytes, saveSessionLib = exports.saveSession) => {
    if (!req.session) {
        return;
    }
    const newCsrf = await randomBytesLib(16);
    const csrfString = newCsrf.toString('hex');
    req.session.userdata = {
        csrf: csrfString,
    };
    await saveSessionLib(req);
};
exports.regenCsrf = async (req, randomBytesLib = randomBytes, saveSessionLib = exports.saveSession) => {
    if (!req.session) {
        return false;
    }
    if (!req.session.userdata) {
        await saveSessionLib(req);
        return true;
    }
    const newCsrf = await randomBytesLib(16);
    if (!newCsrf) {
        return false;
    }
    const csrfString = newCsrf.toString('hex');
    req.session.userdata.csrf = csrfString;
    req.session.userdata.csrfExpire = moment().add(5, "minutes");
    await saveSessionLib(req);
    return true;
};
let csrf = class csrf {
    async use(req, res) {
        if (!req.session) {
            throw new ts_httpexceptions_1.Forbidden("CSRFValidationFailed");
        }
        const valid = await exports.validateCsrf(req);
        if (!valid) {
            res.set({ 'x-csrf-token': req.session.userdata.csrf });
            throw new ts_httpexceptions_1.Forbidden("CSRFValidationFailed");
        }
        else {
            return;
        }
    }
};
__decorate([
    __param(0, common_1.Req()), __param(1, common_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], csrf.prototype, "use", null);
csrf = __decorate([
    common_1.Middleware()
], csrf);
exports.csrf = csrf;
exports.validateCsrf = async (req, setSessionLib = exports.setSession, regenCsrfLib = exports.regenCsrf, cryptoLib = Crypto) => {
    if (!req.session) {
        return false;
    }
    if (!req.session.userdata) {
        await setSessionLib(req);
        return false;
    }
    const csrfAttachedToSession = req.session.userdata.csrf;
    const csrfExpire = req.session.userdata.csrfExpire;
    const csrfSent = req.headers['x-csrf-token'];
    if (!csrfSent) {
        return false;
    }
    if (!csrfAttachedToSession || !csrfExpire) {
        await regenCsrfLib(req);
        return false;
    }
    if (moment().isSameOrAfter(csrfExpire)) {
        await regenCsrfLib(req);
        return false;
    }
    if (csrfSent.length !== 32) {
        return false;
    }
    if (cryptoLib.timingSafeEqual(Buffer.from(csrfAttachedToSession, 'hex'), Buffer.from(csrfSent, 'hex'))) {
        return true;
    }
    else {
        return false;
    }
};
exports.getCsrf = async (req, setSessionLib = exports.setSession, regenCsrfLib = exports.regenCsrf) => {
    if (!req.session) {
        return false;
    }
    if (!req.session.userdata) {
        await setSessionLib(req);
        return false;
    }
    if (req.session.userdata.csrf) {
        return req.session.userdata.csrf;
    }
    else {
        await regenCsrfLib(req);
        return false;
    }
};
exports.isAuthenticated = async (req) => {
    if (!req.session) {
        throw false;
    }
    if (!req.session.userdata) {
        throw false;
    }
    if (req.session.userdata.id) {
        return req.session.userdata;
    }
    else {
        throw false;
    }
};
exports.encrypt = (text, key, iv) => {
    if (!iv) {
        console.warn('[warning] no iv specified for auth.encrypt(), using default of NULL');
        iv = Buffer.from('0'.repeat(32), 'hex');
    }
    const cipher = Crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([
        encrypted,
        cipher.final()
    ]);
    return encrypted.toString('hex');
};
exports.decrypt = (encryptedString, key, iv) => {
    if (typeof iv !== 'string' && typeof iv !== 'object') {
        iv = Buffer.from('0'.repeat(32), 'hex');
    }
    const decipher = Crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(Buffer.from(encryptedString, 'hex'));
    decrypted = Buffer.concat([
        decrypted,
        decipher.final(),
    ]);
    return decrypted.toString();
};
exports.encryptPasswordHash = (passwordHash) => {
    const PASSWORD_ENCRYPTION_KEY = config_1.default.encryptionKeys.password;
    let ivForPassword = Crypto.randomBytes(16);
    let result = exports.encrypt(passwordHash, PASSWORD_ENCRYPTION_KEY, ivForPassword);
    return JSON.stringify([
        result,
        ivForPassword.toString('hex'),
    ]);
};
exports.decryptPasswordHash = (passwordHash) => {
    const PASSWORD_ENCRYPTION_KEY = config_1.default.encryptionKeys.password;
    let decoded = JSON.parse(passwordHash);
    let passString = decoded[0];
    let passIv = Buffer.from(decoded[1], 'hex');
    return exports.decrypt(passString, PASSWORD_ENCRYPTION_KEY, passIv);
};
exports.getCachedTotpResults = async (userId) => {
    let result = await redis.get().get('cached_totp_results_' + userId.toString());
    if (result) {
        return result;
    }
    throw new Error('No code generated');
};
exports.setCachedTotpResults = async (userId, val) => {
    await redis.get().setex('cached_totp_results_' + userId.toString(), 2500, val);
};
exports.generateTOTPSecret = () => {
    return new Promise((res, rej) => {
        let secret = speakeasy.generateSecret({ length: 32, name: 'BlocksHub' });
        qrcode.toDataURL(secret.otpauth_url, (err, text) => {
            if (err) {
                return rej(err);
            }
            let object = {
                qrCodeUrl: text,
                secret: {
                    base32: secret.base32,
                },
            };
            if (process.env.NODE_ENV === 'development') {
                object.secret = secret;
            }
            res(object);
        });
    });
};
exports.validateTOTPSecret = async (secret, token) => {
    let result;
    try {
        result = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
        });
    }
    catch {
        throw new Error('Invalid Secret or Token Provided');
    }
    if (!result || secret.length !== 52) {
        throw new Error('Invalid Secret or Token Provided');
    }
    return result;
};
exports.generateTwoFactorJWT = (userId, expectedIp) => {
    if (!config_1.default.jwt || !config_1.default.jwt.twoFactor) {
        console.error('No jwt.twoFactor specified in config.json');
        process.exit(1);
    }
    let obj = {
        userId: userId,
        expectedIp: expectedIp,
    };
    return jwt.sign(obj, config_1.default.jwt.twoFactor);
};
exports.decodeTwoFactorJWT = (code) => {
    if (!config_1.default.jwt || !config_1.default.jwt.twoFactor) {
        console.error('No jwt.twoFactor specified in config.json');
        process.exit(1);
    }
    let val = jwt.verify(code, config_1.default.jwt.twoFactor);
    return val;
};
exports.generateAuthServiceJWT = async (userId, username) => {
    if (!config_1.default.jwt || !config_1.default.jwt.authenticationService) {
        console.error('No jwt.authenticationService specified in config.json');
        process.exit(1);
    }
    let obj = {
        userId: userId,
        username: username,
    };
    return jwt.sign(obj, config_1.default.jwt.authenticationService);
};
exports.decodeAuthServiceJWT = (code) => {
    if (!config_1.default.jwt || !config_1.default.jwt.authenticationService) {
        console.error('No jwt.authenticationService specified in config.json');
        process.exit(1);
    }
    let val = jwt.verify(code, config_1.default.jwt.authenticationService);
    return val;
};
exports.generateGameServerCode = async (userId, username) => {
    if (!config_1.default.jwt || !config_1.default.jwt.gameServerAuthentication) {
        console.error('No jwt.gameAuthentication specified in config.json');
        process.exit(1);
    }
    let obj = {
        userId: userId,
        username: username,
        isServerAuthorization: true,
    };
    return jwt.sign(obj, config_1.default.jwt.gameServerAuthentication);
};
exports.decodeGameServerAuthCode = (code) => {
    if (!config_1.default.jwt || !config_1.default.jwt.gameServerAuthentication) {
        console.error('No jwt.gameAuthentication specified in config.json');
        process.exit(1);
    }
    let val = jwt.verify(code, config_1.default.jwt.gameServerAuthentication);
    if (!val.isServerAuthorization) {
        throw new Error('This token is not an auth code.');
    }
    return val;
};
exports.generateGameAuthCode = async (userId, username) => {
    if (!config_1.default.jwt || !config_1.default.jwt.gameAuthentication) {
        console.error('No jwt.gameAuthentication specified in config.json');
        process.exit(1);
    }
    let obj = {
        userId: userId,
        username: username,
        isAuthCode: true,
    };
    return jwt.sign(obj, config_1.default.jwt.gameAuthentication);
};
exports.decodeGameAuthCode = (code) => {
    if (!config_1.default.jwt || !config_1.default.jwt.gameAuthentication) {
        console.error('No jwt.gameAuthentication specified in config.json');
        process.exit(1);
    }
    let val = jwt.verify(code, config_1.default.jwt.gameAuthentication);
    if (!val.isAuthCode) {
        throw new Error('This token is not an auth code.');
    }
    return val;
};
exports.decodeImageProxyQuery = (imageProxyUrl) => {
    if (!config_1.default.jwt || !config_1.default.jwt.imageProxy) {
        console.error('No jwt.imageProxy specified in config.json');
        process.exit(1);
    }
    let data = jwt.verify(imageProxyUrl, config_1.default.jwt.imageProxy);
    if (moment().isSameOrAfter(moment(data.iat * 1000).add(48, 'hours'))) {
        throw new Error('Request has expired');
    }
    return data['url'];
};
exports.fetchImageAndResize = async (imageUrl) => {
    let image = await axios_1.default.get(imageUrl, { responseType: 'arraybuffer' });
    return await imageResizer.async.resizeImage(image.data, image.headers['content-type']);
};
const convertResponseBodyToOgInfo = (body) => {
    let thumbnailUrl = null;
    let desc = null;
    let title = null;
    const $ = cheerio.load(body);
    let thumb = $('meta[property="og:image"]').first().attr('content');
    if (thumb) {
        thumbnailUrl = thumb;
    }
    else {
        let twitterThumbnail = $('meta[name="twitter:image"]').first().attr('content');
        if (twitterThumbnail) {
            thumbnailUrl = twitterThumbnail;
        }
    }
    if (thumbnailUrl && thumbnailUrl.length > 255) {
        thumbnailUrl = null;
    }
    let ogDesc = $('meta[propety="og:description"]').first().attr('content');
    if (ogDesc) {
        desc = ogDesc;
    }
    else {
        let twitterDesc = $('meta[name="twitter:description"]').first().attr('content');
        if (twitterDesc) {
            desc = twitterDesc;
        }
    }
    if (desc && desc.length > 255) {
        desc = desc.slice(0, 255 - '...'.length) + '...';
    }
    let ogTitle = $('meta[name="og:title"]').first().attr('content');
    if (ogTitle) {
        title = ogTitle;
    }
    else {
        let twitterTitle = $('meta[name="twitter:title"]').first().attr('content');
        if (twitterTitle) {
            title = twitterTitle;
        }
        else {
            let generalTitle = $('title').first().html();
            if (generalTitle) {
                title = generalTitle;
            }
        }
    }
    if (title && title.length > 64) {
        title = title.slice(0, 64 - '...'.length) + '...';
    }
    if (thumbnailUrl) {
        if (thumbnailUrl.slice(0, 'https://'.length).toLowerCase() === 'https://') {
            let imageUrlWithProxy = jwt.sign({ url: thumbnailUrl }, config_1.default.jwt.imageProxy);
            thumbnailUrl = '/api/v1/feed/preview-proxy?url=' + encodeURIComponent(imageUrlWithProxy);
        }
        else {
            thumbnailUrl = null;
        }
    }
    else {
        thumbnailUrl = null;
    }
    return {
        thumbnailUrl: thumbnailUrl,
        description: desc,
        title: title,
    };
};
const getOgTagsForUrl = async (originalUrl, statusId) => {
    let url = originalUrl;
    let responseData = '';
    const redisKey = 'og_info_url_v1_' + url;
    const cachedResult = await redis.get().get(redisKey);
    if (cachedResult) {
        const response = JSON.parse(cachedResult);
        response.statusId = statusId;
        response.url = originalUrl;
        return response;
    }
    else {
        let request = await axios_1.default.get(url, {
            maxRedirects: 2,
            headers: {
                'user-agent': 'blockshub.net bot v1.0.0'
            },
            maxContentLength: 2000000,
            validateStatus: (status) => {
                return true;
            },
        });
        if (typeof request.data === 'string') {
            responseData = request.data;
        }
    }
    const result = {
        url: url,
        statusId: statusId,
        ogInfo: convertResponseBodyToOgInfo(responseData),
    };
    await redis.get().setex(redisKey, 86400, JSON.stringify(result));
    return result;
};
exports.multiGetOgTagsForYoutubeLinks = async (data) => {
    if (data.length === 0) {
        return [];
    }
    let responseData = [];
    for (const item of data) {
        if (!item.urls) {
            continue;
        }
        item.urls = [...new Set(item.urls)];
        for (const url of item.urls) {
            responseData.push(getOgTagsForUrl(url, item.statusId));
        }
    }
    return await Promise.all(responseData);
};
exports.verifyEmail = (newEmail) => {
    const validate = (email) => {
        const expression = /(?!.*\.{2})^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
        return expression.test(String(email).toLowerCase());
    };
    if (!validate(newEmail)) {
        return false;
    }
    let stuffBeforeAtSign = newEmail.slice(0, newEmail.indexOf('@'));
    let domain = newEmail.slice(newEmail.indexOf('@') + 1).toLowerCase();
    let emailDomainWithoutSuffix = domain.slice(0, domain.indexOf('.'));
    if (emailDomainWithoutSuffix === 'gmail' || emailDomainWithoutSuffix === 'googlemail') {
        stuffBeforeAtSign = stuffBeforeAtSign.replace(/\./g, '');
        if (stuffBeforeAtSign.indexOf('+') !== -1) {
            stuffBeforeAtSign = stuffBeforeAtSign.slice(0, stuffBeforeAtSign.indexOf('+'));
        }
        newEmail = stuffBeforeAtSign + '@gmail.com';
    }
    newEmail = newEmail.toLowerCase();
    return newEmail;
};

