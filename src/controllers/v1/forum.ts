/**
 * Imports
 */
// Models
import * as model from '../../models/models';
// Errors
// import ForumError from './error';
// Filters
import {filterId, filterLimit, filterOffset, filterSort} from '../../helpers/Filter';
// Autoload
import {
    BodyParams,
    Controller,
    Delete,
    Get,
    Locals,
    Patch,
    PathParams,
    Post,
    Put,
    QueryParams,
    Required,
    Use,
    UseBefore,
    UseBeforeEach
} from '@tsed/common';
import controller from '../controller';
import {Returns, ReturnsArray, Summary} from '@tsed/swagger';
import {csrf} from '../../dal/auth';
import {YesAuth} from '../../middleware/Auth';
import {VerifyPagingInfo} from "../../middleware/VerifyLegacyPagingInfo";

/**
 * Groups Controller
 */
@Controller('/forum')
export class ForumController extends controller {

    constructor() {
        super();
    }
    /**
     * Get Forum Categories
     */
    @Get('/categories')
    @Summary('Get forum categories')
    public async getCategories(): Promise<model.forum.Categories[]> {
        return await this.forum.getCategories();
    }
    /**
     * Get the Sub Categories
     */
    @Get('/subcategories')
    @Summary('Get forum subcategories')
    public async getSubCategories(
        @Locals('userInfo') userInfo?: model.user.UserInfo,
    ): Promise<{
        'subCategoryId': number;
        'categoryId': number;
        'title': string;
        'description': string;
        'permissions': {
            read: number;
            post: number;
        };
        'latestPost': model.forum.PostSnippet;
        'threadCount': number;
        'postCount': number;
    }[]> {
        let rank = 0;
        if (userInfo) {
            rank = userInfo.staff;
        }
        const subCategories = await this.forum.getSubCategories(rank);
        const expandedSubCategories = [];
        for (const sub of subCategories) {
            const postCount = await this.forum.getPostCount(sub.subCategoryId);
            const threadCount = await this.forum.getThreadCount(sub.subCategoryId);
            const latestPost = await this.forum.getLatestPost(sub.subCategoryId);
            expandedSubCategories.push({
                'subCategoryId': sub.subCategoryId,
                'categoryId': sub.categoryId,
                'title': sub.title,
                'description': sub.description,
                'permissions': sub.permissions,
                'latestPost': latestPost,
                'threadCount': threadCount,
                'postCount': postCount,
            });
        }
        return expandedSubCategories;
    }

    @Get('/:subCategoryId/latest-post')
    @Summary('Get the latest post for the {subCategoryId}')
    @Returns(200, {type: model.forum.PostSnippet})
    public async getLatestPost(
        @PathParams('subCategoryId', Number) subCategoryId: number,
    ) {
        return await this.forum.getLatestPost(subCategoryId);
    }

    @Get('/:subCategoryId/count')
    @Summary('Count all posts and threads for the {subCategoryId}')
    @Returns(200, {type: model.forum.ForumThreadsAndPostsCount})
    public async countPostsAndThreads(
        @PathParams('subCategoryId', Number) subCategoryId: number,
    ) {
        const [threads, posts] = await Promise.all([this.forum.getThreadCount(subCategoryId), this.forum.getPostCount(subCategoryId)]);
        return {
            threads,
            posts,
        }
    }

    @Get('/:subCategoryId/latest-threads')
    @Summary('Get the latest thread snippet for the {subCategoryId}')
    @Use(VerifyPagingInfo)
    @ReturnsArray(200, {type: model.forum.Thread})
    public async getLatestThreads(
        @PathParams('subCategoryId', Number) subCategoryId: number,
        @QueryParams('limit', Number) limit: number = 5,
    ) {
        return await this.forum.getLatestThreads(limit);
    }

