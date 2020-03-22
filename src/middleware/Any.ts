import {Request, Response, NextFunction} from 'express';
import crypto = require('crypto');
import os = require('os');
import util = require('util');
import moment = require('moment');
const randomBytes = util.promisify(crypto.randomBytes);
import * as Users from '../models/v1/user'
import * as Moderation from '../models/v1/moderation';
import { BadRequest } from 'ts-httpexceptions';
// User model
import UserDAL from '../dal/user';
import ModDAL from '../dal/moderation';
import EconomyDAL from '../dal/economy';
import {
    SessionUserData,
} from '../models/v1/any';
import * as model from '../models/models';
/**
 * CSRF and Sessions
 */
import {
    setSession as setSessionNormal,
    regenCsrf as regenCsrfNormal,
} from '../dal/auth';
/**
 * Errors
 */
import { Unauthorized } from 'ts-httpexceptions';
/**
 * Pre-Generated CSP
 */
export const csp = {
    'form-action': `'self'`,
    'media-src': `'none'`,
    'frame-ancestors': `'self'`,
    'img-src': `'self' data: https://cdn.hindigamer.club/ https://hindigamerclub-game.ewr1.vultrobjects.com/ https://www.google-analytics.com/`,
    'connect-src': `'self' ws://localhost:8080/ https://sentry.io/`,
    'object-src': `'none'`,
    'base-uri': `'self'`,
} as any;
let cspString = '';
Object.keys(csp).forEach((cspKey) => {
    cspString = cspString + cspKey + ' ' + csp[cspKey] + '; ';
});
// Setup ID stuff
export const processId = process.pid;
export const environment = process.env.NODE_ENV;
export const hostName = os.hostname();

export const getCspString = (): string => {
    return cspString;
}

/**
 * Generate CSP with nonce middleware
 */
export const generateCspWithNonce = async (req: Request, res: Response, next: NextFunction, randomBytesFunction = randomBytes): Promise<void> => {
    res.set({
        'x-lb-origin': os.hostname()+'-'+process.pid.toString(),
    })
    res.locals['x-lb-origin'] = os.hostname()+'-'+process.pid.toString();
    // temp
    if (process.env.NODE_ENV === 'development'  && !req.headers['cf-connecting-ip']) {
        req.headers['cf-connecting-ip'] = '127.0.0.1';
    }
    if (req.url === '/docs' || req.url === '/docs/') {
        return next();
    }
    res.set({
        'X-Frame-Options': 'DENY',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '0',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-Environment': environment,
        // 'X-Process-ID': processId,
        // 'X-HostName': hostName,
        'X-Permitted-Cross-Domain-Policies': 'none',
    });
    if (req.url.slice(0,'/api/'.length) === '/api/') {
        return next();
    }
    const nonceBuffer = await randomBytesFunction(48);
    let nonce: string;
    if (!nonceBuffer) {
        // Backup
        const rand = (length: number, current = ''): string => {
            current = current ? current : '';
            return length ? rand(--length, "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz".charAt(Math.floor(Math.random() * 60)) + current) : current;
        }
        nonce = rand(48);
    } else {
        nonce = nonceBuffer.toString('base64');
    }
    let headerString;
    if (req.originalUrl.match(/\/game\/(\d+)\/sandbox/g)) {
        headerString = 'script-src \'nonce-' + nonce + '\' ' + "'unsafe-eval'; " + getCspString();
    }else{
        headerString = 'script-src \'nonce-' + nonce + '\'; ' + getCspString();
    }
    if (req.url.slice(0,'/v1/authenticate-to-service'.length) === '/v1/authenticate-to-service') {
        headerString = headerString.replace(/form-action 'self'; /g, '');
    }
    res.set({
        // CSP Headers
        'Content-Security-Policy': headerString,
    });
    res.locals.nonce = nonce;
    next();
}

export const getIp = (req: Request): string => {
    const cloudflareIP = req.get('cf-connecting-ip');
    if (cloudflareIP) {
        return cloudflareIP;
    }else{
        if (!req.connection.remoteAddress) {
            return '127.0.0.1';
        }
        return req.connection.remoteAddress;
    }
}

