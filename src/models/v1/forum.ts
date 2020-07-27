/**
 * Enums
 */
import {Required} from "@tsed/common";

export enum postDeleted {
    false = 0,
    true = 1,
    'moderated',
}
export enum threadDeleted {
    false = 0,
    true = 1,
    'moderated',
}
export enum threadLocked {
    false = 0,
    true = 1,
}
export enum threadPinned {
    false = 0,
    true = 1,
}
/**
 * Interfaces
 */
export interface Categories {
    categoryId: number;
    title: string;
    description: string;
    weight: number;
}
export interface SubCategories {
    subCategoryId: number;
    categoryId: number;
    title: string;
    description: string;
    permissions: {
        read: number;
        post: number;
    };
    weight: number;
}
export class PostSnippet {
    @Required()
    threadId: number;
    @Required()
    userId: number;
    @Required()
    dateCreated: string;
}
export class ForumThreadsAndPostsCount {
    @Required()
    threads: number;
    @Required()
    posts: number;
}
export interface Threads {
    threadId: number;
    title: string;
    userId: number;
    threadPinned: threadPinned;
    latestReply: string;
    postCount: number;
}
export class Thread {
    @Required()
    threadId: number;
    @Required()
    categoryId: number;
    @Required()
    subCategoryId: number;
    @Required()
    title: string;
    @Required()
    userId: number;
    @Required()
    dateCreated: string;
    @Required()
    dateEdited: string;
    @Required()
    threadLocked: threadLocked;
    @Required()
    threadDeleted: threadDeleted;
    @Required()
    threadPinned: threadPinned;
}
export interface Posts {
    subCategoryId: number;
    threadId: number;
    userId: number;
    dateCreated: string;
    dateEdited: string;
    body: string;
    postDeleted: postDeleted;
    postId: number;
}