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