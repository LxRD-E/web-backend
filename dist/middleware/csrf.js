"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@tsed/common");
const ts_httpexceptions_1 = require("ts-httpexceptions");
const config_1 = require("../helpers/config");
const jwt = require("jsonwebtoken");
const decodeJwt = (str) => {
    return new Promise((resolve, reject) => {
        jwt.verify(str, config_1.default.jwt.csrf, (err, cursor) => {
            if (err) {
                return reject(err);
            }
            resolve(cursor);
        });
    });
};
const createJwt = (object) => {
    return new Promise((resolve, reject) => {
        jwt.sign(object, config_1.default.jwt.csrf, {
            algorithm: 'HS512',
        }, (err, encoded) => {
            if (err) {
                return reject(err);
            }
            resolve(encoded);
        });
    });
};
const createCsrfSession = async () => {
    const tokenString = await createJwt({
        'csrf': require('crypto').randomBytes(32).toString('base64'),
    });
    return tokenString;
};
const csrfFailed = async (req, res) => {
    let cookie = req.cookies['rblxcsrf'];
    let valid = false;
    let cookieObject;
    try {
        cookieObject = await decodeJwt(cookie);
        valid = true;
        if (cookieObject.iat + 300 <= Math.floor(Date.now() / 1000)) {
            console.log('expired');
            valid = false;
        }
    }
    catch (e) {
        console.log('invalid cookie');
        valid = false;
    }
    let csrf = "";
    if (!cookie || !valid) {
        const session = await createCsrfSession();
        res.cookie('rblxcsrf', session, {
            httpOnly: true,
            samesite: 'lax',
            expires: new Date(Date.now() + 86400 * 30 * 12 * 1000),
        });
        let jsonObj;
        try {
            jsonObj = await decodeJwt(session);
        }
        catch (e) {
            console.log(e);
        }
        csrf = jsonObj.csrf;
    }
    else {
        csrf = cookieObject.csrf;
    }
    res.set({
        'x-csrf-token': csrf,
        'Access-Control-Expose-Headers': 'x-csrf-token'
    });
    throw new ts_httpexceptions_1.Forbidden('CsrfValidationFailed');
};
let CSRFValidate = class CSRFValidate {
    async use(req, res, endpoint) {
        console.log('begin csrf check');
        const csrf = req.get("x-csrf-token");
        if (!csrf) {
            console.log('not csrf');
            await csrfFailed(req, res);
        }
        let sess;
        try {
            sess = await decodeJwt(req.cookies['rblxcsrf']);
        }
        catch (e) {
            console.log(e);
            await csrfFailed(req, res);
        }
        if (sess.iat + 300 <= Math.floor(Date.now() / 1000)) {
            console.log('expired');
            csrfFailed(req, res);
        }
        console.log(sess.csrf);
        console.log(csrf);
        if (sess.csrf !== csrf) {
            await csrfFailed(req, res);
        }
        console.log('csrf check pass');
    }
};
__decorate([
    __param(0, common_1.Req()), __param(1, common_1.Res()), __param(2, common_1.EndpointInfo()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], CSRFValidate.prototype, "use", null);
CSRFValidate = __decorate([
    common_1.Middleware()
], CSRFValidate);
exports.default = CSRFValidate;
//# sourceMappingURL=csrf.js.map