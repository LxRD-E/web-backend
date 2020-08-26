"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../helpers/config");
exports.MigrateRBXSession = () => {
    return (req, res, next) => {
        let cookie = req.cookies['rbxsession'];
        if (cookie) {
            res.cookie('blockshub-session', cookie, {
                secure: config_1.default.session.secure || false,
                maxAge: (86400 * 30 * 12) * 1000,
                sameSite: 'lax',
                domain: config_1.default.session.domain || '.blockshub.hh',
            });
            res.clearCookie('rbxsession');
            res.redirect('/');
            return;
        }
        next();
    };
};

