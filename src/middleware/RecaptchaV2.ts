import { Request, Response, NextFunction } from 'express';
import https = require('https');
import config from '../helpers/config';

interface RecaptchSuccess {
    success: boolean;
}
const error = {
    data: {
        error: {
            code: 'CaptchaValidationFailed',
        }
    },
    status: 409,
} as any;

/**
 * Verify a V2 google recaptcha response middleware
 */
export default (req: Request, res: Response, next: NextFunction): void => {
    const response = req.body.captcha || req.body.v2Token;
    console.log('resp', response);
    if (process.env.NODE_ENV === 'development' || process.env.IS_STAGING === '1') {
        return next();
    }
    if (!response) {
        res.status(409).json(error.data);
        return;
    }
    const json = {
        secret: config.recaptcha.v2.private,
        response: response,
    }
    const options = {
        hostname: 'www.google.com',
        port: 443,
        path: '/recaptcha/api/siteverify?secret=' + json.secret + "&response=" + json.response,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': 0
        }
    };
    let dataString = "";
    const request = https.request(options, (resp) => {
        resp.on('data', (d) => {
            dataString += d;
        });
        resp.on('close', () => {
            const json = JSON.parse(dataString) as RecaptchSuccess;
            if (json.success) {
                next();
            } else {
                return res.status(409).json(error.data);
            }
        });
        resp.on('error', () => {
            return res.status(409).json(error.data);
        })
    });
    request.end();
}