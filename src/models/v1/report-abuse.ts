import { Required } from "@tsed/common";

export enum ReportReason {
    'Inappropriate Language' = 1,
    'Asking for or Giving Private Information',
    'Bullying, Harassment, Discrimination',
    'Dating',
    'Exploiting, Cheating, Scamming',
    'Account Theft - Phishing, Hacking, Trading',
    'Inappropriate Content - Place, Image, Model',
    'Real Life Threats & Suicide Threats',
    'Other rule violation',
}

export enum ReportStatus {
    'PendingReview' = 1,
    'ValidReport' = 2,
    'InvalidReport' = 3,
}

export class ReportedStatusEntry {
    @Required()
    reportId: number;
    @Required()
    reportUserId: number;
    @Required()
    userStatusId: number;
    @Required()
    reportReason: ReportReason;
    @Required()
    reportStatus: ReportStatus;
    @Required()
    createdAt: string;
    @Required()
    status: string;
    @Required()
    userId: number;
}