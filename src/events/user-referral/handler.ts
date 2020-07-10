import forum from '../forum';
import {IForumPost} from "../listener-base";
import {Exception as HTTPException} from 'ts-httpexceptions';

import controller from '../../controllers/controller';
const ctrl = new controller();
import * as model from '../../models/models';

forum.registerListener(async (type, data) => {
    try {
        if (type === 'createPost' || type === 'createThread') {
            let info = data as IForumPost;
            const forUpdate = [
                'user_referral_contest_entry',
            ]
            await ctrl.transaction({}, forUpdate, async function(trx) {
                let refInfo;
                let contest;
                try {
                    refInfo = await trx.userReferral.getReferralUsedByUser(info.userId);
                    contest = await trx.userReferral.getReferralContestStatusForUser(info.userId);
                    if (contest.hasContestEnded || contest.hasEnteredContest) {
                        // Ignore
                        throw new trx.Conflict('ContestEnded');
                    }
                }catch(err) {
                    if (err !instanceof HTTPException) {
                        throw err;
                    }else{
                        console.log('[info] error is httpexception. ignoring -',err.message);
                        return;
                    }
                }
                // Create contest entry
                const entry = await trx.userReferral.createReferralEntry(info.userId, refInfo.referralId, model.userReferral.ContestEntryType.ReferredBySomeone);
                console.log('Enter user into contest!')
                // Ok
            });
        }
    }catch(err) {
        console.error(err); // log but dont do anything
    }
});

export default {}