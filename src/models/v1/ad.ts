import { PropertyType } from "@tsed/common";

export enum ModerationStatus {
    'Pending' = 0,
    'Approved' = 1,
    'Declined' = 2,
}

export enum AdType {
    'CatalogItem' = 1,
    'Group' = 2,
}

export enum AdDisplayType {
    'Leaderboard' = 1,
}

export class Advertisment {
    @PropertyType(Number)
    adId: number;
    @PropertyType(String)
    imageUrl: string;
    @PropertyType(String)
    title: string;
}

export class ExpandedAdvertismentDetails {
    adType: number;
    adRedirectId: number;
}

export class AdClickResponse {
    @PropertyType(String)
    url: string;
}

export class FullAdvertismentDetails {
    adId: number;
    imageUrl: string|null;
    title: string;
    adType: AdType;
    adRedirectId: number;
    moderationStatus: ModerationStatus;
    userId: number;
    bidAmount: number;
    totalBidAmount: number;
    hasRunBefore: boolean;
    updatedAt: string;
    createdAt: string;
    views: number;
    totalViews: number;
    clicks: number;
    totalClicks: number;
}