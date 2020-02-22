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
const Crypto = require("crypto");
const util = require("util");
const moment = require("moment");
const ts_httpexceptions_1 = require("ts-httpexceptions");
const common_1 = require("@tsed/common");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const jwt = require("jsonwebtoken");
const config_1 = require("../helpers/config");
const randomBytes = util.promisify(Crypto.randomBytes);
exports.hashPassword = async (passwd, bcryptLib = bcrypt) => {
    const salt = await bcryptLib.genSalt(10);
    const hash = await bcryptLib.hash(passwd, salt);
    return hash;
};
exports.verifyPassword = async (passwd, hash, bcryptLib = bcrypt) => {
    const res = await bcryptLib.compare(passwd, hash);
    return res;
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
            res.set({ 'X-CSRF-Token': req.session.userdata.csrf });
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
        const sess = req.session.userdata;
        return sess;
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
        console.warn('[warning] no iv specified for auth.decrypt(), using default of NULL');
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
    let response = JSON.stringify([
        result,
        ivForPassword.toString('hex'),
    ]);
    return response;
};
exports.decryptPasswordHash = (passwordHash) => {
    const PASSWORD_ENCRYPTION_KEY = config_1.default.encryptionKeys.password;
    let decoded = JSON.parse(passwordHash);
    let passString = decoded[0];
    let passIv = Buffer.from(decoded[1], 'hex');
    let result = exports.decrypt(passString, PASSWORD_ENCRYPTION_KEY, passIv);
    return result;
};
exports.generateTOTPSecret = () => {
    return new Promise((res, rej) => {
        let secret = speakeasy.generateSecret({ length: 32, name: 'Hindi Gamer Club' });
        qrcode.toDataURL(secret.otpauth_url, (err, text) => {
            if (err) {
                return rej(err);
            }
            res({
                qrCodeUrl: text,
                secret: {
                    base32: secret.base32,
                },
            });
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

