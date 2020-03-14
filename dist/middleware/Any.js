"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const os = require("os");
const util = require("util");
const moment = require("moment");
const randomBytes = util.promisify(crypto.randomBytes);
const Users = require("../models/v1/user");
const Moderation = require("../models/v1/moderation");
const ts_httpexceptions_1 = require("ts-httpexceptions");
const user_1 = require("../dal/user");
const moderation_1 = require("../dal/moderation");
const economy_1 = require("../dal/economy");
const model = require("../models/models");
const auth_1 = require("../dal/auth");
const ts_httpexceptions_2 = require("ts-httpexceptions");
exports.csp = {
    'form-action': `'self'`,
    'media-src': `'none'`,
    'frame-ancestors': `'self'`,
    'img-src': `'self' data: https://cdn.hindigamer.club/ https://hindigamerclub-game.ewr1.vultrobjects.com/`,
    'connect-src': `'self' ws://localhost:8080/ https://sentry.io/`,
    'object-src': `'none'`,
    'base-uri': `'self'`,
};
let cspString = '';
Object.keys(exports.csp).forEach((cspKey) => {
    cspString = cspString + cspKey + ' ' + exports.csp[cspKey] + '; ';
});
exports.processId = process.pid;
exports.environment = process.env.NODE_ENV;
exports.hostName = os.hostname();
exports.getCspString = () => {
    return cspString;
};
exports.generateCspWithNonce = async (req, res, next, randomBytesFunction = randomBytes) => {
    if (process.env.NODE_ENV === 'development' && !req.headers['cf-connecting-ip']) {
        req.headers['cf-connecting-ip'] = '127.0.0.1';
    }
    if (req.url === '/docs' || req.url === '/docs/') {
        return next();
    }
    res.set({
        'X-Frame-Options': 'DENY',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-Environment': exports.environment,
        'X-Permitted-Cross-Domain-Policies': 'none',
    });
    if (req.url.slice(0, '/api/'.length) === '/api/') {
        return next();
    }
    const nonceBuffer = await randomBytesFunction(48);
    let nonce;
    if (!nonceBuffer) {
        const rand = (length, current = '') => {
            current = current ? current : '';
            return length ? rand(--length, "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz".charAt(Math.floor(Math.random() * 60)) + current) : current;
        };
        nonce = rand(48);
    }
    else {
        nonce = nonceBuffer.toString('base64');
    }
    let headerString;
    if (req.originalUrl.match(/\/game\/(\d+)\/sandbox/g)) {
        headerString = 'script-src \'nonce-' + nonce + '\' ' + "'unsafe-eval'; " + exports.getCspString();
    }
    else {
        headerString = 'script-src \'nonce-' + nonce + '\'; ' + exports.getCspString();
    }
    if (req.url.slice(0, '/v1/authenticate-to-service'.length) === '/v1/authenticate-to-service') {
        headerString = headerString.replace(/form-action 'self'; /g, '');
    }
    res.set({
        'Content-Security-Policy': headerString,
    });
    res.locals.nonce = nonce;
    next();
};
exports.getIp = (req) => {
    const cloudflareIP = req.get('cf-connecting-ip');
    if (cloudflareIP) {
        return cloudflareIP;
    }
    else {
        if (!req.connection.remoteAddress) {
            return '127.0.0.1';
        }
        return req.connection.remoteAddress;
    }
};
exports.default = async (req, res, next, UserModel = user_1.default, ModModel = moderation_1.default, setSession = auth_1.setSession, regenCsrf = auth_1.regenCsrf) => {
    if (req.query.sort) {
        if (req.query.sort !== 'asc' && req.query.sort !== 'desc') {
            return next(new ts_httpexceptions_1.BadRequest('InvalidSort'));
        }
    }
    if (req.url.slice(0, 4) === '/js/' || req.url.slice(0, 5) === '/css/') {
        return next();
    }
    res.locals.ip = exports.getIp(req);
    if (req.session) {
        if (req.session.userdata) {
            let userInfo;
            const userData = req.session.userdata;
            if (!userData.id || userData.passwordUpdated === undefined || !userData.username) {
                if (!userData.csrf) {
                    await setSession(req);
                }
                next();
                return;
            }
            if (moment().isSameOrAfter(moment(userData.csrfExpire))) {
                await regenCsrf(req);
            }
            try {
                userInfo = await new UserModel().getInfo(userData.id, ['userId', 'username', 'passwordChanged', 'banned', 'theme', 'primaryBalance', 'secondaryBalance', 'staff', 'dailyAward']);
            }
            catch (e) {
                delete req.session.userdata;
                await regenCsrf(req);
            }
            if (userInfo === undefined) {
                delete req.session.userdata;
                await regenCsrf(req);
            }
            if (userInfo && userInfo.passwordChanged > userData.passwordUpdated) {
                delete req.session.userdata;
                await regenCsrf(req);
            }
            if (userInfo && userInfo.username !== userData.username) {
                delete req.session.userdata;
                await regenCsrf(req);
            }
            res.locals.userInfo = userInfo;
            if (req.url.slice(0, 5) !== '/api/') {
                let dal = new UserModel();
                await dal.logOnlineStatus(userInfo.userId);
                if (moment().isSameOrAfter(moment(userInfo.dailyAward).add(24, 'hours'))) {
                    await new economy_1.default().createTransaction(userInfo.userId, 1, 10, model.economy.currencyType.secondary, model.economy.transactionType.DailyStipendSecondary, 'Daily Stipend', model.catalog.creatorType.User, model.catalog.creatorType.User);
                    await new economy_1.default().addToUserBalance(userInfo.userId, 10, model.economy.currencyType.secondary);
                    await dal.updateDailyAward(userInfo.userId);
                }
            }
            if (userInfo && userInfo.banned === Users.banned.true) {
                if (req.url === "/Membership/NotApproved.aspx?ID=" + userData.id) {
                    let banData;
                    try {
                        banData = await new ModModel().getBanDataFromUserId(userData.id);
                        banData.date = moment(banData.date).format();
                    }
                    catch (e) {
                        banData = {
                            id: 0,
                            userId: userData.id,
                            reason: "The reason for your account's termination is not specified.",
                            date: moment().format(),
                            untilUnbanned: new Date(),
                            terminated: Moderation.terminated.true,
                            unlock: false,
                            isEligibleForAppeal: false,
                        };
                    }
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
                }
                else if (req.url.substr(0, "/api/v1/auth/unlock".length) === "/api/v1/auth/unlock" ||
                    req.url.substr(0, "/api/v1/auth/logout".length) === "/api/v1/auth/logout" ||
                    req.url.toLowerCase().slice(0, '/support'.length) === '/support' ||
                    req.url.toLowerCase().slice(0, '/api/v1/support'.length) === '/api/v1/support' ||
                    req.url.toLowerCase() === '/terms') {
                }
                else if (req.url.substr(0, 5) === "/api/") {
                    return next(new ts_httpexceptions_2.Unauthorized('Unauthorized'));
                }
                else {
                    res.redirect("/Membership/NotApproved.aspx?ID=" + userData.id);
                    return;
                }
            }
            next();
        }
        else {
            await setSession(req);
            await regenCsrf(req);
            next();
        }
    }
    else {
        console.warn('[warning] sessions appear to be down');
        next();
    }
};

