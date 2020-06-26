import { PropertyType, Required, AllowTypes } from "@tsed/common";
import { Description } from "@tsed/swagger";

export enum ModerationStatus {
    'Pending' = 0,
    'Approved' = 1,
    'Declined' = 2,
}

export enum AdType {
    'CatalogItem' = 1,
    'Group' = 2,
    'ForumThread' = 3,
}

export enum AdDisplayType {
    'Leaderboard' = 1,
    'Skyscraper',
}

export class Advertisement {
    @PropertyType(Number)
    adId: number;
    @PropertyType(String)
    imageUrl: string;
    @PropertyType(String)
    title: string;
}

export class ExpandedAdvertisementDetails {
    adType: number;
    adRedirectId: number;
}

export class AdClickResponse {
    @PropertyType(String)
    url: string;
}

export class FullAdvertisementDetails {
    @Required()
    adId: number;
    @AllowTypes('string','null')
    @PropertyType(String)
    @Description('This value will be null if moderation has declined the image or it is pending approval')
    imageUrl: string|null;
    @Required()
    title: string;
    @Required()
    adType: AdType;
    @Required()
    adRedirectId: number;
    @Required()
    moderationStatus: ModerationStatus;
    @Required()
    userId: number;
    @Required()
    bidAmount: number;
    @Required()
    totalBidAmount: number;
    @Required()
    hasRunBefore: boolean;
    @Required()
    updatedAt: string;
    @Required()
    createdAt: string;
    @Required()
    views: number;
    @Required()
    totalViews: number;
    @Required()
    clicks: number;
    @Required()
    totalClicks: number;
    @Required()
    adDisplayType: AdDisplayType;
}