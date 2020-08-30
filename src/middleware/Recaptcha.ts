import { EndpointInfo, IMiddleware, Middleware, Req } from "@tsed/common";
import { NotAcceptable } from "ts-httpexceptions";
import { Request, Response, Res, Next } from "@tsed/common";
import { BadRequest } from 'ts-httpexceptions';
import { NextFunction } from "express";
import axios, { AxiosResponse } from 'axios';

import config from '../helpers/config';
const privateKeyV3 = config.recaptcha.v3.private;
const privateKeyV2 = config.recaptcha.v2.private;

export const verifyTokenV2 = async (token: string, ip?: string) => {
    if (process.env.NODE_ENV === 'development') {
        return;
    }
    if (!token) {
        throw new BadRequest('InvalidCaptchaToken');
    }
    let check: AxiosResponse<{
        success: boolean;
        challenge_ts: string;
        hostname: string;
        'error-codes'?: any[];
    }>;
    try {
        check = await axios.post('https://www.google.com/recaptcha/api/siteverify', 'secret=' + privateKeyV2 + '&response=' + token + '&remoteip=' + ip, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            }
        });
    } catch (e) {
        console.log(e);
        throw new BadRequest('InvalidCaptchaToken');
    }
    if (check.data.success) {
        console.log('v2 check success');
        return;
    } else {
        console.log('v2 check failed');
        throw new BadRequest('InvalidCaptchaToken');
    }
}

export const RecaptchaV2 = async (req: Request, res: Response, next: NextFunction) => {
    let token = req.body.v2Token;
    if (!token) {
        return res.status(409).json({
            success: false,
            error: {
                code: 'InvalidCaptchaToken',
            }
        });
    }
    let check: AxiosResponse<{
        success: boolean;
        challenge_ts: string;
        hostname: string;
        'error-codes'?: any[];
    }>;
    try {
        check = await axios.post('https://www.google.com/recaptcha/api/siteverify', 'secret=' + privateKeyV2 + '&response=' + token + '&remoteip=' + req.ip, {
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            }
        });
    } catch (e) {
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
    } else {
        console.log('v2 check failed');
        return res.status(409).json({
            success: false,
            error: {
                code: 'InvalidCaptchaToken',
            }
        });
    }
}
export const RecaptchaV3 = (expectedMode: string, strictLevel = 1) => {
    return async (req: Request, res: Response, next: NextFunction) => {
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
        let check: AxiosResponse<{
            success: boolean;
            score: number;
            action: string;
            challenge_ts: string;
            hostname: string;
            'error-codes'?: any[];
        }>;
        try {
            check = await axios.post('https://www.google.com/recaptcha/api/siteverify', 'secret=' + privateKeyV3 + '&response=' + token + '&remoteip=' + req.ip, {
                headers: {
                    'content-type': 'application/x-www-form-urlencoded'
                }
            });
        } catch (e) {
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
            await RecaptchaV2(req, res, next);
            return;
        }
        if (check.data.success) {
            return next();
        } else {
            return res.status(409).json({
                success: false,
                error: {
                    code: 'InvalidCaptchaToken',
                }
            });
        }
    };
}
