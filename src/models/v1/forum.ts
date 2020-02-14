/**
 * Enums
 */
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
export interface PostSnippet {
    threadId: number;
    userId: number;
    dateCreated: string;
}
export interface Threads {
    threadId: number;
    title: string;
    userId: number;
    threadPinned: threadPinned;
    latestReply: string;
    postCount: number;
}
export interface Thread {
    threadId: number;
    categoryId: number;
    subCategoryId: number;
    title: string;
    userId: number;
    dateCreated: string;
    dateEdited: string;
    threadLocked: threadLocked;
    threadDeleted: threadDeleted;
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