    @Get('/thread/:threadId/info')
    @Summary('Get thread info by the {threadId}')
    @Returns(200, {type: model.forum.Thread})
    public async getThreadById(
        @PathParams('threadId', Number) threadId: number,
    ) {
        return await this.forum.getThreadById(threadId);
    }


    /**
     * Get a Subcategory's Threads
     * @param subCategoryId 
     */
    @Get('/:subCategoryId/threads')
    @Summary('Get forum threads by subCategoryId')
    public async getThreads(
        @PathParams('subCategoryId') subCategoryId: string,
        @QueryParams('offset', Number) offset?: string,
        @QueryParams('limit', Number) limit?: string,
        @QueryParams('sort', String) sort?: string,
        @Locals('userInfo') userInfo?: model.user.UserInfo,
    ): Promise<{
        total: number;
        threads: model.forum.Threads[];
    }> {
        const numericOffset = filterOffset(offset);
        const numericLimit = filterLimit(limit);
        const goodSort = filterSort(sort);
        const numericId = filterId(subCategoryId) as number;
        if (!numericId) {
            throw new this.BadRequest('InvalidSubCategoryId');
        }
        let rank = 0;
        if (userInfo) {
            rank = userInfo.staff;
        }
        let subData: model.forum.SubCategories;
        try {
            subData = await this.forum.getSubCategoryById(numericId);
            if (subData.permissions.read > rank) {
                throw false;
            }
        } catch (e) {
            throw new this.BadRequest('InvalidSubCategoryId');
        }
        // Grab posts
        const Threads = await this.forum.getThreads(numericId, numericOffset, numericLimit, goodSort);
        const ThreadsCount = await this.forum.getThreadCount(numericId);
        return {
            'total': ThreadsCount,
            'threads': Threads,
        };
    }

    /**
     * Get a Thread's Posts (aka replies)
     */
    @Get('/thread/:threadId/posts')
    @Summary('Get posts (aka replies) to a thread')
    public async getPosts(
        @PathParams('threadId', Number) threadId: string,
        @QueryParams('offset', Number) offset?: string,
        @QueryParams('limit', Number) limit?: string,
        @QueryParams('sort', String) sort?: string,
        @Locals('userInfo') userInfo?: model.user.UserInfo,
    ): Promise<{
        total: number;
        posts: model.forum.Posts[];
    }> {
        const numericOffset = filterOffset(offset);
        const numericLimit = filterLimit(limit);
        const goodSort = filterSort(sort);
        const numericId = filterId(threadId) as number;
        if (!numericId) {
            throw new this.BadRequest('InvalidThreadId');
        }
        let rank = 0;
        if (userInfo) {
            rank = userInfo.staff;
        }
        let threadData;
        try {
            threadData = await this.forum.getThreadById(numericId);
        } catch (e) {
            throw new this.BadRequest('InvalidThreadId');
        }
        let subData;
        try {
            subData = await this.forum.getSubCategoryById(threadData.subCategoryId);
            if (subData.permissions.read > rank) {
                throw false;
            }
        } catch (e) {
            throw new this.BadRequest('InvalidSubCategoryId');
        }
        // Grab posts
        const Posts = await this.forum.getThreadPosts(numericId, numericOffset, numericLimit, goodSort);
        const PostsCount = await this.forum.countThreadPosts(numericId);
        return {
            'total': PostsCount,
            'posts': Posts,
        };
    }

