import {Default, MaxItems, MinItems, PropertyType, Required} from "@tsed/common";
import {Description, Summary} from "@tsed/swagger";

export enum Permission {
    'BanUser' = 1,
    'UnbanUser',
    'ManageGroup',
    'ViewEmail',
    'ViewPaymentInformation',
    'ManageStaff',
    'ImpersonateUser',
    'ManageSupportTickets',
    'ReviewPendingItems',
    'ReviewAbuseReports',
    'ReviewUserInformation',
    'UploadStaffAssets',
    /**
     * Allows user to manage other staff, as well as their self
     */
    'ManageSelf',
    'ResetPassword',
    'GiveItemToUser',
    'GiveCurrencyToUser',
    'TakeItemFromUser',
    'TakeCurrencyFromUser',
    'ManageAssets',
    'RegenerateThumbnails',
    'ManageBanner',
    'ManagePublicUserInfo',
    'ManagePrivateUserInfo',
    'ManageWeb',
    'ManageGameServer',
    'ManageGameClient',
    'ManageForumCategories',
    'ManageCurrencyProducts',
}

export interface UserModerationHistory {
    userId: number;
    reason: string;
    date: string;
    untilUnbanned: string;
    isTerminated: 0|1;
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

export class ProvideItemsRequest {
    @Required()
    @Description('userId to give the items to')
    userIdTo: number;
    @Required()
    @Description('An array of {catalogId} to transfer to the user')
    @PropertyType(Number)
    @MinItems(1)
    @MaxItems(1000)
    catalogIds: number[]
}