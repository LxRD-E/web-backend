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
exports.encrypt = (text, key) => {
    const iv = '0'.repeat(32);
    const cipher = Crypto.createCipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([
        encrypted,
        cipher.final()
    ]);
    return encrypted.toString('hex');
};
exports.decrypt = (encryptedString, key) => {
    const iv = '0'.repeat(32);
    const decipher = Crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(Buffer.from(encryptedString, 'hex'));
    decrypted = Buffer.concat([
        decrypted,
        decipher.final(),
    ]);
    return decrypted.toString();
};

