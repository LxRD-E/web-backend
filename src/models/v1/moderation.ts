/**
 * Moderation Action recorded in the user_moderation table
 */
import {Required} from "@tsed/common";

export class ModerationAction {
    @Required()
    id: number;
    @Required()
    userId: number;
    @Required()
    reason: string;
    @Required()
    date: string;
    @Required()
    untilUnbanned: Record<string, any>;
    @Required()
    terminated: terminated;
    @Required()
    unlock: boolean;
    @Required()
    isEligibleForAppeal: boolean;
}
/**
 * If a ban terminates a user's account
 */
export enum terminated {
    true = 1,
    false = 0,
}
