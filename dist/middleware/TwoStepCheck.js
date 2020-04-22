"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const controller_1 = require("../controllers/controller");
const model = require("../models/models");
const dal = new controller_1.default();
exports.default = (type) => {
    return async (req, res, next) => {
        let userInfo = res.locals.userInfo;
        let userId = userInfo.userId;
        let enabled = await dal.settings.is2faEnabled(userId);
        if (!enabled.enabled) {
            return next();
        }
        if (req.body['twoStepToken']) {
            let token = req.body['twoStepToken'];
            let twoFactorInfo = await dal.settings.is2faEnabled(userId);
            if (!twoFactorInfo || !twoFactorInfo.enabled) {
                return next(new dal.BadRequest('TwoStepRequiredVerificationFailed'));
            }
            let result;
            try {
                result = await dal.auth.validateTOTPSecret(twoFactorInfo.secret, token);
            }
            catch (e) {
                return next(new dal.BadRequest('TwoStepRequiredVerificationFailed'));
            }
            if (!result) {
                return next(new dal.BadRequest('TwoStepRequiredVerificationFailed'));
            }
            return next();
        }
        let typesToCheckFor = [];
        if (type === 'TradeRequest' || type === 'TradeCompleted' || type === 'BuyItem' || type === 'ListItem') {
            typesToCheckFor.push(model.user.ipAddressActions.PurchaseOfItem, model.user.ipAddressActions.PutItemForSale, model.user.ipAddressActions.TradeCompleted, model.user.ipAddressActions.TradeSent);
        }
        let ip = req.ip;
        if (req.headers['cf-connecting-ip']) {
            ip = req.headers['cf-connecting-ip'];
        }
        let ipIsNew = await dal.user.checkIfIpIsNew(userId, ip, typesToCheckFor);
        if (ipIsNew) {
            return next(new dal.Conflict('TwoStepVerificationRequired'));
        }
        else {
            return next();
        }
    };
};

