import _init from "./_init";
import * as model from '../models/models';

class UserReferralDAL extends _init {

    /**
     * Get referral info by ID
     * @param referralId
     */
    public async getInfoById(referralId: number): Promise<model.userReferral.UserReferralInfo> {
        const result = await this.knex('user_referral').select(
            'id as referralId',
            'user_id as userId',
            'created_at as createdAt',
            'updated_at as updatedAt',
        ).limit(1).where({
            'id': referralId,
        });
        if (!result[0]) {
            throw new this.NotFound('InvalidReferralId');
        }
        return result[0];
    }

    /**
     * Get the referral code used by the {userId}, if any
     * @param userId
     */
    public async getReferralUsedByUser(userId: number): Promise<model.userReferral.UserReferralInfo> {
        const result = await this.knex('user_referral_use').select(
            'referral_id as referralId',
            'user_referral_use.user_id as request_user_id',
            'user_referral.created_at as createdAt',
            'user_referral.updated_at as updatedAt',
            'user_referral.user_id as userId',
        ).where({
            'user_referral_use.user_id': userId,
        }).innerJoin(
            'user_referral',
            'user_referral.id',
            'user_referral_use.referral_id',
        )
        if (!result[0]) {
            throw new this.NotFound('NotFound');
        }
        delete result[0]['request_user_id'];
        return result[0];
    }

    /**
     * Get referral code uses
     * @param referralId
     * @param offset
     * @param limit
     */
    public async getReferralCodeUses(referralId: number, offset: number = 0, limit: number = 100): Promise<model.userReferral.UserReferralUseResult> {
        const uses = await this.knex('user_referral_use').select(
            'user_referral_use.referral_id as referralId',
            'user_referral_use.user_id as userId',
            'user_referral_use.created_at as createdAt',
        ).where({
            'user_referral_use.referral_id': referralId,
        }).limit(limit+1).offset(offset)
        return {
            areMoreAvailable: uses.length > limit,
            data: uses.slice(0, limit),
        } as model.userReferral.UserReferralUseResult;
    }

    /**
     * Create a referral code for the {userId}
     * @param userId
     */
    public async createReferralCode(userId: number): Promise<model.userReferral.UserReferralInfo> {
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
        }catch(err) {
            // duplicate entry
            if (err && err.errno === 1062) {
                throw new this.Conflict('ReferralAlreadyExists');
            }
            throw err;
        }
    }

    /**
     * Get the referral code created by the {userId}
     * @param userId
     */
    public async getReferralCodeCreatedByUser(userId: number): Promise<model.userReferral.ExtendedUserReferralInfo> {
        const [result] = await this.knex('user_referral').select(
            'id as referralId',
            'user_id as userId',
            'created_at as createdAt',
            'updated_at as updatedAt',
        ).limit(1).where({
            'user_id': userId,
        });
        if (!result) {
            throw new this.NotFound('NotFound');
        }
        // count uses
        result.uses = await this.knex('user_referral_use').count('id as total').where({
            'referral_id': result.referralId,
        });
        result.uses = result.uses[0]['total'];
        // return
        return result;
    }

    /**
     * Register a referral code for the {userId}
     * @param userId
     * @param referralId
     */
    public async registerReferralCodeUseForUser(userId: number, referralId: number): Promise<void> {
        await this.knex('user_referral_use').insert({
            'referral_id': referralId,
            'user_id': userId,
        });
    }

    public async getReferralContestStatusForUser(userId: number): Promise<model.userReferral.UserReferralContestEntry> {
        // ideas:
        // boolean on user_referral_use - has_entered_contest, has_contest_ended
        // new tables: user_referral_contests (id, has_ended, created_at, updated_at) and user_referral_contest_entries (id, contest_id, referral_id, user_id)
        const [contestData] = await this.knex('user_referral_contest_entry').select(
            'user_referral_contest_entry.contest_id as contestId',
            'user_referral_contest_entry.type',
            'user_referral_contest.ended_at',
        ).where({
            'type': model.userReferral.ContestEntryType.ReferredBySomeone,
            'user_referral_contest_entry.user_id': userId,
        }).innerJoin('user_referral_contest', 'user_referral_contest.id','user_referral_contest_entry.contest_id').limit(1);
        if (!contestData) {
            throw new this.NotFound('NotFound');
        }else{
            if (contestData.ended_at !== null) {
                return {
                    hasContestEnded: true,
                    hasEnteredContest: true,
                    contestId: contestData.contestId,
                }
            }else{
                return {
                    hasContestEnded: false,
                    hasEnteredContest: true,
                    contestId: contestData.contestId,
                }
            }
        }
    }

    /**
     * Get the latest active {contestId}
     * @throws {this.NotFound} NoContestAvailable - No contest is available
     */
    public async getLatestContestId(): Promise<number> {
        let [latestContest] = await this.knex('user_referral_contest').select('id').where('ended_at','=',null).limit(1).orderBy('id','desc');
        if (!latestContest) {
            throw new this.NotFound('NoContestAvailable');
        }
        return latestContest.contest_id;
    }

    /**
     * Create a contest entry for the current active contest
     * @param userId
     * @param referralId
     * @param type
     * @throws {this.NotFound} NoContestAvailable - No contest is available
     */
    public async createReferralEntry(userId: number, referralId: number, type: model.userReferral.ContestEntryType): Promise<void> {
        const latestContest = await this.getLatestContestId();
        await this.knex('user_referral_contest_entry').insert({
            'contest_id': latestContest,
            'referral_id': referralId,
            'user_id': userId,
            'type': type,
        })
    }
}
export default UserReferralDAL;