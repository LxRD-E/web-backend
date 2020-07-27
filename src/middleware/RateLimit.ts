import { Request, Response } from "@tsed/common";
import { NextFunction } from "express";
import { ErrorTemplate } from '../helpers/HttpError';
import redis = require('redis');
import { RateLimiterRedis } from 'rate-limiter-flexible';
import config from '../helpers/config';
let redisClient: redis.RedisClient;
if (process.env.NODE_ENV !== 'test') {
    redisClient = redis.createClient({
        host: config.redis.host || '127.0.0.1',
        port: config.redis.port || 6379,
        password: config.redis.pass || '',
        enable_offline_queue: false,
    });
}
/*
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'middleware',
    points: 60, // 60 requests
    duration: 60, // per 1 second by IP
    inmemoryBlockOnConsumed: 100,
    inmemoryBlockDuration: 60,
});
*/
const rateLimitTypeConfigs = {
    'default': {
        // redis: redisClient,
        keyPrefix: 'default_',
        points: 500, // 60 requests
        duration: 60, // per 1 minute by IP
        inmemoryBlockOnConsumed: 500,
        inmemoryBlockDuration: 60,
        // @ts-ignore
        storeClient: redisClient,
    },
    'loginAttempt': {
        // redis: redisClient,
        keyPrefix: 'loginattempt_',
        points: 25, // 25 requests
        duration: 3600, // per 1 hour by IP
        inmemoryBlockOnConsumed: 25,
        inmemoryBlockDuration: 3600,
        // @ts-ignore
        storeClient: redisClient,
    },
    'twoFactorEnableOrDisable': {
        // redis: redisClient,
        keyPrefix: 'twofactorenable_',
        points: 25, // 25 requests
        duration: 3600, // per 1 hour by IP
        inmemoryBlockOnConsumed: 25,
        inmemoryBlockDuration: 3600,
        // @ts-ignore
        storeClient: redisClient,
    },
    'sendFriendRequest': {
        // redis: redisClient,
        keyPrefix: 'sendfriendrequest_',
        points: 25, // 25 requests
        duration: 3600, // per 1 hour by IP
        inmemoryBlockOnConsumed: 25,
        inmemoryBlockDuration: 3600,
        // @ts-ignore
        storeClient: redisClient,
    },
    'passwordResetAttempt': {
        // redis: redisClient,
        keyPrefix: 'passwordResetAttempt',
        points: 5, // 25 requests
        duration: 3600, // per 1 hour by IP
        inmemoryBlockOnConsumed: 25,
        inmemoryBlockDuration: 3600,
        // @ts-ignore
        storeClient: redisClient,
    },
    'webFrontendRateLimit': {
        // redis: redisClient,
        keyPrefix: 'webFrontend',
        points: 1000, // 1000 requests
        duration: 60, // per 1 minute by IP
        inmemoryBlockOnConsumed: 1100,
        inmemoryBlockDuration: 15,
        // @ts-ignore
        storeClient: redisClient,
    },
}
let rateLimitTypes: any;
if (process.env.NODE_ENV !== 'test') {
    rateLimitTypes = {
        'default': new RateLimiterRedis(rateLimitTypeConfigs.default),
        'loginAttempt': new RateLimiterRedis(rateLimitTypeConfigs.loginAttempt),
        'twoFactorEnableOrDisable': new RateLimiterRedis(rateLimitTypeConfigs.twoFactorEnableOrDisable),
        'sendFriendRequest': new RateLimiterRedis(rateLimitTypeConfigs.sendFriendRequest),
        'passwordResetAttempt': new RateLimiterRedis(rateLimitTypeConfigs.passwordResetAttempt),
        'webFrontendRateLimit': new RateLimiterRedis(rateLimitTypeConfigs.webFrontendRateLimit),
    }
}

export const RateLimiterMiddleware = (typeOfRateLimit: 'default'|'loginAttempt'|'twoFactorEnableOrDisable'|'sendFriendRequest'|'passwordResetAttempt' = 'default') => {
    return (req: Request, res: Response, next: NextFunction) => {
        let ip = req.headers['cf-connecting-ip'] as string || req.connection.remoteAddress;
        let head = req.headers['x-ratelimit-bypass'] as string;
        if (head !== undefined && process.env.NODE_ENV === 'development' || typeof head !== 'undefined' && process.env.IS_STAGING === '1') {
            ip = head;
        }

        let rateLimiter = rateLimitTypes[typeOfRateLimit];
        let isWebServer = req.headers['backend-authorization'];
        if (isWebServer === config.backendAuthorization) {
            rateLimiter = rateLimitTypes['webFrontendRateLimit'];
        }
        rateLimiter.consume(ip)
            .then((rateLimiterRes: { remainingPoints: number; msBeforeNext: number; }) => {
                const headers = {
                    "X-RateLimit-Limit": rateLimitTypeConfigs[typeOfRateLimit]['points'],
                    "X-RateLimit-Remaining": rateLimiterRes.remainingPoints,
                    "X-RateLimit-Reset": Math.round(new Date(Date.now() + rateLimiterRes.msBeforeNext).getTime() / 1000),
                }
                res.set(headers);
                next();
            })
            .catch((rateLimiterRes: any) => {
                // If internal/redis error
                if (!rateLimiterRes || !rateLimiterRes.msBeforeNext) {
                    console.log(rateLimiterRes);
                    res.status(500);
                    // Give 500
                    if (req.accepts('html')) {
                        res.send(ErrorTemplate('Internal Server Error', 'An internal server error has occured. Please try again later.')).end();
                    }else{
                        res.json({ "success": false, "message": "Internal server error", error:{code: 'InternalServerError'} });
                    }
                    return;
                }
                // Not internal issue, so a rate limit. Give error...
                // Setup Ratelimit headers
                const headers = {
                    "Retry-After": Math.round(rateLimiterRes.msBeforeNext / 1000),
                    "X-RateLimit-Limit": rateLimitTypeConfigs[typeOfRateLimit]['points'],
                    "X-RateLimit-Remaining": rateLimiterRes.remainingPoints,
                    "X-RateLimit-Reset": Math.round(new Date(Date.now() + rateLimiterRes.msBeforeNext).getTime() / 1000),
                }
                // Set headers
                res.set(headers);
                // Set error code
                res.status(429);
                // If accepts html
                if (req.accepts('html')) {
                    // Send html response
                    res.send(ErrorTemplate('Error 429: Too Many Requests!','You or your browser have been making too many requests! Please wait a few minutes, and then try again.')).end();
                }else{
                    // Send json
                    res.json({ "success": false, error:{ code: "TooManyRequests"} });
                }
            });
    };
};