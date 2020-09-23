import { Default, MaxItems, MinItems, PropertyType, Required } from "@tsed/common";
import { Description, Summary } from "@tsed/swagger";

export enum Permission {
    /**
     * Ban a user
     */
    'BanUser' = 1,
    /**
     * Unban a user
     */
    'UnbanUser',
    /**
     * Lock/unlock groups
     */
    'ManageGroup',
    /**
     * View emails for multiple users at once
     */
    'ViewEmail',
    /**
     * View payment information for all users
     */
    'ViewPaymentInformation',
    /**
     * Manage other staff
     */
    'ManageStaff',
    /**
     * Impersonate users
     */
    'ImpersonateUser',
    /**
     * Manage support tickets
     */
    'ManageSupportTickets',
    /**
     * Review and manage items awaiting staff review
     */
    'ReviewPendingItems',
    /**
     * Review and manage abuse reports
     */
    'ReviewAbuseReports',
    /**
     * Review information of all users, such as through the search functions
     */
    'ReviewUserInformation',
    /**
     * Upload staff assets to the system account, such as hats
     */
    'UploadStaffAssets',
    /**
     * Allows user to manage other staff, as well as their self
     */
    'ManageSelf',
    /**
     * Reset the password for a user
     */
    'ResetPassword',
    /**
     * Give item(s) to a user
     */
    'GiveItemToUser',
    /**
     * Give currency to a user
     */
    'GiveCurrencyToUser',
    /**
     * Take item(s) from a user
     */
    'TakeItemFromUser',
    /**
     * Take currency from a user
     */
    'TakeCurrencyFromUser',
    /**
     * Manage assets not owned by the current user
     */
    'ManageAssets',
    /**
     * Force a thumbnail to be regenerated
     */
    'RegenerateThumbnails',
    /**
     * Enable, edit, and disable the banner
     */
    'ManageBanner',
    /**
     * Manage/view public user information, such as the username, trades, transactions, etc
     */
    'ManagePublicUserInfo',
    /**
     * Manage/view private user information, such as emails, two factor enable/disable, etc
     */
    'ManagePrivateUserInfo',
    /**
     * Manage/view web services like secrets, system status, reload servers, logs, deploy stuff
     */
    'ManageWeb',
    'ManageGameServer',
    'ManageGameClient',
    /**
     * Enable, disable, create, update, and delete forum categories
     */
    'ManageForumCategories',
    /**
     * Create, update, and delete currency products
     */
    'ManageCurrencyProducts',
}

export interface UserModerationHistory {
    userId: number;
    reason: string;
    date: string;
    untilUnbanned: string;
    isTerminated: 0 | 1;
    privateReason: string;
    actorUserId: number;
}
interface MemoryUsage {
    gigabytes: {
        total: number;
        free?: number;
        used: number;
    };
    percentUsed: number;
}

export interface SystemUsageStats {
    system: {
        memory: MemoryUsage;
        hostname: string;
    };
    node: {
        memory: MemoryUsage;
        mysql: {
            pendingCreates: number;
            numUsed: number;
            numFree: number;
            numPendingAcquires: number;
        };
    };
}

export interface UserComment {
    userCommentId: number;
    userId: number;
    staffUserId: number;
    createdAt: string;
    comment: string;
}

export enum ReasonForAssociation {
    'SameIpaddress' = 1,
    'SameEmail',
    'SameBillingEmail',
}

export class TransferItemsRequest {
    @Required()
    @Description('The userId that the items are expected to be owned by')
    @Default(50)
    userIdFrom: number;
    @Required()
    @Description('The userId to transfer the item(s) from')
    userIdTo: number;
    @Required()
    @PropertyType(Number)
    @MinItems(1)
    @MaxItems(100)
    @Description('An array of {userInventoryId} to transfer')
    userInventoryIds: number[];
}

export class ProvideItemsEntry {
    @Required()
    catalogId: number;
}

export class ProvideItemsRequest {
    @Required()
    @Description('userId to give the items to')
    userIdTo: number;
    @Required()
    @Description('An array of {catalogId} to transfer to the user')
    @PropertyType(ProvideItemsEntry)
    @MinItems(1)
    @MaxItems(1000)
    catalogIds: ProvideItemsEntry[]
}

export class SearchUsersResponse {
    @Required()
    username: string;
    @Required()
    userId: number;
}

export const UserLeadboardSortOptions = [
    "PrimaryCurrencyDesc",
    "SecondaryCurrencyDesc",
    "UserIdAsc",
    'LastOnlineAsc',
    'LastOnlineDesc',
]

export const UserLeaderboardAccountStatus = [
    'all',
    'ok',
    'banned',
    'terminated',
    'deleted',
]

export class ModerationCurrencyEntry {
    @Required()
    moderationCurrencyId: number;
    @Required()
    userIdGiver: number;
    @Required()
    userIdReceiver: number;
    @Required()
    amount: number;
    @Required()
    currency: number;
    @Required()
    date: string;
}