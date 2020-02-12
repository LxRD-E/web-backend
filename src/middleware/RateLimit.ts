import { Request, Response } from "@tsed/common";
import { NextFunction } from "express";
import { ErrorTemplate } from '../helpers/HttpError';
const redis = require('redis');
const { RateLimiterRedis } = require('rate-limiter-flexible');
import config from '../helpers/config';
const redisClient = redis.createClient({
    host: config.redis.host || '127.0.0.1',
    port: config.redis.port || 3306,
    password: config.redis.pass || '',
    enable_offline_queue: false,
});

const rateLimiter = new RateLimiterRedis({
    redis: redisClient,
    keyPrefix: 'middleware',
    points: 60, // 60 requests
    duration: 60, // per 1 second by IP
    inmemoryBlockOnConsumed: 100,
    inmemoryBlockDuration: 60,
});

export const RateLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
    let head = req.headers['x-ratelimit-bypass'];
    if (head !== undefined) {
        if (head === config['bypass-ratelimit'] && config['bypass-ratelimit'] !== '') {
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
            }
            res.set(headers);
            next();
        })
        .catch((rateLimiterRes) => {
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
                "X-RateLimit-Limit": rateLimiter.points,
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
                res.json({ "success": false, "message": "You have been making too many requests. Please try again in a minute.", error:{id: "TooManyRequests"} });
            }
        });
};