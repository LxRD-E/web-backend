/**
 * Moderation Action recorded in the user_moderation table
 */
export interface ModerationAction {
    id: number;
    userId: number;
    reason: string;
    date: string;
    untilUnbanned: Record<string, any>;
    terminated: terminated;
    unlock: boolean;
    isEligibleForAppeal: boolean;
}
/**
 * If a ban terminates a user's account
 */
export enum terminated {
    true = 1,
    false = 0,
}