    /**
     * Create a Thread
     */
    @Put('/thread/create')
    @Summary('Create a thread. locked and pinned are ignored if user is not moderator+')
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async createThread(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @BodyParams('subCategoryId', Number) subCategoryId: number,
        @Required()
        @BodyParams('title', String) title: string,
        @Required()
        @BodyParams('body', String) body: string,
        @BodyParams('locked', Number) locked: number = 0,
        @BodyParams('pinned', Number) pinned: number = 0
    ): Promise<{ success: true; threadId: number }> {
        const numericId = filterId(subCategoryId) as number;
        if (!numericId) {
            throw new this.BadRequest('InvalidSubCategoryId');
        }
        let rank = 0;
        if (userInfo) {
            rank = userInfo.staff;
        }
        let subData;
        try {
            subData = await this.forum.getSubCategoryById(numericId);
            if (subData.permissions.post > rank) {
                throw false;
            }
        } catch (e) {
            throw new this.BadRequest('InvalidSubCategoryId');
        }
        let isLocked = filterId(locked) as number;
        let isPinned = filterId(pinned) as number;
        if (rank < 1) {
            isLocked = 0;
            isPinned = 0;
        }
        if (isLocked !== 0 && isLocked !== 1) {
            isLocked = 0;
        }
        if (isPinned !== 0 && isPinned !== 1) {
            isPinned = 0;
        }
        if (!title || title.length > 64) {
            throw new this.BadRequest('InvalidTitle');
        }
        if (!body || body.length > 4096) {
            throw new this.BadRequest('InvalidBody');
        }
        const titleWithoutWhiteSpace = title.replace(/ /g, '');
        const bodyWithoutWhiteSpace = body.replace(/ /g, '');
        if (titleWithoutWhiteSpace.length < 3) {
            throw new this.BadRequest('InvalidTitle');
        }
        if (bodyWithoutWhiteSpace.length < 3) {
            throw new this.BadRequest('InvalidBody');
        }
        // Create thread
        let threadId: number;
        try {
            threadId = await this.forum.createThread(subData.categoryId, subData.subCategoryId, title, userInfo.userId, isLocked, isPinned, body)
        }catch(e) {
            if (e.message) {
                if (e.message === 'Cooldown') {
                    throw new this.Conflict('Cooldown');
                }
            }
            throw e;
        }
        // broadcast
        this.event.forum.submitEvent('createThread', {userId: userInfo.userId, threadId: threadId});
        // Return success
        return {
            'success': true,
            'threadId': threadId,
        };
    }

    /**
     * Create a Post
     */
    @Put('/thread/:threadId/reply')
    @Summary('Reply to a threadId')
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async createPost(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('threadId', Number) threadId: number,
        @Required()
        @BodyParams('body', String) body: string
    ): Promise<{ success: true; postId: number }> {
        const numericId = filterId(threadId) as number;
        if (!numericId) {
            throw new this.BadRequest('InvalidThreadId');
        }
        let rank = 0;
        if (userInfo) {
            rank = userInfo.staff;
        }
        let threadData;
        try {
            threadData = await this.forum.getThreadById(numericId);
        } catch (e) {
            throw new this.BadRequest('InvalidThreadId');
        }
        if (threadData.threadLocked === model.forum.threadLocked.true) {
            throw new this.BadRequest('ThreadLocked');
        }
        let subData;
        try {
            subData = await this.forum.getSubCategoryById(threadData.subCategoryId);
            if (subData.permissions.post > rank) {
                throw false;
            }
        } catch (e) {
            throw new this.BadRequest('InvalidThreadId');
        }
        if (!body || body.length > 4096) {
            throw new this.BadRequest('Invalidbody');
        }
        const bodyWithoutWhiteSpace = body.replace(/ /g, '');
        if (bodyWithoutWhiteSpace.length < 3) {
            throw new this.BadRequest('InvalidBody');
        }
        // Create Post (aka body)
        let postId: number;
        try {
            postId = await this.forum.createPost(numericId, subData.categoryId, subData.subCategoryId, userInfo.userId, body);
        }catch(e) {
            if (e.message) {
                if (e.message === 'Cooldown') {
                    throw new this.BadRequest('Cooldown');
                }
            }
            throw e;
        }
        // Broadcast
        this.event.forum.submitEvent('createPost', {userId: userInfo.userId, postId: postId});
        // Return success
        return {
            'success': true,
            'postId': postId,
        };
    }

