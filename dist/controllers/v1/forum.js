"use strict";
/* istanbul ignore next */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
/* istanbul ignore next */
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
/* istanbul ignore next */
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
/* istanbul ignore next */
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/* istanbul ignore next */
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const model = require("../../models/models");
const Filter_1 = require("../../helpers/Filter");
const common_1 = require("@tsed/common");
const controller_1 = require("../controller");
const swagger_1 = require("@tsed/swagger");
const auth_1 = require("../../dal/auth");
const Auth_1 = require("../../middleware/Auth");
const VerifyLegacyPagingInfo_1 = require("../../middleware/VerifyLegacyPagingInfo");
let ForumController = class ForumController extends controller_1.default {
    constructor() {
        super();
    }
    async getCategories() {
        return await this.forum.getCategories();
    }
    async getSubCategories(userInfo) {
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
    async getLatestPost(subCategoryId) {
        return await this.forum.getLatestPost(subCategoryId);
    }
    async countPostsAndThreads(subCategoryId) {
        const [threads, posts] = await Promise.all([this.forum.getThreadCount(subCategoryId), this.forum.getPostCount(subCategoryId)]);
        return {
            threads,
            posts,
        };
    }
    async getLatestThreads(subCategoryId, limit = 5) {
        return await this.forum.getLatestThreads(limit);
    }
    async getThreadById(threadId) {
        return await this.forum.getThreadById(threadId);
    }
    async getThreads(subCategoryId, offset, limit, sort, userInfo) {
        const numericOffset = Filter_1.filterOffset(offset);
        const numericLimit = Filter_1.filterLimit(limit);
        const goodSort = Filter_1.filterSort(sort);
        const numericId = Filter_1.filterId(subCategoryId);
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
            if (subData.permissions.read > rank) {
                throw false;
            }
        }
        catch (e) {
            throw new this.BadRequest('InvalidSubCategoryId');
        }
        const Threads = await this.forum.getThreads(numericId, numericOffset, numericLimit, goodSort);
        const ThreadsCount = await this.forum.getThreadCount(numericId);
        return {
            'total': ThreadsCount,
            'threads': Threads,
        };
    }
    async getPosts(threadId, offset, limit, sort, userInfo) {
        const numericOffset = Filter_1.filterOffset(offset);
        const numericLimit = Filter_1.filterLimit(limit);
        const goodSort = Filter_1.filterSort(sort);
        const numericId = Filter_1.filterId(threadId);
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
        }
        catch (e) {
            throw new this.BadRequest('InvalidThreadId');
        }
        let subData;
        try {
            subData = await this.forum.getSubCategoryById(threadData.subCategoryId);
            if (subData.permissions.read > rank) {
                throw false;
            }
        }
        catch (e) {
            throw new this.BadRequest('InvalidSubCategoryId');
        }
        const Posts = await this.forum.getThreadPosts(numericId, numericOffset, numericLimit, goodSort);
        const PostsCount = await this.forum.countThreadPosts(numericId);
        return {
            'total': PostsCount,
            'posts': Posts,
        };
    }
    async createThread(userInfo, subCategoryId, title, body, locked = 0, pinned = 0) {
        const numericId = Filter_1.filterId(subCategoryId);
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
        }
        catch (e) {
            throw new this.BadRequest('InvalidSubCategoryId');
        }
        let isLocked = Filter_1.filterId(locked);
        let isPinned = Filter_1.filterId(pinned);
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
        let threadId;
        try {
            threadId = await this.forum.createThread(subData.categoryId, subData.subCategoryId, title, userInfo.userId, isLocked, isPinned, body);
        }
        catch (e) {
            if (e.message) {
                if (e.message === 'Cooldown') {
                    throw new this.Conflict('Cooldown');
                }
            }
            throw e;
        }
        this.event.forum.submitEvent('createThread', { userId: userInfo.userId, threadId: threadId });
        return {
            'success': true,
            'threadId': threadId,
        };
    }
    async createPost(userInfo, threadId, body) {
        const numericId = Filter_1.filterId(threadId);
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
        }
        catch (e) {
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
        }
        catch (e) {
            throw new this.BadRequest('InvalidThreadId');
        }
        if (!body || body.length > 4096) {
            throw new this.BadRequest('Invalidbody');
        }
        const bodyWithoutWhiteSpace = body.replace(/ /g, '');
        if (bodyWithoutWhiteSpace.length < 3) {
            throw new this.BadRequest('InvalidBody');
        }
        let postId;
        try {
            postId = await this.forum.createPost(numericId, subData.categoryId, subData.subCategoryId, userInfo.userId, body);
        }
        catch (e) {
            if (e.message) {
                if (e.message === 'Cooldown') {
                    throw new this.BadRequest('Cooldown');
                }
            }
            throw e;
        }
        this.event.forum.submitEvent('createPost', { userId: userInfo.userId, postId: postId });
        return {
            'success': true,
            'postId': postId,
        };
    }
    async deletePost(userInfo, postId) {
        const numericId = Filter_1.filterId(postId);
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
        }
        catch (e) {
            throw new this.BadRequest('InvalidPostId');
        }
        if (postData.userId !== userInfo.userId && rank < 1) {
            throw new this.BadRequest('InvalidPostId');
        }
        if (postData.postDeleted === model.forum.postDeleted.moderated && rank < 1) {
            throw new this.BadRequest('InvalidPostId');
        }
        let deleted = model.forum.postDeleted.true;
        if (rank < 1) {
            deleted = model.forum.postDeleted.moderated;
        }
        await this.forum.updatePostStatus(numericId, deleted);
        return {
            'success': true,
            'postId': numericId,
        };
    }
    async deleteThread(userInfo, threadId) {
        const numericId = Filter_1.filterId(threadId);
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
        }
        catch (e) {
            throw new this.BadRequest('InvalidThreadId');
        }
        if (threadData.userId !== userInfo.userId && rank < 1) {
            throw new this.BadRequest('InvalidThreadId');
        }
        if (threadData.threadDeleted === model.forum.threadDeleted.moderated && rank < 1) {
            throw new this.BadRequest('InvalidThreadId');
        }
        let deleted = model.forum.threadDeleted.true;
        if (rank < 1) {
            deleted = model.forum.threadDeleted.moderated;
        }
        await this.forum.updateThreadStatus(numericId, deleted);
        return {
            'success': true,
            'threadId': threadData.threadId,
        };
    }
    async unDeletePost(userInfo, postId) {
        const numericId = Filter_1.filterId(postId);
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
        }
        catch (e) {
            throw new this.BadRequest('InvalidPostId');
        }
        if (postData.userId !== userInfo.userId && rank < 1) {
            throw new this.BadRequest('InvalidPostId');
        }
        if (postData.postDeleted === model.forum.postDeleted.moderated && rank < 1) {
            throw new this.BadRequest('InvalidPostId');
        }
        await this.forum.updatePostStatus(numericId, model.forum.postDeleted.false);
        return {
            'success': true,
            'postId': numericId,
        };
    }
    async unDeleteThread(userInfo, threadId) {
        const numericId = Filter_1.filterId(threadId);
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
        }
        catch (e) {
            throw new this.BadRequest('InvalidThreadId');
        }
        if (threadData.userId !== userInfo.userId && rank < 1) {
            throw new this.BadRequest('InvalidThreadId');
        }
        if (threadData.threadDeleted === model.forum.threadDeleted.moderated && rank < 1) {
            throw new this.BadRequest('InvalidThreadId');
        }
        await this.forum.updateThreadStatus(numericId, model.forum.threadDeleted.false);
        return {
            'success': true,
            'threadId': threadData.threadId,
        };
    }
    async updateThread(userInfo, threadId, isLocked, isPinned) {
        let postData;
        try {
            postData = await this.forum.getThreadById(threadId);
        }
        catch (e) {
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
        await this.forum.updateThreadStates(threadId, isPinned, isLocked);
        return {
            'success': true,
        };
    }
    async updatePost(userInfo, postId, newBody) {
        const numericId = Filter_1.filterId(postId);
        if (!numericId) {
            throw new this.BadRequest('InvalidThreadId');
        }
        let postData;
        try {
            postData = await this.forum.getPostById(numericId);
        }
        catch (e) {
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
        await this.forum.updatePostBody(numericId, newBody);
        return {
            'success': true,
            'postId': numericId,
        };
    }
    async searchThreads(query, offset, limit) {
        const numericOffset = Filter_1.filterOffset(offset);
        const numericLimit = Filter_1.filterLimit(limit);
        if (query.length >= 32) {
            throw new this.BadRequest('InvalidQuery');
        }
        query = query.replace(/%/g, '\%');
        const results = await this.forum.searchThreads(query, numericOffset, numericLimit);
        return results;
    }
};
__decorate([
    common_1.Get('/categories'),
    swagger_1.Summary('Get forum categories'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ForumController.prototype, "getCategories", null);
__decorate([
    common_1.Get('/subcategories'),
    swagger_1.Summary('Get forum subcategories'),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo]),
    __metadata("design:returntype", Promise)
], ForumController.prototype, "getSubCategories", null);
__decorate([
    common_1.Get('/:subCategoryId/latest-post'),
    swagger_1.Summary('Get the latest post for the {subCategoryId}'),
    swagger_1.Returns(200, { type: model.forum.PostSnippet }),
    __param(0, common_1.PathParams('subCategoryId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ForumController.prototype, "getLatestPost", null);
__decorate([
    common_1.Get('/:subCategoryId/count'),
    swagger_1.Summary('Count all posts and threads for the {subCategoryId}'),
    swagger_1.Returns(200, { type: model.forum.ForumThreadsAndPostsCount }),
    __param(0, common_1.PathParams('subCategoryId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ForumController.prototype, "countPostsAndThreads", null);
__decorate([
    common_1.Get('/:subCategoryId/latest-threads'),
    swagger_1.Summary('Get the latest thread snippet for the {subCategoryId}'),
    common_1.Use(VerifyLegacyPagingInfo_1.VerifyPagingInfo),
    swagger_1.ReturnsArray(200, { type: model.forum.Thread }),
    __param(0, common_1.PathParams('subCategoryId', Number)),
    __param(1, common_1.QueryParams('limit', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], ForumController.prototype, "getLatestThreads", null);
__decorate([
    common_1.Get('/thread/:threadId/info'),
    swagger_1.Summary('Get thread info by the {threadId}'),
    swagger_1.Returns(200, { type: model.forum.Thread }),
    __param(0, common_1.PathParams('threadId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ForumController.prototype, "getThreadById", null);
__decorate([
    common_1.Get('/:subCategoryId/threads'),
    swagger_1.Summary('Get forum threads by subCategoryId'),
    __param(0, common_1.PathParams('subCategoryId')),
    __param(1, common_1.QueryParams('offset', Number)),
    __param(2, common_1.QueryParams('limit', Number)),
    __param(3, common_1.QueryParams('sort', String)),
    __param(4, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, model.user.UserInfo]),
    __metadata("design:returntype", Promise)
], ForumController.prototype, "getThreads", null);
__decorate([
    common_1.Get('/thread/:threadId/posts'),
    swagger_1.Summary('Get posts (aka replies) to a thread'),
    __param(0, common_1.PathParams('threadId', Number)),
    __param(1, common_1.QueryParams('offset', Number)),
    __param(2, common_1.QueryParams('limit', Number)),
    __param(3, common_1.QueryParams('sort', String)),
    __param(4, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, model.user.UserInfo]),
    __metadata("design:returntype", Promise)
], ForumController.prototype, "getPosts", null);
__decorate([
    common_1.Put('/thread/create'),
    swagger_1.Summary('Create a thread. locked and pinned are ignored if user is not moderator+'),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.BodyParams('subCategoryId', Number)),
    __param(2, common_1.Required()),
    __param(2, common_1.BodyParams('title', String)),
    __param(3, common_1.Required()),
    __param(3, common_1.BodyParams('body', String)),
    __param(4, common_1.BodyParams('locked', Number)),
    __param(5, common_1.BodyParams('pinned', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], ForumController.prototype, "createThread", null);
__decorate([
    common_1.Put('/thread/:threadId/reply'),
    swagger_1.Summary('Reply to a threadId'),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('threadId', Number)),
    __param(2, common_1.Required()),
    __param(2, common_1.BodyParams('body', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, String]),
    __metadata("design:returntype", Promise)
], ForumController.prototype, "createPost", null);
__decorate([
    common_1.Delete('/post/:postId'),
    swagger_1.Summary('Delete a post. Must be creator or moderator'),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('postId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, String]),
    __metadata("design:returntype", Promise)
], ForumController.prototype, "deletePost", null);
__decorate([
    common_1.Delete('/thread/:threadId'),
    swagger_1.Summary('Delete a thread. Must have mod perms or be creator'),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('threadId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], ForumController.prototype, "deleteThread", null);
__decorate([
    common_1.Post('/post/:postId/undelete'),
    swagger_1.Summary('Undelete a post/reply'),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('postId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, String]),
    __metadata("design:returntype", Promise)
], ForumController.prototype, "unDeletePost", null);
__decorate([
    common_1.Post('/thread/:threadId/undelete'),
    swagger_1.Summary('Un-delete a deleted thread'),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('threadId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], ForumController.prototype, "unDeleteThread", null);
__decorate([
    common_1.Patch('/thread/:threadId/update'),
    swagger_1.Summary('Update a thread locked & pinned state. Ignored if not moderator'),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.PathParams('threadId', Number)),
    __param(2, common_1.Required()),
    __param(2, common_1.BodyParams('isLocked', Number)),
    __param(3, common_1.Required()),
    __param(3, common_1.BodyParams('isPinned', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number, Number]),
    __metadata("design:returntype", Promise)
], ForumController.prototype, "updateThread", null);
__decorate([
    common_1.Patch('/post/:postId/'),
    swagger_1.Summary('Update a post'),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('postId', Number)),
    __param(2, common_1.Required()),
    __param(2, common_1.BodyParams('body', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, String, String]),
    __metadata("design:returntype", Promise)
], ForumController.prototype, "updatePost", null);
__decorate([
    common_1.Get('/threads/search'),
    swagger_1.Summary('Search forum threads'),
    __param(0, common_1.QueryParams('q', String)),
    __param(1, common_1.QueryParams('offset', Number)),
    __param(2, common_1.QueryParams('limit', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String]),
    __metadata("design:returntype", Promise)
], ForumController.prototype, "searchThreads", null);
ForumController = __decorate([
    common_1.Controller('/forum'),
    __metadata("design:paramtypes", [])
], ForumController);
exports.ForumController = ForumController;

