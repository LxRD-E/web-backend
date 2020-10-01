"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = require("axios");
const config_1 = require("../helpers/config");
const redis = require("../helpers/ioredis");
exports.IpMaxScores = {
    'Signup': 50,
};
exports.IpStrictness = {
    'Signup': 2,
};
const staff_1 = require("../dal/staff");
const staff = new staff_1.default();
exports.check = (options) => {
    return async (req, res, next) => {
        try {
            if (process.env.NODE_ENV === 'development' || process.env.IS_STAGING === '1') {
                return next();
            }
            let isWhitelisted = await staff.getIfIpWhitelisted(req.ip);
            if (isWhitelisted) {
                return next();
            }
            if (!options) {
                options = {};
            }
            if (typeof options.maxScore === 'undefined') {
                options.maxScore = exports.IpMaxScores.Signup;
            }
            if (typeof options.strictness === 'undefined') {
                options.strictness = 1;
            }
            if (typeof options.allowPublicAccessPoints === 'undefined') {
                options.allowPublicAccessPoints = true;
            }
            if (typeof options.lignerPenalties === 'undefined') {
                options.lignerPenalties = false;
            }
            if (typeof options.disableCache === 'undefined') {
                options.disableCache = false;
            }
            let ua = req.headers['user-agent'];
            let al = req.headers['accept-language'];
            let ip = req.ip;
            let params = {
                'user_agent': ua,
                'user_language': al,
                'strictness': options.strictness,
                'allow_public_access_points': options.allowPublicAccessPoints,
                'lighter_penalties': options.lignerPenalties,
            };
            let result;
            let redisKey = 'ip_quality_score_' + ip;
            if (!options.disableCache) {
                let attempt = await redis.get().get(redisKey);
                if (typeof attempt === 'string') {
                    try {
                        result = JSON.parse(attempt);
                    }
                    catch (e) {
                    }
                }
            }
            if (typeof result === 'undefined') {
                let apiKey = config_1.default.ipQualityScore.apiKey;
                let str = '';
                for (const key of Object.getOwnPropertyNames(params)) {
                    let val = params[key];
                    str += encodeURIComponent(key) + '=' + encodeURIComponent(val) + '&';
                }
                str = str.slice(0, str.length - 1);
                let url = `https://www.ipqualityscore.com/api/json/ip/${apiKey}/${ip}?${str}`;
                let response = await axios_1.default.get(url);
                result = response.data;
                await redis.get().setex(redisKey, 86400, JSON.stringify(result));
            }
            if (result) {
                let status = result.fraud_score;
                if (status > options.maxScore) {
                    res.status(409).json({
                        success: false,
                        error: {
                            code: 'RequestDisallowed',
                        }
                    });
                }
                else {
                    next();
                }
            }
            else {
                next(new Error('IPQuality Score Response was undefined.'));
            }
        }
        catch (e) {
            next(e);
        }
    };
};