    /**
     * Delete a Post
     */
    @Delete('/post/:postId')
    @Summary('Delete a post. Must be creator or moderator')
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async deletePost(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('postId', Number) postId: string
    ): Promise<{ success: true; postId: number }> {
        const numericId = filterId(postId) as number;
        if (!numericId) {
            throw new this.BadRequest('InvalidPostId');
        }
        let rank = 0;
        if (userInfo) {
            rank = userInfo.staff;
        }
        let postData;
        try {
            postData = await this.forum.getPostById(numericId);
        } catch (e) {
            throw new this.BadRequest('InvalidPostId');
        }
        if (postData.userId !== userInfo.userId && rank < 1) {
            throw new this.BadRequest('InvalidPostId');
        }
        if (postData.postDeleted === model.forum.postDeleted.moderated && rank < 1) {
            throw new this.BadRequest('InvalidPostId');
        }
        // Delete post
        let deleted = model.forum.postDeleted.true;
        if (rank < 1) {
            deleted = model.forum.postDeleted.moderated;
        }
        await this.forum.updatePostStatus(numericId, deleted);
        // Return success
        return {
            'success': true,
            'postId': numericId,
        };
    }

    /**
     * Delete a Thread
     */
    @Delete('/thread/:threadId')
    @Summary('Delete a thread. Must have mod perms or be creator')
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async deleteThread(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('threadId', Number) threadId: number
    ): Promise<{ success: true; threadId: number }> {
        const numericId = filterId(threadId) as number;
        if (!numericId) {
            throw new this.BadRequest('InvalidThreadId');
        }
        let rank = 0;
        if (userInfo) {
            rank = userInfo.staff;
        }
        let threadData;
        try {
            threadData = await this.forum.getThreadById(numericId);
        } catch (e) {
            throw new this.BadRequest('InvalidThreadId');
        }
        if (threadData.userId !== userInfo.userId && rank < 1) {
            throw new this.BadRequest('InvalidThreadId');
        }
        if (threadData.threadDeleted === model.forum.threadDeleted.moderated && rank < 1) {
            throw new this.BadRequest('InvalidThreadId');
        }
        // Delete post
        let deleted = model.forum.threadDeleted.true;
        if (rank < 1) {
            deleted = model.forum.threadDeleted.moderated;
        }
        await this.forum.updateThreadStatus(numericId, deleted);
        // Return success
        return {
            'success': true,
            'threadId': threadData.threadId,
        };
    }

    /**
     * Undelete a Post
     */
    @Post('/post/:postId/undelete')
    @Summary('Undelete a post/reply')
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async unDeletePost(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('postId', Number) postId: string
    ): Promise<{ success: true; postId: number }> {
        const numericId = filterId(postId) as number;
        if (!numericId) {
            throw new this.BadRequest('InvalidPostId');
        }
        let rank = 0;
        if (userInfo) {
            rank = userInfo.staff;
        }
        let postData;
        try {
            postData = await this.forum.getPostById(numericId);
        } catch (e) {
            throw new this.BadRequest('InvalidPostId');
        }
        if (postData.userId !== userInfo.userId && rank < 1) {
            throw new this.BadRequest('InvalidPostId');
        }
        if (postData.postDeleted === model.forum.postDeleted.moderated && rank < 1) {
            throw new this.BadRequest('InvalidPostId');
        }
        // Delete post
        await this.forum.updatePostStatus(numericId, model.forum.postDeleted.false);
        // Return success
        return {
            'success': true,
            'postId': numericId,
        };
    }

