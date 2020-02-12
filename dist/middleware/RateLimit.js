"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const HttpError_1 = require("../helpers/HttpError");
const redis = require('redis');
const { RateLimiterRedis } = require('rate-limiter-flexible');
const config_1 = require("../helpers/config");
const redisClient = redis.createClient({
    host: config_1.default.redis.host,
    port: config_1.default.redis.port,
    password: config_1.default.redis.password,
    enable_offline_queue: false,
});
const rateLimiter = new RateLimiterRedis({
    redis: redisClient,
    keyPrefix: 'middleware',
    points: 60,
    duration: 60,
    inmemoryBlockOnConsumed: 100,
    inmemoryBlockDuration: 60,
});
exports.RateLimiterMiddleware = (req, res, next) => {
    let head = req.headers['x-ratelimit-bypass'];
    if (head !== undefined) {
        if (head === config_1.default['bypass-ratelimit'] && config_1.default['bypass-ratelimit'] !== '') {
            return next();
        }
    }
    let ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    rateLimiter.consume(ip)
        .then((rateLimiterRes) => {
        const headers = {
            "X-RateLimit-Limit": rateLimiter.points,
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
            "X-RateLimit-Limit": rateLimiter.points,
            "X-RateLimit-Remaining": rateLimiterRes.remainingPoints,
            "X-RateLimit-Reset": Math.round(new Date(Date.now() + rateLimiterRes.msBeforeNext).getTime() / 1000),
        };
        res.set(headers);
        res.status(429);
        if (req.accepts('html')) {
            res.send(HttpError_1.ErrorTemplate('Error 429: Too Many Requests!', 'You or your browser have been making too many requests! Please wait a few minutes, and then try again.')).end();
        }
        else {
            res.json({ "success": false, "message": "You have been making too many requests. Please try again in a minute.", error: { id: "TooManyRequests" } });
        }
    });
};

