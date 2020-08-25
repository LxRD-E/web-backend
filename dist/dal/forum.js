"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Forum = require("../models/v1/forum");
const _init_1 = require("./_init");
class ForumDAL extends _init_1.default {
    async getCategories() {
        return this.knex("forum_categories").select("id as categoryId", "title", "description", 'weight').orderBy('weight', 'desc');
    }
    async getCategoryById(categoryId) {
        const categories = await this.knex("forum_categories").select("id as categoryId", "title", "description", 'weight').orderBy('weight', 'desc').where({ 'id': categoryId }).limit(1);
        if (!categories[0]) {
            throw new Error('InvalidCategoryId');
        }
        return categories[0];
    }
    async getSubCategories(minimumRank = 0) {
        const subCategories = await this.knex("forum_subcategories").select("id as subCategoryId", "category as categoryId", "title", "description", "read_permission_level", "post_permission_level", 'forum_subcategories.weight').where("read_permission_level", "<=", minimumRank).orderBy('weight', 'desc');
        const formattedCategories = [];
        for (const sub of subCategories) {
            formattedCategories.push({
                'subCategoryId': sub.subCategoryId,
                'categoryId': sub.categoryId,
                'title': sub.title,
                'description': sub.description,
                'permissions': {
                    'read': sub.read_permission_level,
                    'post': sub.post_permission_level,
                },
                'weight': sub.weight,
            });
        }
        return formattedCategories;
    }
    async getSubCategoryById(subCategoryId) {
        const subCategories = await this.knex("forum_subcategories").select("id as subCategoryId", "category as categoryId", "title", "description", "read_permission_level", "post_permission_level").where({ 'id': subCategoryId });
        const formattedCategories = [];
        for (const sub of subCategories) {
            formattedCategories.push({
                'subCategoryId': sub.subCategoryId,
                'categoryId': sub.categoryId,
                'title': sub.title,
                'description': sub.description,
                'permissions': {
                    'read': sub.read_permission_level,
                    'post': sub.post_permission_level,
                }
            });
        }
        if (!formattedCategories[0]) {
            throw false;
        }
        return formattedCategories[0];
    }
    async getThreadCount(subCategoryId) {
        const count = await this.knex("forum_threads").count("id as id").where({ "forum_threads.sub_category": subCategoryId, "forum_threads.thread_deleted": Forum.threadDeleted.false });
        return count[0]['id'];
    }
    async getPostCount(subCategoryId) {
        const count = await this.knex("forum_posts").count("id as id").where({ "forum_posts.sub_category": subCategoryId, "forum_posts.post_deleted": Forum.postDeleted.false });
        return count[0]['id'];
    }
    async getLatestPost(subCategoryId) {
        const post = await this.knex("forum_posts").select("forum_posts.threadid as threadId", "forum_posts.userid as userId", "forum_posts.date_created as dateCreated").where({
            "sub_category": subCategoryId,
            "forum_posts.post_deleted": Forum.postDeleted.false
        }).limit(1).orderBy("id", "desc");
        return post[0];
    }
    async getLatestThreads(limit) {
        const threads = await this.knex('forum_threads').select('id as threadId', 'category as categoryId', 'sub_category as subCategoryId', 'title', 'userid as userId', 'date_created as dateCreated', 'date_edited as dateEdited', 'thread_locked as threadLocked', 'thread_pinned as threadPinned').where({
            'thread_deleted': Forum.threadDeleted.false
        }).orderBy('id', 'desc').limit(limit);
        return threads;
    }
    async getThreads(subCategoryId, offset, limit, sort) {
        const threads = await this.knex("forum_posts").select("forum_threads.id as threadId", "forum_threads.title", "forum_threads.userid as userId", "forum_threads.thread_pinned as threadPinned").max("forum_posts.date_created as latestReply").count("forum_posts.id as postCount").where({
            "forum_posts.sub_category": subCategoryId,
            "forum_posts.post_deleted": Forum.postDeleted.false,
            "forum_threads.thread_deleted": Forum.threadDeleted.false,
        }).innerJoin("forum_threads", "forum_threads.id", "forum_posts.threadid").orderBy("forum_threads.thread_pinned", sort).orderBy("latestReply", sort).limit(limit).offset(offset).groupBy("forum_threads.id");
        return threads;
    }
    async getThreadById(threadId) {
        const thread = await this.knex("forum_threads").select("id as threadId", "category as categoryId", "sub_category as subCategoryId", "title", "userid as userId", "date_created as dateCreated", "date_edited as dateEdited", "thread_locked as threadLocked", "thread_deleted as threadDeleted", "thread_pinned as threadPinned").where({ "id": threadId });
        if (!thread[0]) {
            throw new this.NotFound('InvalidThreadId');
        }
        return thread[0];
    }
    async getPostById(postId) {
        const post = await this.knex("forum_posts").select("forum_posts.post_body as body", "forum_posts.userid as userId", "forum_posts.date_created as dateCreated", "forum_posts.date_edited as dateEdited", "sub_category as subCategoryId", "forum_posts.id as postId", "forum_posts.post_deleted as postDeleted").where({
            "forum_posts.id": postId
        }).limit(1);
        if (!post[0]) {
            throw false;
        }
        return post[0];
    }
    async getThreadPosts(threadId, offset, limit, sort) {
        const posts = await this.knex("forum_posts").select("forum_posts.post_body as body", "forum_posts.userid as userId", "forum_posts.date_created as dateCreated", "forum_posts.date_edited as dateEdited", "sub_category as subCategoryId", "forum_posts.id as postId", "forum_posts.post_deleted as postDeleted").where({
            "forum_posts.threadid": threadId
        }).orderBy("forum_posts.id", sort).limit(limit).offset(offset);
        for (const post of posts) {
            if (post.postDeleted !== Forum.postDeleted.false) {
                post.body = "[ Deleted ]";
            }
        }
        return posts;
    }
    async countThreadPosts(threadId) {
        const posts = await this.knex("forum_posts").count('id as Total').where({
            "forum_posts.threadid": threadId,
        });
        return posts[0]["Total"];
    }
    async createThread(categoryId, subCategoryId, title, userId, locked, pinned, body) {
        let threadId;
        return await this.knex.transaction(async (trx) => {
            const latestPost = await trx("forum_posts").select("date_created").where({
                'userid': userId
            }).orderBy("id", "desc").limit(1).forUpdate('users', 'forum_posts', 'forum_threads');
            if (!latestPost[0]) {
            }
            else {
                if (this.moment().isSameOrAfter(this.moment(latestPost[0]["date_created"]).add(30, "seconds"))) {
                }
                else {
                    throw new Error('Cooldown');
                }
            }
            const time = this.moment().format('YYYY-MM-DD HH:mm:ss');
            const id = await trx("forum_threads").insert({
                'category': categoryId,
                'sub_category': subCategoryId,
                'title': title,
                'userid': userId,
                'thread_locked': locked,
                'thread_pinned': pinned,
                'thread_deleted': Forum.postDeleted.false,
                'date_created': time,
                'date_edited': time,
            }).forUpdate('users', 'forum_posts', 'forum_threads');
            if (!id[0]) {
                throw new Error('Thread not created due to unknown error.');
            }
            threadId = id[0];
            const postId = await trx("forum_posts").insert({
                'category': categoryId,
                'sub_category': subCategoryId,
                'threadid': threadId,
                'userid': userId,
                'date_created': time,
                'date_edited': time,
                'post_body': body,
                'post_deleted': Forum.postDeleted.false,
            }).forUpdate('users', 'forum_posts', 'forum_threads');
            if (!postId[0]) {
                throw new Error('Post not created due to unknown error.');
            }
            await trx("users").increment('forum_postcount').where({ 'id': userId }).forUpdate('users', 'forum_posts', 'forum_threads');
            return threadId;
        });
    }
    async updateThreadStates(threadId, isPinned, isLocked) {
        await this.knex('forum_threads').update({
            'thread_pinned': isPinned,
            'thread_locked': isLocked,
        }).where({
            'id': threadId,
        }).limit(1);
    }
    async createPost(threadId, categoryId, subCategoryId, userId, body) {
        let postId;
        return await this.knex.transaction(async (trx) => {
            const latestPost = await trx("forum_posts").select("date_created").where({ 'userid': userId }).orderBy("id", "desc").limit(1).forUpdate('users', 'forum_posts');
            if (!latestPost[0]) {
            }
            else {
                if (this.moment().isSameOrAfter(this.moment(latestPost[0]["date_created"]).add(30, "seconds"))) {
                }
                else {
                    throw new Error('Cooldown');
                }
            }
            const time = this.moment().format('YYYY-MM-DD HH:mm:ss');
            const id = await trx("forum_posts").insert({
                'category': categoryId,
                'sub_category': subCategoryId,
                'threadid': threadId,
                'userid': userId,
                'date_created': time,
                'date_edited': time,
                'post_body': body,
                'post_deleted': Forum.postDeleted.false,
            }).forUpdate('users', 'forum_posts');
            if (!id[0] || typeof id[0] !== 'number') {
                throw new Error('Post not created due to unknown reason.');
            }
            postId = id[0];
            await trx("users").increment('forum_postcount').where({ 'id': userId }).forUpdate('users', 'forum_posts');
            return postId;
        });
    }
    async canUserPost(userId) {
        const latestPost = await this.knex("forum_posts").select("date_created").where({ 'userid': userId }).orderBy("id", "desc").limit(1);
        if (!latestPost[0]) {
            return true;
        }
        if (this.moment().isSameOrAfter(this.moment(latestPost[0]["date_created"]).add(30, "seconds"))) {
            return true;
        }
        return false;
    }
    async updatePostStatus(postId, deleted) {
        await this.knex("forum_posts").update({
            'post_deleted': deleted,
        }).where({ 'id': postId }).limit(1);
    }
    async updateThreadStatus(threadId, deleted) {
        await this.knex("forum_threads").update({
            'thread_deleted': deleted,
        }).where({ 'id': threadId }).limit(1);
    }
    async updatePostBody(postId, newBody) {
        const time = this.moment().format('YYYY-MM-DD HH:mm:ss');
        await this.knex("forum_posts").update({
            'post_body': newBody,
            'date_edited': time,
        }).where({ 'id': postId }).limit(1);
    }
    async searchThreads(query, offset, limit) {
        const threads = await this.knex("forum_posts").select("forum_threads.id as threadId", "forum_threads.title", "forum_threads.userid as userId", "forum_threads.thread_pinned as threadPinned", "forum_threads.sub_category as subCategoryId").max("forum_posts.date_created as latestReply").count("forum_posts.id as postCount").where({
            "forum_posts.post_deleted": Forum.postDeleted.false,
            "forum_threads.thread_deleted": Forum.threadDeleted.false,
        }).innerJoin("forum_threads", "forum_threads.id", "forum_posts.threadid").orderBy("latestReply", 'desc').limit(limit).offset(offset).groupBy("forum_threads.id")
            .andWhere('forum_threads.title', 'like', '%' + query + '%');
        return threads;
    }
    async updateCategory(categoryId, title, description, weight = 0) {
        await this.knex('forum_categories').update({
            'title': title,
            description: description,
            'weight': weight,
        }).where({ 'id': categoryId }).limit(1);
    }
    async createCategory(title, description, weight = 0) {
        await this.knex('forum_categories').insert({
            'title': title,
            description: description,
            'weight': weight,
        });
    }
    async updateSubCategory(subCategoryId, categoryId, title, description, readPermissionLevel, postPermissionLevel, weight = 0) {
        await this.knex('forum_subcategories').update({
            'title': title,
            'description': description,
            'category': categoryId,
            'read_permission_level': readPermissionLevel,
            'post_permission_level': postPermissionLevel,
            'weight': weight,
        }).where({ 'id': subCategoryId }).limit(1);
    }
    async createSubCategory(categoryId, title, description, readPermissionLevel, postPermissionLevel, weight = 0) {
        await this.knex('forum_subcategories').insert({
            'title': title,
            'description': description,
            'category': categoryId,
            'read_permission_level': readPermissionLevel,
            'post_permission_level': postPermissionLevel,
            'weight': weight,
        });
    }
}
exports.default = ForumDAL;

