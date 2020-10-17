/**
 * Imports
 */
import bcrypt = require('bcrypt');
import moment = require('moment');
import speakeasy = require('speakeasy');
import qrcode = require('qrcode');
import jwt = require('jsonwebtoken');
import cheerio = require('cheerio');
import * as Crypto from 'crypto';
import * as util from 'util';
import axios from 'axios';
import { Forbidden } from 'ts-httpexceptions';
import { Middleware, Req, Request, Res } from '@tsed/common';
import config from '../helpers/config';
import { SessionOfLoggedInUser } from '../models/v1/any';
import * as redis from "../helpers/ioredis";

import * as imageResizer from '../services/image-resize';
import { IResizedImage } from "../services/image-resize/model";

// kinda useless but yolo
const randomBytes = util.promisify(Crypto.randomBytes);

/**
 * Interfaces
 */

/**
 * Hash a password using bcrypt
 * @param passwd Password String
 */
export const hashPassword = async (passwd: string, bcryptLib = bcrypt): Promise<string> => {
    const salt = await bcryptLib.genSalt(10);
    return await bcryptLib.hash(passwd, salt);
};

/**
 * Verify a password string equals the hash provided
 * @param passwd Password String
 * @param hash Password Hash
 */
export const verifyPassword = async (passwd: string, hash: string, bcryptLib = bcrypt): Promise<boolean> => {
    return await bcryptLib.compare(passwd, hash);
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
            res.set({ 'x-csrf-token': req.session.userdata.csrf });
            throw new Forbidden("CSRFValidationFailed");
        } else {
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
export const getCsrf = async (req: Request, setSessionLib = setSession, regenCsrfLib = regenCsrf): Promise<boolean | string> => {
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
export const isAuthenticated = async (req: Request): Promise<SessionOfLoggedInUser> => {
    if (!req.session) {
        throw false;
    }
    if (!req.session.userdata) {
        throw false;
    }
    if (req.session.userdata.id) {
        return req.session.userdata as SessionOfLoggedInUser;
    } else {
        throw false;
    }
}
/**
 * Encrypt a string. Not specifying an IV is deprecated and will be removed once we revise all database stuff
 * @param text 
 * @param key 
 */
export const encrypt = (text: string, key: string, iv?: Buffer | string): string => {
    // for legacy purposes
    // todo: remove
    if (!iv) {
        console.warn('[warning] no iv specified for auth.encrypt(), using default of NULL');
        iv = Buffer.from('0'.repeat(32), 'hex');
    }
    const cipher = Crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([
        encrypted,
        cipher.final()
    ]);
    return encrypted.toString('hex');
}

/**
 * Decrypt a string. Not specifying an IV is deprecated and will be removed once we revise all database stuff
 * @param encryptedString 
 * @param key 
 */
export const decrypt = (encryptedString: string, key: string, iv?: Buffer | string): string => {
    // for legacy purposes
    // todo: remove
    if (typeof iv !== 'string' && typeof iv !== 'object') {
        // console.warn('[warning] no iv specified for auth.decrypt(), using default of NULL');
        iv = Buffer.from('0'.repeat(32), 'hex');
    }
    const decipher = Crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(Buffer.from(encryptedString, 'hex'));
    decrypted = Buffer.concat([
        decrypted,
        decipher.final(),
    ]);
    return decrypted.toString();
}

/**
 * special function for encrypting password hashes
 * @param passwordHash 
 */
export const encryptPasswordHash = (passwordHash: string): string => {
    const PASSWORD_ENCRYPTION_KEY = config.encryptionKeys.password;
    let ivForPassword = Crypto.randomBytes(16);
    let result = encrypt(passwordHash, PASSWORD_ENCRYPTION_KEY, ivForPassword);
    return JSON.stringify([
        result,
        ivForPassword.toString('hex'),
    ]);
}
/**
 * special function for decrypting password hashes
 * @param encryptedString 
 */
export const decryptPasswordHash = (passwordHash: string): string => {
    const PASSWORD_ENCRYPTION_KEY = config.encryptionKeys.password;
    let decoded = JSON.parse(passwordHash);
    let passString = decoded[0];
    let passIv = Buffer.from(decoded[1], 'hex');
    return decrypt(passString, PASSWORD_ENCRYPTION_KEY, passIv);
}

export const getCachedTotpResults = async (userId: number): Promise<string> => {
    let result = await redis.get().get('cached_totp_results_' + userId.toString());
    if (result) {
        return result;
    }
    throw new Error('No code generated');
}

export const setCachedTotpResults = async (userId: number, val: string): Promise<void> => {
    await redis.get().setex('cached_totp_results_' + userId.toString(), 2500, val);
}

export const generateTOTPSecret = () => {
    return new Promise((res, rej) => {
        let secret = speakeasy.generateSecret({ length: 32, name: 'BlocksHub' });
        // @ts-ignore
        qrcode.toDataURL(secret.otpauth_url, (err: any, text: any) => {
            if (err) {
                return rej(err);
            }
            let object: any = {
                qrCodeUrl: text,
                secret: {
                    base32: secret.base32,
                },
            };
            if (process.env.NODE_ENV === 'development') {
                object.secret = secret;
            }
            res(object);
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
    } catch {
        throw new Error('Invalid Secret or Token Provided');
    }
    if (!result || secret.length !== 52) {
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

export const decodeTwoFactorJWT = (code: string): { userId: number; expectedIp: string; iat: number } => {
    if (!config.jwt || !config.jwt.twoFactor) {
        console.error('No jwt.twoFactor specified in config.json');
        process.exit(1);
    }
    let val = jwt.verify(code, config.jwt.twoFactor);
    return val as any;
}

export const generateAuthServiceJWT = async (userId: number, username: string) => {
    if (!config.jwt || !config.jwt.authenticationService) {
        console.error('No jwt.authenticationService specified in config.json');
        process.exit(1);
    }
    let obj = {
        userId: userId,
        username: username,
    };
    return jwt.sign(obj, config.jwt.authenticationService);
}

export const decodeAuthServiceJWT = (code: string): { userId: number; username: string; iat: number } => {
    if (!config.jwt || !config.jwt.authenticationService) {
        console.error('No jwt.authenticationService specified in config.json');
        process.exit(1);
    }
    let val = jwt.verify(code, config.jwt.authenticationService);
    return val as any;
}


export const generateGameServerCode = async (userId: number, username: string) => {
    if (!config.jwt || !config.jwt.gameServerAuthentication) {
        console.error('No jwt.gameAuthentication specified in config.json');
        process.exit(1);
    }
    let obj = {
        userId: userId,
        username: username,
        isServerAuthorization: true,
    };
    return jwt.sign(obj, config.jwt.gameServerAuthentication);
}

export const decodeGameServerAuthCode = (code: string): { userId: number; username: string; iat: number } => {
    if (!config.jwt || !config.jwt.gameServerAuthentication) {
        console.error('No jwt.gameAuthentication specified in config.json');
        process.exit(1);
    }
    let val = jwt.verify(code, config.jwt.gameServerAuthentication) as { userId: number; username: string; isServerAuthorization?: boolean };
    if (!val.isServerAuthorization) {
        throw new Error('This token is not an auth code.');
    }
    return val as any;
}


export const generateGameAuthCode = async (userId: number, username: string) => {
    if (!config.jwt || !config.jwt.gameAuthentication) {
        console.error('No jwt.gameAuthentication specified in config.json');
        process.exit(1);
    }
    let obj = {
        userId: userId,
        username: username,
        isAuthCode: true,
    };
    return jwt.sign(obj, config.jwt.gameAuthentication);
}

export const decodeGameAuthCode = (code: string): { userId: number; username: string; iat: number } => {
    if (!config.jwt || !config.jwt.gameAuthentication) {
        console.error('No jwt.gameAuthentication specified in config.json');
        process.exit(1);
    }
    let val = jwt.verify(code, config.jwt.gameAuthentication) as { userId: number; username: string; isAuthCode?: boolean };
    if (!val.isAuthCode) {
        throw new Error('This token is not an auth code.');
    }
    return val as any;
}

export const decodeImageProxyQuery = (imageProxyUrl: string): string => {
    if (!config.jwt || !config.jwt.imageProxy) {
        console.error('No jwt.imageProxy specified in config.json');
        process.exit(1);
    }
    let data = jwt.verify(imageProxyUrl, config.jwt.imageProxy) as { url: string; iat: number; };
    if (moment().isSameOrAfter(moment(data.iat * 1000).add(48, 'hours'))) {
        throw new Error('Request has expired');
    }
    return data['url'];
}


export const fetchImageAndResize = async (imageUrl: string): Promise<IResizedImage> => {
    let image = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    return await imageResizer.async.resizeImage(image.data, image.headers['content-type']);
}

interface OGTagsFromWebsite {
    thumbnailUrl: string | null;
    description: string | null;
    title: string | null;
    userStatusId: number;
}

interface IUrlToGrab {
    statusId: number;
    urls: string[];
}

interface IOGTags {
    statusId: number;
    url: string;
    ogInfo: any;
}
const convertResponseBodyToOgInfo = (body: string): any => {
    let thumbnailUrl: string | null = null;
    let desc: string | null = null;
    let title: string | null = null;
    const $ = cheerio.load(body);
    let thumb = $('meta[property="og:image"]').first().attr('content');
    if (thumb) {
        thumbnailUrl = thumb;
    } else {
        let twitterThumbnail = $('meta[name="twitter:image"]').first().attr('content');
        if (twitterThumbnail) {
            thumbnailUrl = twitterThumbnail;
        }
    }
    if (thumbnailUrl && thumbnailUrl.length > 255) {
        thumbnailUrl = null;
    }

    let ogDesc = $('meta[propety="og:description"]').first().attr('content');
    if (ogDesc) {
        desc = ogDesc;
    } else {
        let twitterDesc = $('meta[name="twitter:description"]').first().attr('content');
        if (twitterDesc) {
            desc = twitterDesc;
        }
    }
    if (desc && desc.length > 255) {
        desc = desc.slice(0, 255 - '...'.length) + '...';
    }

    let ogTitle = $('meta[name="og:title"]').first().attr('content');
    if (ogTitle) {
        title = ogTitle;
    } else {
        let twitterTitle = $('meta[name="twitter:title"]').first().attr('content');
        if (twitterTitle) {
            title = twitterTitle;
        } else {
            let generalTitle = $('title').first().html();
            if (generalTitle) {
                title = generalTitle;
            }
        }
    }
    if (title && title.length > 64) {
        title = title.slice(0, 64 - '...'.length) + '...';
    }

    if (thumbnailUrl) {
        if (thumbnailUrl.slice(0, 'https://'.length).toLowerCase() === 'https://') {
            // generate a JWT for the URL to be proxied
            // this is so people dont try to abuse the proxy for their own purposes
            let imageUrlWithProxy = jwt.sign({ url: thumbnailUrl }, config.jwt.imageProxy);
            thumbnailUrl = '/api/v1/feed/preview-proxy?url=' + encodeURIComponent(imageUrlWithProxy);
        } else {
            thumbnailUrl = null;
        }
    } else {
        thumbnailUrl = null;
    }

    return {
        thumbnailUrl: thumbnailUrl,
        description: desc,
        title: title,
    }
}
const getOgTagsForUrl = async (originalUrl: string, statusId: number): Promise<IOGTags> => {
    // normalize url
    let url = originalUrl;

    let responseData = '';
    const redisKey = 'og_info_url_v1_' + url;
    const cachedResult = await redis.get().get(redisKey);
    if (cachedResult) {
        const response = JSON.parse(cachedResult);
        // overwrite statusid (obviously)
        response.statusId = statusId;
        // overwrite url in case order is slightly different
        response.url = originalUrl;
        return response;
    } else {
        let request = await axios.get(url, {
            maxRedirects: 2,
            headers: {
                'user-agent': 'blockshub.net bot v1.0.0'
            },
            maxContentLength: 2000000, // ithink this is 2 mb?
            validateStatus: (status: number) => {
                return true;
            },
        });
        if (typeof request.data === 'string') {
            responseData = request.data;
        }
    }
    const result = {
        url: url,
        statusId: statusId,
        ogInfo: convertResponseBodyToOgInfo(responseData),
    }
    await redis.get().setex(redisKey, 86400, JSON.stringify(result));
    return result;
}
export const multiGetOgTagsForYoutubeLinks = async (data: IUrlToGrab[]): Promise<OGTagsFromWebsite[] | any[]> => {
    if (data.length === 0) {
        return [];
    }
    let responseData = [];
    for (const item of data) {
        if (!item.urls) {
            continue;
        }
        item.urls = [...new Set(item.urls)];
        for (const url of item.urls) {
            responseData.push(getOgTagsForUrl(url, item.statusId));
        }
    }
    return await Promise.all(responseData);
}

export const verifyEmail = (newEmail: string): string | false => {
    // Email Validation Function ;-;
    const validate = (email: string): boolean => {
        const expression = /(?!.*\.{2})^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;

        return expression.test(String(email).toLowerCase())
    }
    // If invalid email specified
    if (!validate(newEmail)) {
        return false;
    }
    // Remove special characters from gmail
    let stuffBeforeAtSign = newEmail.slice(0, newEmail.indexOf('@'));
    let domain = newEmail.slice(newEmail.indexOf('@') + 1).toLowerCase();
    let emailDomainWithoutSuffix = domain.slice(0, domain.indexOf('.'));
    if (emailDomainWithoutSuffix === 'gmail' || emailDomainWithoutSuffix === 'googlemail') {
        stuffBeforeAtSign = stuffBeforeAtSign.replace(/\./g, '');
        if (stuffBeforeAtSign.indexOf('+') !== -1) {
            stuffBeforeAtSign = stuffBeforeAtSign.slice(0, stuffBeforeAtSign.indexOf('+'));
        }
        newEmail = stuffBeforeAtSign + '@gmail.com';
    }
    // I cant imagine any email clients are case-sensitive
    newEmail = newEmail.toLowerCase();
    return newEmail;
}