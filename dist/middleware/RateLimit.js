"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const HttpError_1 = require("../helpers/HttpError");
const redis = require("redis");
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const config_1 = require("../helpers/config");
let redisClient;
if (process.env.NODE_ENV !== 'test') {
    redisClient = redis.createClient({
        host: config_1.default.redis.host || '127.0.0.1',
        port: config_1.default.redis.port || 6379,
        password: config_1.default.redis.pass || '',
        enable_offline_queue: false,
    });
}
const rateLimitTypeConfigs = {
    'default': {
        keyPrefix: 'default_',
        points: 500,
        duration: 60,
        inmemoryBlockOnConsumed: 500,
        inmemoryBlockDuration: 60,
        storeClient: redisClient,
    },
    'loginAttempt': {
        keyPrefix: 'loginattempt_',
        points: 25,
        duration: 3600,
        inmemoryBlockOnConsumed: 25,
        inmemoryBlockDuration: 3600,
        storeClient: redisClient,
    },
    'twoFactorEnableOrDisable': {
        keyPrefix: 'twofactorenable_',
        points: 25,
        duration: 3600,
        inmemoryBlockOnConsumed: 25,
        inmemoryBlockDuration: 3600,
        storeClient: redisClient,
    },
    'sendFriendRequest': {
        keyPrefix: 'sendfriendrequest_',
        points: 25,
        duration: 3600,
        inmemoryBlockOnConsumed: 25,
        inmemoryBlockDuration: 3600,
        storeClient: redisClient,
    },
    'passwordResetAttempt': {
        keyPrefix: 'passwordResetAttempt',
        points: 5,
        duration: 3600,
        inmemoryBlockOnConsumed: 25,
        inmemoryBlockDuration: 3600,
        storeClient: redisClient,
    },
    'webFrontendRateLimit': {
        keyPrefix: 'webFrontend',
        points: 1000,
        duration: 60,
        inmemoryBlockOnConsumed: 1100,
        inmemoryBlockDuration: 15,
        storeClient: redisClient,
    },
};
let rateLimitTypes;
if (process.env.NODE_ENV !== 'test') {
    rateLimitTypes = {
        'default': new rate_limiter_flexible_1.RateLimiterRedis(rateLimitTypeConfigs.default),
        'loginAttempt': new rate_limiter_flexible_1.RateLimiterRedis(rateLimitTypeConfigs.loginAttempt),
        'twoFactorEnableOrDisable': new rate_limiter_flexible_1.RateLimiterRedis(rateLimitTypeConfigs.twoFactorEnableOrDisable),
        'sendFriendRequest': new rate_limiter_flexible_1.RateLimiterRedis(rateLimitTypeConfigs.sendFriendRequest),
        'passwordResetAttempt': new rate_limiter_flexible_1.RateLimiterRedis(rateLimitTypeConfigs.passwordResetAttempt),
        'webFrontendRateLimit': new rate_limiter_flexible_1.RateLimiterRedis(rateLimitTypeConfigs.webFrontendRateLimit),
    };
}
exports.RateLimiterMiddleware = (typeOfRateLimit = 'default') => {
    return (req, res, next) => {
        let ip = req.headers['cf-connecting-ip'] || req.connection.remoteAddress;
        let head = req.headers['x-ratelimit-bypass'];
        if (head !== undefined && process.env.NODE_ENV === 'development' || typeof head !== 'undefined' && process.env.IS_STAGING === '1') {
            ip = head;
        }
        let rateLimiter = rateLimitTypes[typeOfRateLimit];
        let isWebServer = req.headers['backend-authorization'];
        if (isWebServer === config_1.default.backendAuthorization) {
            rateLimiter = rateLimitTypes['webFrontendRateLimit'];
        }
        rateLimiter.consume(ip)
            .then((rateLimiterRes) => {
            const headers = {
                "X-RateLimit-Limit": rateLimitTypeConfigs[typeOfRateLimit]['points'],
                "X-RateLimit-Remaining": rateLimiterRes.remainingPoints,
                "X-RateLimit-Reset": Math.round(new Date(Date.now() + rateLimiterRes.msBeforeNext).getTime() / 1000),
            };
            res.set(headers);
            next();
        })
            .catch((rateLimiterRes) => {
            if (!rateLimiterRes || !rateLimiterRes.msBeforeNext) {
                console.log(rateLimiterRes);
                res.status(500);
                if (req.accepts('html')) {
                    res.send(HttpError_1.ErrorTemplate('Internal Server Error', 'An internal server error has occured. Please try again later.')).end();
                }
                else {
                    res.json({ "success": false, "message": "Internal server error", error: { code: 'InternalServerError' } });
                }
                return;
            }
            const headers = {
                "Retry-After": Math.round(rateLimiterRes.msBeforeNext / 1000),
                "X-RateLimit-Limit": rateLimitTypeConfigs[typeOfRateLimit]['points'],
                "X-RateLimit-Remaining": rateLimiterRes.remainingPoints,
                "X-RateLimit-Reset": Math.round(new Date(Date.now() + rateLimiterRes.msBeforeNext).getTime() / 1000),
            };
            res.set(headers);
            res.status(429);
            if (req.accepts('html')) {
                res.send(HttpError_1.ErrorTemplate('Error 429: Too Many Requests!', 'You or your browser have been making too many requests! Please wait a few minutes, and then try again.')).end();
            }
            else {
                res.json({ "success": false, error: { code: "TooManyRequests" } });
            }
        });
    };
};

