import {PropertyType, Required} from "@tsed/common";
import {Description, Summary} from "@tsed/swagger";

export class UserReferralInfo {
    @Required()
    referralId: number;
    @Required()
    userId: number;
    @Required()
    createdAt: string;
    @Required()
    updatedAt: string;
}

export class ExtendedUserReferralInfo extends UserReferralInfo {
    @Required()
    @Description('Amount of times the code has been used')
    uses: number;
}

class UserReferralUse {
    @Required()
    referralId: number;
    @Required()
    userId: number;
    @Required()
    createdAt: string;
}

export class UserReferralUseResult {
    @Required()
    areMoreAvailable: boolean;
    @Required()
    @PropertyType(UserReferralUse)
    data: UserReferralUse[];
}

export enum ContestEntryType {
    'ReferredBySomeone' = 1,
    'ReferredSomeone',
}

export class UserReferralContestEntry {
    @Required()
    hasEnteredContest: boolean;
    @Required()
    hasContestEnded: boolean;
    @Required()
    contestId: number;
}