import { Middleware, Req, Res, Next } from "@tsed/common";
import controller from '../controllers/controller';
import * as model from '../models/models';

const dal = new controller();

export default (type: 'TradeRequest' | 'TradeCompleted' | 'BuyItem' | 'ListItem'): any => {
    return async (req: Req, res: Res, next: Next) => {
        let userInfo = res.locals.userInfo as model.user.UserInfo;
        let userId = userInfo.userId;
        // Check if two-step enabled
        let enabled = await dal.settings.is2faEnabled(userId);
        if (!enabled.enabled) {
            return next(); // Skip verification
        }

        // Check if part-two or part one
        if (req.body['twoStepToken']) {
            let token = req.body['twoStepToken'];
            // Is Part two
            let twoFactorInfo = await dal.settings.is2faEnabled(userId);
            if (!twoFactorInfo || !twoFactorInfo.enabled) {
                return next(new dal.BadRequest('TwoStepRequiredVerificationFailed'));
            }
            // Validate secret
            let result: boolean;
            try {
                result = await dal.auth.validateTOTPSecret(twoFactorInfo.secret, token);
            } catch (e) {
                return next(new dal.BadRequest('TwoStepRequiredVerificationFailed'));
            }
            if (!result) {
                return next(new dal.BadRequest('TwoStepRequiredVerificationFailed'));
            }
            // Good
            return next();
        }
        // Is part one

        let typesToCheckFor: number[] = [];
        // Right now this seems a little useless, but its here for when more items are added to "type" (like signin or something)
        if (type === 'TradeRequest' || type === 'TradeCompleted' || type === 'BuyItem' || type === 'ListItem') {
            typesToCheckFor.push(model.user.ipAddressActions.PurchaseOfItem, model.user.ipAddressActions.PutItemForSale, model.user.ipAddressActions.TradeCompleted, model.user.ipAddressActions.TradeSent);
        }
        let ip = req.ip;
        if (req.headers['cf-connecting-ip']) {
            ip = req.headers['cf-connecting-ip'] as string;
        }
        let ipIsNew = await dal.user.checkIfIpIsNew(userId, ip, typesToCheckFor);
        if (ipIsNew) {
            // Require two-step
            return next(new dal.Conflict('TwoStepVerificationRequired'));
        } else {
            // Ip is not new. Allow
            return next();
        }
    }
}
