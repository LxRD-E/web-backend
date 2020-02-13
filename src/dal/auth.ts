/**
 * Imports
 */
import bcrypt = require('bcrypt');
import * as Crypto from 'crypto';
import * as util from 'util';
import moment = require('moment');
import { Unauthorized, Conflict, Forbidden } from 'ts-httpexceptions';
import { Request, Response, Middleware, Req, Res } from '@tsed/common';
import speakeasy = require('speakeasy');
import qrcode = require('qrcode');
import jwt = require('jsonwebtoken');
import config from '../helpers/config';

// kinda useless but yolo
const randomBytes = util.promisify(Crypto.randomBytes);

import { SessionOfLoggedInUser } from '../models/v1/any';

/**
 * Interfaces
 */

/**
 * Hash a password using bcrypt
 * @param passwd Password String
 */
export const hashPassword = async (passwd: string, bcryptLib = bcrypt): Promise<string> => {
    const salt = await bcryptLib.genSalt(10);
    const hash = await bcryptLib.hash(passwd, salt);
    return hash;
};

/**
 * Verify a password string equals the hash provided
 * @param passwd Password String
 * @param hash Password Hash
 */
export const verifyPassword = async (passwd: string, hash: string, bcryptLib = bcrypt): Promise<boolean> => {
    const res = await bcryptLib.compare(passwd, hash);
    return res;
};

/**
 * Save a Session
 * @param req Request
 */
export const saveSession = (req: Request): Promise<void> => {
    return new Promise((resolve, reject): void => {
        if (!req.session) {
            reject();
        } else {
            req.session.save((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        }
    });
};

/**
 * Set a session to it's default empty class
 * @param req Request
 */
export const setSession = async (req: Request, randomBytesLib = randomBytes, saveSessionLib = saveSession): Promise<void> => {
    if (!req.session) {
        return;
    }
    const newCsrf = await randomBytesLib(16);
    const csrfString = newCsrf.toString('hex');
    req.session.userdata = {
        csrf: csrfString,
    };
    await saveSessionLib(req);
};

/**
 * Regenerate a csrf
 */
export const regenCsrf = async (req: Request, randomBytesLib = randomBytes, saveSessionLib = saveSession): Promise<boolean> => {
    if (!req.session) {
        return false;
    }
    if (!req.session.userdata) {
        await saveSessionLib(req);
        return true;
    }
    const newCsrf = await randomBytesLib(16);
    if (!newCsrf) {
        return false;
    }
    const csrfString = newCsrf.toString('hex');
    req.session.userdata.csrf = csrfString;
    req.session.userdata.csrfExpire = moment().add(5, "minutes");
    await saveSessionLib(req);
    return true;
};

/**
 * Validate a CSRF
 */
@Middleware()
export class csrf {
    public async use(@Req() req: Req, @Res() res: Res) {
         // If session does not exist aka is down, then ignore request
        if (!req.session) {
            throw new Forbidden("CSRFValidationFailed");
        }
        const valid = await validateCsrf(req);
        if (!valid) {
            res.set({'X-CSRF-Token': req.session.userdata.csrf});
            throw new Forbidden("CSRFValidationFailed");
        }else{
            return;
        }
    }
}

export const validateCsrf = async (req: Request, setSessionLib = setSession, regenCsrfLib = regenCsrf, cryptoLib = Crypto): Promise<boolean> => {
    if (!req.session) {
        return false;
    }
    if (!req.session.userdata) {
        await setSessionLib(req);
        return false;
    }
    const csrfAttachedToSession = req.session.userdata.csrf;
    const csrfExpire = req.session.userdata.csrfExpire;
    const csrfSent = req.headers['x-csrf-token'] as string;
    if (!csrfSent) {
        return false;
    }
    if (!csrfAttachedToSession || !csrfExpire) {
        await regenCsrfLib(req);
        return false;
    }
    if (moment().isSameOrAfter(csrfExpire)) {
        await regenCsrfLib(req);
        return false;
    }

    if (csrfSent.length !== 32) {
        // await regenCsrfLib(req);
        return false;
    }
    if (cryptoLib.timingSafeEqual(Buffer.from(csrfAttachedToSession, 'hex'), Buffer.from(csrfSent, 'hex'))) {
        return true;
    } else {
        return false;
    }
};


/**
 * Return the CSRF from a session
 * @param req Request
 */
export const getCsrf = async (req: Request, setSessionLib = setSession, regenCsrfLib = regenCsrf): Promise<boolean|string> => {
    if (!req.session) {
        return false;
    }
    if (!req.session.userdata) {
        await setSessionLib(req);
        return false;
    }
    if (req.session.userdata.csrf) {
        return req.session.userdata.csrf as string;
    } else {
        await regenCsrfLib(req);
        return false;
    }
};

/**
 * Check if a user is authenticated. Returns false if not, otherwise SessionUserData
 * @param req Request
 * @deprecated Use this.res.locals.userInfo instead
 */
export const isAuthenticated = async(req: Request): Promise<SessionOfLoggedInUser> => {
    if (!req.session) {
        throw false;
    }
    if (!req.session.userdata) {
        throw false;
    }
    if (req.session.userdata.id) {
        const sess = req.session.userdata as SessionOfLoggedInUser;
        return sess;
    }else{
        throw false;
    }
}
/**
 * Encrypt a string
 * @param text 
 * @param key 
 */
export const encrypt = (text: string, key: string): string => {
    const iv = '0'.repeat(32);
    const cipher = Crypto.createCipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([
        encrypted,
        cipher.final()
    ]);
    return encrypted.toString('hex');
}
/**
 * Decrypt a string
 * @param encryptedString 
 * @param key 
 */
export const decrypt = (encryptedString: string, key: string): string => {
    const iv = '0'.repeat(32);
    const decipher = Crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(Buffer.from(encryptedString, 'hex'));
    decrypted = Buffer.concat([
        decrypted,
        decipher.final(),
    ]);
    return decrypted.toString();
}

export const generateTOTPSecret = () => {
    return new Promise((res, rej) => {
        let secret = speakeasy.generateSecret({length: 32, name: 'Hindi Gamer Club'});
        qrcode.toDataURL(secret.otpauth_url, (err, text) => {
            if (err) {
                return rej(err);
            }
            res({
                qrCodeUrl: text,
                secret: {
                    base32: secret.base32,
                },
            });
        });
    });
}

export const validateTOTPSecret = async (secret: string, token: string) => {
    let result;
    try {
        result = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
        });
    }catch{
        throw new Error('Invalid Secret or Token Provided');
    }
    if (!result  || secret.length !== 52) {
        throw new Error('Invalid Secret or Token Provided');
    }
    return result;
}

export const generateTwoFactorJWT = (userId: number, expectedIp: string) => {
    if (!config.jwt || !config.jwt.twoFactor) {
        console.error('No jwt.twoFactor specified in config.json');
        process.exit(1);
    }
    let obj = {
        userId: userId,
        expectedIp: expectedIp,
    };
    return jwt.sign(obj, config.jwt.twoFactor);
}

export const decodeTwoFactorJWT = (code: string): {userId: number; expectedIp: string; iat: number} => {
    if (!config.jwt || !config.jwt.twoFactor) {
        console.error('No jwt.twoFactor specified in config.json');
        process.exit(1);
    }
    let val = jwt.verify(code, config.jwt.twoFactor);
    return val as any;
}