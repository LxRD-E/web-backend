"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_httpexceptions_1 = require("ts-httpexceptions");
const axios_1 = require("axios");
const config_1 = require("../helpers/config");
const privateKeyV3 = config_1.default.recaptcha.v3.private;
const privateKeyV2 = config_1.default.recaptcha.v2.private;
exports.verifyTokenV2 = async (token, ip) => {
    if (process.env.NODE_ENV === 'development') {
        return;
    }
    if (!token) {
        throw new ts_httpexceptions_1.BadRequest('InvalidCaptchaToken');
    }
    let check;
    try {
        check = await axios_1.default.post('https://www.google.com/recaptcha/api/siteverify', 'secret=' + privateKeyV2 + '&response=' + token + '&remoteip=' + ip, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            }
        });
    }
    catch (e) {
        console.log(e);
        throw new ts_httpexceptions_1.BadRequest('InvalidCaptchaToken');
    }
    if (check.data.success) {
        console.log('v2 check success');
        return;
    }
    else {
        console.log('v2 check failed');
        throw new ts_httpexceptions_1.BadRequest('InvalidCaptchaToken');
    }
};
exports.RecaptchaV2 = async (req, res, next) => {
    let token = req.body.v2Token;
    if (!token) {
        return res.status(409).json({
            success: false,
            error: {
                code: 'InvalidCaptchaToken',
            }
        });
    }
    let check;
    try {
        check = await axios_1.default.post('https://www.google.com/recaptcha/api/siteverify', 'secret=' + privateKeyV2 + '&response=' + token + '&remoteip=' + req.ip, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            }
        });
    }
    catch (e) {
        console.log(e);
        return res.status(409).json({
            success: false,
            error: {
                code: 'InvalidCaptchaToken',
            }
        });
    }
    if (check.data.success) {
        console.log('v2 check success');
        return next();
    }
    else {
        console.log('v2 check failed');
        return res.status(409).json({
            success: false,
            error: {
                code: 'InvalidCaptchaToken',
            }
        });
    }
};
exports.RecaptchaV3 = (expectedMode, strictLevel = 1) => {
    return async (req, res, next) => {
        if (process.env.NODE_ENV === 'development') {
            console.log('skip recaptcha v3 check since dev_env');
            return next();
        }
        let token = req.body.token;
        if (!token) {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'InvalidCaptchaToken',
                }
            });
        }
        let check;
        try {
            check = await axios_1.default.post('https://www.google.com/recaptcha/api/siteverify', 'secret=' + privateKeyV3 + '&response=' + token + '&remoteip=' + req.ip, {
                headers: {
                    'content-type': 'application/x-www-form-urlencoded'
                }
            });
        }
        catch (e) {
            console.log(e);
            return res.status(409).json({
                success: false,
                error: {
                    code: 'InvalidCaptchaToken',
                }
            });
        }
        console.log(check.data);
        if (check.data.action !== expectedMode) {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'InvalidCaptchaToken',
                }
            });
        }
        if (check.data.score <= 0.25) {
            if (!req.body.v2Token) {
                return res.status(409).json({
                    success: false,
                    error: {
                        code: 'CaptchaRequired',
                    }
                });
            }
            await exports.RecaptchaV2(req, res, next);
            return;
        }
        if (check.data.success) {
            return next();
        }
        else {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'InvalidCaptchaToken',
                }
            });
        }
    };
};

