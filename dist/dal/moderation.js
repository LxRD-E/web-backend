"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _init_1 = require("./_init");
class ModerationDAL extends _init_1.default {
    async getBanDataFromUserId(userId) {
        const banResult = await this.knex('user_moderation').select('user_moderation.id', 'user_moderation.userid as userId', 'user_moderation.reason', 'user_moderation.date', 'user_moderation.until_unbanned as untilUnbanned', 'user_moderation.is_terminated as terminated').where({ userid: userId }).limit(1).orderBy('id', 'desc');
        const banData = banResult[0];
        if (banData === undefined) {
            throw false;
        }
        if (banData['terminated'] === 0) {
            if (this.moment().isSameOrAfter(this.moment(banData['untilUnbanned']))) {
                banData['unlock'] = true;
            }
            else {
                banData['unlock'] = false;
            }
        }
        banData["isEligibleForAppeal"] = true;
        if (this.moment().isSameOrAfter(this.moment(banData['date']).add(30, 'days'))) {
            banData["isEligibleForAppeal"] = false;
        }
        return banData;
    }
}
exports.default = ModerationDAL;
//# sourceMappingURL=moderation.js.map