    /**
     * Undelete a Thread
     */
    @Post('/thread/:threadId/undelete')
    @Summary('Un-delete a deleted thread')
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async unDeleteThread(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('threadId', Number) threadId: number
    ): Promise<{ success: true; threadId: number }> {
        const numericId = filterId(threadId) as number;
        if (!numericId) {
            throw new this.BadRequest('InvalidThreadId');
        }
        let rank = 0;
        if (userInfo) {
            rank = userInfo.staff;
        }
        let threadData;
        try {
            threadData = await this.forum.getThreadById(numericId);
        } catch (e) {
            throw new this.BadRequest('InvalidThreadId');
        }
        if (threadData.userId !== userInfo.userId && rank < 1) {
            throw new this.BadRequest('InvalidThreadId');
        }
        if (threadData.threadDeleted === model.forum.threadDeleted.moderated && rank < 1) {
            throw new this.BadRequest('InvalidThreadId');
        }
        // Delete post
        await this.forum.updateThreadStatus(numericId, model.forum.threadDeleted.false);
        // Return success
        return {
            'success': true,
            'threadId': threadData.threadId,
        };
    }

    /**
     * Update a Thread's Locked and Pinned states
     * @param threadId 
     * @param isLocked 
     * @param isPinned 
     */
    @Patch('/thread/:threadId/update')
    @Summary('Update a thread locked & pinned state. Ignored if not moderator')
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async updateThread(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @PathParams('threadId', Number) threadId: number,
        @Required()
        @BodyParams('isLocked', Number) isLocked: number,
        @Required()
        @BodyParams('isPinned', Number) isPinned: number
    ): Promise<{ success: true }> {
        let postData;
        try {
            postData = await this.forum.getThreadById(threadId);
        } catch (e) {
            throw new this.BadRequest('InvalidThreadId');
        }
        if (postData.userId !== userInfo.userId) {
            throw new this.BadRequest('InvalidPermissions');
        }
        if (userInfo.staff < 1) {
            throw new this.BadRequest('InvalidPermissions');
        }
        if (isLocked !== 1 && isLocked !== 0) {
            throw new this.BadRequest('InvalidLockedState');
        }
        if (isPinned !== 1 && isPinned !== 0) {
            throw new this.BadRequest('InvalidPinnedState');
        }
        // Update
        await this.forum.updateThreadStates(threadId, isPinned, isLocked);
        // Return Success
        return {
            'success': true,
        };
    }

    /**
     * Update a Post
     */
    @Patch('/post/:postId/')
    @Summary('Update a post')
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async updatePost(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('postId', Number) postId: string,
        @Required()
        @BodyParams('body', String) newBody: string
    ) {
        const numericId = filterId(postId) as number;
        if (!numericId) {
            throw new this.BadRequest('InvalidThreadId');
        }
        let postData;
        try {
            postData = await this.forum.getPostById(numericId);
        } catch (e) {
            throw new this.BadRequest('InvalidThreadId');
        }
        if (postData.userId !== userInfo.userId) {
            throw new this.BadRequest('InvalidThreadId');
        }
        if (!newBody || newBody.length > 4096) {
            throw new this.BadRequest('InvalidBody');
        }
        const bodyWithoutWhiteSpace = newBody.replace(/ /g, '');
        if (bodyWithoutWhiteSpace.length < 3) {
            throw new this.BadRequest('InvalidBody');
        }
        // Update post
        await this.forum.updatePostBody(numericId, newBody);
        return {
            'success': true,
            'postId': numericId,
        };
    }

    /**
     * Search Forum Threads
     * @param query 
     * @param offset 
     * @param limit 
     * @param sort 
     */
    @Get('/threads/search')
    @Summary('Search forum threads')
    public async searchThreads(
        @QueryParams('q', String) query: string,
        @QueryParams('offset', Number) offset?: number,
        @QueryParams('limit', Number) limit?: string
    ): Promise<model.forum.Threads[]> {
        const numericOffset = filterOffset(offset);
        const numericLimit = filterLimit(limit);
        if (query.length >= 32) {
            throw new this.BadRequest('InvalidQuery');
        }
        query = query.replace(/%/g, '\%');
        const results = await this.forum.searchThreads(query, numericOffset, numericLimit);
        return results;
    }
}
