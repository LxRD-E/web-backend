import { Request, Response, NextFunction } from 'express';
import Axios from 'axios';
import config from '../helpers/config';
import * as redis from '../helpers/ioredis';

export type Strictness = 0 | 1 | 2 | 3;

export const IpMaxScores = {
    'Signup': 50,
}

export const IpStrictness: { [key: string]: Strictness } = {
    'Signup': 2,
}

interface IQualityScoreOptions {
    /**
     * Defaults to IpMinScores.Signup
     */
    maxScore?: number;
    /**
     * Defaults to 1
     */
    strictness?: Strictness;
    /**
     * Allow public places, such as coffee shops or schools. Defaults to true
     */
    allowPublicAccessPoints?: boolean;
    /**
     * Reduce scoring penalties for mixed qualityy IP addresses shared by good and bad users. Defaults to false
     */
    lignerPenalties?: boolean;
    /**
     * Disable 24 hour cache. Defaults to false
     */
    disableCache?: boolean;
}

interface IQualityScoreResponse {
    success: boolean;
    message: 'Success' | string;
    fraud_score: number;
    country_code: string;
    region: string;
    city: string;
    ISP: string;
    ASN: number;
    operating_system: string;
    browser: string;
    organization: string;
    latitude: string;
    longitude: string;
    is_crawler: boolean;
    timezone: string;
    mobile: boolean;
    host: string;
    proxy: boolean;
    vpn: boolean;
    tor: boolean;
    active_vpn: boolean;
    active_tor: boolean;
    device_brand: string;
    device_model: string;
    recent_abuse: boolean;
    bot_status: boolean;
    connection_type: string;
    abuse_velocity: string;
    request_id: string;
}

import StaffDal from '../dal/staff';
const staff = new StaffDal();

/**
 * Check if an IP is ok
 * @param options See IQualityScoreOptions
 */
export const check = (options?: IQualityScoreOptions) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
                options.maxScore = IpMaxScores.Signup;
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
            }
            let result: IQualityScoreResponse | undefined;
            let redisKey = 'ip_quality_score_' + ip;
            if (!options.disableCache) {
                let attempt = await redis.get().get(redisKey);
                if (typeof attempt === 'string') {
                    try {
                        result = JSON.parse(attempt);
                    } catch (e) {
                        // Error
                    }
                }
            }
            if (typeof result === 'undefined') {
                let apiKey = config.ipQualityScore.apiKey;
                let str = '';
                for (const key of Object.getOwnPropertyNames(params)) {
                    // @ts-ignore
                    let val = params[key];
                    str += encodeURIComponent(key) + '=' + encodeURIComponent(val) + '&';
                }
                str = str.slice(0, str.length - 1);
                let url = `https://www.ipqualityscore.com/api/json/ip/${apiKey}/${ip}?${str}`;
                let response = await Axios.get(url);
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
                    })
                } else {
                    next();
                }
            } else {
                next(new Error('IPQuality Score Response was undefined.'));
            }
        } catch (e) {
            next(e);
        }
    }
}