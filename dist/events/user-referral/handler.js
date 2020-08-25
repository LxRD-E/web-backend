"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const forum_1 = require("../forum");
const ts_httpexceptions_1 = require("ts-httpexceptions");
const controller_1 = require("../../controllers/controller");
const ctrl = new controller_1.default();
const model = require("../../models/models");
forum_1.default.registerListener(async (type, data) => {
    try {
        if (type === 'createPost' || type === 'createThread') {
            let info = data;
            const forUpdate = [
                'user_referral_contest_entry',
            ];
            await ctrl.transaction({}, forUpdate, async function (trx) {
                let refInfo;
                let contest;
                try {
                    refInfo = await trx.userReferral.getReferralUsedByUser(info.userId);
                    contest = await trx.userReferral.getReferralContestStatusForUser(info.userId);
                    if (contest.hasContestEnded || contest.hasEnteredContest) {
                        throw new trx.Conflict('ContestEnded');
                    }
                }
                catch (err) {
                    if (err instanceof ts_httpexceptions_1.Exception) {
                        throw err;
                    }
                    else {
                        console.log('[info] error is httpexception. ignoring -', err.message);
                        return;
                    }
                }
                const entry = await trx.userReferral.createReferralEntry(info.userId, refInfo.referralId, model.userReferral.ContestEntryType.ReferredBySomeone);
                console.log('Enter user into contest!');
            });
        }
    }
    catch (err) {
        console.error(err);
    }
});
exports.default = {};

