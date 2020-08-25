/**
 * Imports
 */
import * as moderation from '../models/v1/moderation';

import _init from './_init';

class ModerationDAL extends _init {
    /**
     * Get a user's latest ban data from the user_moderation table. Throws false if they have not been banned before.
     * @param userId User's ID
     */
    public async getBanDataFromUserId(userId: number): Promise<moderation.ModerationAction> {
        const banResult = await this.knex('user_moderation').select('user_moderation.id', 'user_moderation.userid as userId', 'user_moderation.reason', 'user_moderation.date', 'user_moderation.until_unbanned as untilUnbanned', 'user_moderation.is_terminated as terminated').where({userid: userId}).limit(1).orderBy('id', 'desc');
        const banData = banResult[0];
        if (banData === undefined) {
            throw new this.NotFound('NoBanAvailable');
        }
        if (banData['terminated'] === 0) {
            banData['unlock'] = this.moment().isSameOrAfter(this.moment(banData['untilUnbanned']));
        }

        banData["isEligibleForAppeal"] = !this.moment().isSameOrAfter(this.moment(banData['date']).add(30, 'days'));
        return banData as moderation.ModerationAction;
    }

}

export default ModerationDAL;
