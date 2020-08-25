"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _init_1 = require("./_init");
const model = require("../models/models");
class UserReferralDAL extends _init_1.default {
    async getInfoById(referralId) {
        const result = await this.knex('user_referral').select('id as referralId', 'user_id as userId', 'created_at as createdAt', 'updated_at as updatedAt').limit(1).where({
            'id': referralId,
        });
        if (!result[0]) {
            throw new this.NotFound('InvalidReferralId');
        }
        return result[0];
    }
    async getReferralUsedByUser(userId) {
        const result = await this.knex('user_referral_use').select('referral_id as referralId', 'user_referral_use.user_id as request_user_id', 'user_referral.created_at as createdAt', 'user_referral.updated_at as updatedAt', 'user_referral.user_id as userId').where({
            'user_referral_use.user_id': userId,
        }).innerJoin('user_referral', 'user_referral.id', 'user_referral_use.referral_id');
        if (!result[0]) {
            throw new this.NotFound('NotFound');
        }
        delete result[0]['request_user_id'];
        return result[0];
    }
    async getReferralCodeUses(referralId, offset = 0, limit = 100) {
        const uses = await this.knex('user_referral_use').select('user_referral_use.referral_id as referralId', 'user_referral_use.user_id as userId', 'user_referral_use.created_at as createdAt').where({
            'user_referral_use.referral_id': referralId,
        }).limit(limit + 1).offset(offset);
        return {
            areMoreAvailable: uses.length > limit,
            data: uses.slice(0, limit),
        };
    }
    async createReferralCode(userId) {
        const createdAt = this.knexTime();
        try {
            const [id] = await this.knex('user_referral').insert({
                'user_referral.user_id': userId,
                'user_referral.created_at': createdAt,
                'user_referral.updated_at': createdAt,
            });
            return {
                referralId: id,
                userId: userId,
                createdAt: createdAt,
                updatedAt: createdAt,
            };
        }
        catch (err) {
            if (err && err.errno === 1062) {
                throw new this.Conflict('ReferralAlreadyExists');
            }
            throw err;
        }
    }
    async getReferralCodeCreatedByUser(userId) {
        const [result] = await this.knex('user_referral').select('id as referralId', 'user_id as userId', 'created_at as createdAt', 'updated_at as updatedAt').limit(1).where({
            'user_id': userId,
        });
        if (!result) {
            throw new this.NotFound('NotFound');
        }
        result.uses = await this.knex('user_referral_use').count('id as total').where({
            'referral_id': result.referralId,
        });
        result.uses = result.uses[0]['total'];
        return result;
    }
    async registerReferralCodeUseForUser(userId, referralId) {
        await this.knex('user_referral_use').insert({
            'referral_id': referralId,
            'user_id': userId,
        });
    }
    async getReferralContestStatusForUser(userId) {
        const [contestData] = await this.knex('user_referral_contest_entry').select('user_referral_contest_entry.contest_id as contestId', 'user_referral_contest_entry.type', 'user_referral_contest.ended_at').where({
            'type': model.userReferral.ContestEntryType.ReferredBySomeone,
            'user_referral_contest_entry.user_id': userId,
        }).innerJoin('user_referral_contest', 'user_referral_contest.id', 'user_referral_contest_entry.contest_id').limit(1);
        if (!contestData) {
            throw new this.NotFound('NotFound');
        }
        else {
            if (contestData.ended_at !== null) {
                return {
                    hasContestEnded: true,
                    hasEnteredContest: true,
                    contestId: contestData.contestId,
                };
            }
            else {
                return {
                    hasContestEnded: false,
                    hasEnteredContest: true,
                    contestId: contestData.contestId,
                };
            }
        }
    }
    async getLatestContestId() {
        let [latestContest] = await this.knex('user_referral_contest').select('id').where('ended_at', '=', null).limit(1).orderBy('id', 'desc');
        if (!latestContest) {
            throw new this.NotFound('NoContestAvailable');
        }
        return latestContest.contest_id;
    }
    async createReferralEntry(userId, referralId, type) {
        const latestContest = await this.getLatestContestId();
        await this.knex('user_referral_contest_entry').insert({
            'contest_id': latestContest,
            'referral_id': referralId,
            'user_id': userId,
            'type': type,
        });
    }
}
exports.default = UserReferralDAL;