export default async (req: Request, res: Response, next: NextFunction, UserModel = UserDAL, ModModel = ModDAL, setSession = setSessionNormal, regenCsrf = regenCsrfNormal): Promise<void> => {
    if (req.query.sort) {
        if (req.query.sort !== 'asc' && req.query.sort !== 'desc') {
            return next(new BadRequest('InvalidSort'));
        }
    }
    if (req.url.slice(0,4) === '/js/' || req.url.slice(0,5) === '/css/') {
        return next();
    }
    // Setup IP
    res.locals.ip = getIp(req);
    // If sessions are up/working
    if (req.session) {
        // If user data exists
        if (req.session.userdata) {
            let userInfo;
            const userData = req.session.userdata as SessionUserData;
            if (!userData.id || userData.passwordUpdated === undefined || !userData.username) {
                // Not logged in
                if (!userData.csrf) {
                    await setSession(req);
                }
                next();
                return;
            }
            // If CSRF has expired
            if (moment().isSameOrAfter(moment(userData.csrfExpire))) {
                // Regen it
                await regenCsrf(req);
            }
            // Grab Data if Authenticated
            try {
                userInfo = await new UserModel().getInfo(userData.id, ['userId','username', 'passwordChanged', 'banned', 'theme', 'primaryBalance', 'secondaryBalance', 'staff', 'dailyAward']);
            } catch (e) {
                // Log out to be safe
                delete req.session.userdata;
                await regenCsrf(req);
            }
            // If user does not exist
            if (userInfo === undefined) {
                // Log out
                delete req.session.userdata;
                await regenCsrf(req);
            }
            // IF password has changed
            if (userInfo && userInfo.passwordChanged > userData.passwordUpdated) {
                // Log out
                delete req.session.userdata;
                await regenCsrf(req);
            }
            // If username has been changed
            if (userInfo && userInfo.username !== userData.username) {
                // Log out
                delete req.session.userdata;
                await regenCsrf(req);
            }
            // Setup Locals
            res.locals.userInfo = userInfo;
            // csrf local (so that it auto loads into the view)
            res.locals.csrf = req.session.userdata.csrf;
            // If not api request
            if (req.url.slice(0,5) !== '/api/') {
                let dal = new UserModel();
                // Update last online
                await dal.logOnlineStatus(userInfo.userId)
                // Give currency for being online (if applicable)

                // If over 24 hours since user got award for currency,
                if (moment().isSameOrAfter(moment(userInfo.dailyAward).add(24, 'hours'))) {
                    // Create transaction
                    await new EconomyDAL().createTransaction(userInfo.userId, 1, 10, model.economy.currencyType.secondary, model.economy.transactionType.DailyStipendSecondary, 'Daily Stipend', model.catalog.creatorType.User, model.catalog.creatorType.User);
                    // Give money
                    await new EconomyDAL().addToUserBalance(userInfo.userId, 10, model.economy.currencyType.secondary);
                    // Log user as awarded (aka update the dailyAward date)
                    await dal.updateDailyAward(userInfo.userId);
                }
            }
            // If banned
            if (userInfo && userInfo.banned === Users.banned.true) {
                if (req.url === "/Membership/NotApproved.aspx?ID="+userData.id) {
                    let banData: Moderation.ModerationAction;
                    try {
                        banData = await new ModModel().getBanDataFromUserId(userData.id);
                        banData.date = moment(banData.date).format();
                    }catch(e) {
                        banData = {
                            id: 0,
                            userId: userData.id,
                            reason: "The reason for your account's termination is not specified.",
                            date: moment().format(),
                            untilUnbanned: new Date(),
                            terminated: Moderation.terminated.true,
                            unlock: false,
                            isEligibleForAppeal: false,
                        } as Moderation.ModerationAction;
                    }
                    // Return ban page
                    res.render("banned", {
                        csrf: req.session.userdata.csrf,
                        ban: banData,
                        title: "Account Banned",
                        domain: "hindigamer.club",
                        userid: userData.id,
                        username: userData.username,
                        theme: userInfo.theme,
                        primaryBalance: userInfo.primaryBalance,
                        secondaryBalance: userInfo.secondaryBalance,
                    });
                    return;
                }else if (
                    // Allow access to unlock
                    req.url.substr(0, "/api/v1/auth/unlock".length) === "/api/v1/auth/unlock" || 
                    // Logout
                    req.url.substr(0, "/api/v1/auth/logout".length) === "/api/v1/auth/logout" || 
                    // Support pages
                    req.url.toLowerCase().slice(0,'/support'.length) === '/support' || 
                    // Support pages
                    req.url.toLowerCase().slice(0,'/api/v1/support'.length) === '/api/v1/support' || 
                    // & Terms of Service
                    req.url.toLowerCase() === '/terms'
                ) {
                }else if (req.url.substr(0, 5) === "/api/") {
                    // Otherwise if api route, return auth error
                    return next(new Unauthorized('Unauthorized'));
                }else{
                    // Redirect all other requests to ban page
                    res.redirect("/Membership/NotApproved.aspx?ID="+userData.id);
                    return;
                }
            }
            // Next
            next();
        } else {
            // Not logged in & no session data, so set one
            await setSession(req);
            await regenCsrf(req);
            next();
        }
    } else {
        console.warn('[warning] sessions appear to be down');
        // Sessions are down/unavailable
        next();
    }
};