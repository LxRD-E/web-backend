"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const os = require("os");
const util = require("util");
const moment = require("moment");
const prom = require("../helpers/prometheus");
const randomBytes = util.promisify(crypto.randomBytes);
randomBytes(64).then(() => {
}).catch(err => {
    console.error(err);
});
const Users = require("../models/v1/user");
const ts_httpexceptions_1 = require("ts-httpexceptions");
const user_1 = require("../dal/user");
const moderation_1 = require("../dal/moderation");
const auth_1 = require("../dal/auth");
const ts_httpexceptions_2 = require("ts-httpexceptions");
exports.csp = {
    'form-action': `'self'`,
    'media-src': `'none'`,
    'frame-ancestors': `'self'`,
    'img-src': `'self' data: https://cdn.blockshub.net/ https://hindigamerclub-game.ewr1.vultrobjects.com/ https://www.google-analytics.com/`,
    'connect-src': `'self' ws://localhost:8080/ https://sentry.io/ https://ka-f.fontawesome.com/releases/v5.15.1/css/free.min.css`,
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
exports.lbOrigin = crypto.randomBytes(8).toString('base64');
exports.version = crypto.randomBytes(8).toString('hex');
exports.generateCspWithNonce = async (req, res, next, randomBytesFunction = randomBytes) => {
    res.set({
        'x-lb-origin': exports.lbOrigin,
    });
    res.locals['x-lb-origin'] = exports.lbOrigin;
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
        'X-XSS-Protection': '0',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-Environment': exports.environment,
        'X-Permitted-Cross-Domain-Policies': 'none',
    });
    if (req.url.slice(0, '/api/'.length) === '/api/') {
        return next();
    }
    const nonceBuffer = await randomBytesFunction(48);
    let nonce = nonceBuffer.toString('base64');
    let headerString = 'script-src \'nonce-' + nonce + '\'; ' + exports.getCspString();
    if (req.url.slice(0, '/v1/authenticate-to-service'.length) === '/v1/authenticate-to-service') {
        headerString = headerString.replace(/form-action 'self'; /g, '');
    }
    res.set({
        'Content-Security-Policy': headerString,
    });
    res.locals.version = await randomBytesFunction(8);
    res.locals.nonce = nonce;
    res.locals.javascript = exports.getJavascript(nonce, exports.version);
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
exports.getJavascript = (nonce, version) => {
    return `
        <script nonce="${nonce}" src="/js/warning.js"></script>
        <script nonce="${nonce}" src="/js/bundle/sentry.bundle.js?v=${version}"></script>
        <script nonce="${nonce}">
            Sentry.init({ dsn: 'https://a5c3a9adef4a4e149a1e2d1651b9da4d@sentry.io/2505702' });
        </script>
        <script nonce="${nonce}" src="/js/bundle/main.bundle.js?v=${version}"></script>
        <script nonce="${nonce}" src="/js/bundle/bootstrap.bundle.js?v=${version}"></script>`;
};
exports.default = async (req, res, next, UserModel = user_1.default, ModModel = moderation_1.default, setSession = auth_1.setSession, regenCsrf = auth_1.regenCsrf) => {
    let p = prom.get('middleware_any', 'middleware for all API requests');
    p.counter.inc();
    let start = new Date().getTime();
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
        const userData = Object.assign({}, req.session.userdata);
        let impersonateUserId = req.session.impersonateUserId;
        let isImpersonating = typeof impersonateUserId === 'number';
        if (impersonateUserId) {
            userData.id = impersonateUserId;
            const impersonateUserInfo = await new UserModel().getInfo(impersonateUserId, ['passwordChanged', 'username']);
            userData.passwordUpdated = impersonateUserInfo.passwordChanged;
            userData.username = impersonateUserInfo.username;
            res.locals.impersonateUserId = impersonateUserId;
        }
        if (userData) {
            let userInfo;
            if (!userData.id || userData.passwordUpdated === undefined || !userData.username) {
                if (!userData.csrf) {
                    await setSession(req);
                }
                p.historGram.observe((start - new Date().getTime()) / 1000);
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
            if (userData) {
                res.locals.csrf = userData.csrf;
            }
            if (!isImpersonating && userInfo && userInfo.banned === Users.banned.true) {
                if (req.method === 'GET') {
                    if (req.url === '/api/v1/auth/ban' || req.url === '/api/v1/auth/current-user') {
                        p.historGram.observe((start - new Date().getTime()) / 1000);
                        return next();
                    }
                }
                if (req.url.substr(0, "/api/v1/auth/unlock".length) === "/api/v1/auth/unlock" ||
                    req.url.substr(0, "/api/v1/auth/logout".length) === "/api/v1/auth/logout" ||
                    req.url.toLowerCase().slice(0, '/support'.length) === '/support' ||
                    req.url.toLowerCase().slice(0, '/api/v1/support'.length) === '/api/v1/support' ||
                    req.url.toLowerCase() === '/terms') {
                }
                else {
                    return next(new ts_httpexceptions_2.Unauthorized('AccountBanned'));
                }
            }
            p.historGram.observe((start - new Date().getTime()) / 1000);
            next();
        }
        else {
            await setSession(req);
            await regenCsrf(req);
            p.historGram.observe((start - new Date().getTime()) / 1000);
            next();
        }
    }
    else {
        console.warn('[warning] sessions appear to be down');
        p.historGram.observe((start - new Date().getTime()) / 1000);
        next();
    }
};

