/**
 * Imports
 */
import * as Forum from '../models/v1/forum';
import _init from './_init';

class ForumDAL extends _init {
    /**
     * Get All Categories
     */
    public async getCategories(): Promise<Forum.Categories[]> {
        const categories = await this.knex("forum_categories").select("id as categoryId","title","description",'weight').orderBy('weight','desc');
        return categories;
    }
    /**
     * Get All Subcategories
     * @param minimumRank The minimum rank required to read the subcategory. Defaults to 0 (aka Guest/Regular User)
     */
    public async getSubCategories(minimumRank = 0): Promise<Forum.SubCategories[]> {
        const subCategories = await this.knex("forum_subcategories").select("id as subCategoryId","category as categoryId","title","description","read_permission_level","post_permission_level",'forum_subcategories.weight').where("read_permission_level","<=",minimumRank).orderBy('weight','desc');
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
        return formattedCategories as Forum.SubCategories[];
    }
    /**
     * Get Subcategory by ID
     * @param subCategoryId
     */
    public async getSubCategoryById(subCategoryId: number): Promise<Forum.SubCategories> {
        const subCategories = await this.knex("forum_subcategories").select("id as subCategoryId","category as categoryId","title","description","read_permission_level","post_permission_level").where({'id':subCategoryId});
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
        return formattedCategories[0] as Forum.SubCategories;
    }

    /**
     * Get the total number of threads in a specific subcategoryid
     * @param subCategoryId 
     */
    public async getThreadCount(subCategoryId: number): Promise<number> {
        const count = await this.knex("forum_threads").count("id as id").where({"forum_threads.sub_category":subCategoryId,"forum_threads.thread_deleted":Forum.threadDeleted.false});
        return count[0]['id'] as number;
    }

    /**
     * Get the total number of posts in a specific subcategoryid
     * @param subCategoryId 
     */
    public async getPostCount(subCategoryId: number): Promise<number> {
        const count = await this.knex("forum_posts").count("id as id").where({"forum_posts.sub_category":subCategoryId,"forum_posts.post_deleted":Forum.postDeleted.false});
        return count[0]['id'] as number;
    }

    /**
     * Get the Latest Post of a subcategory
     */
    public async getLatestPost(subCategoryId: number): Promise<Forum.PostSnippet> {
        const post = await this.knex("forum_posts").select(
            "forum_posts.threadid as threadId",
            "forum_posts.userid as userId",
            "forum_posts.date_created as dateCreated"
        ).where({
            "sub_category": subCategoryId,
            "forum_posts.post_deleted": Forum.postDeleted.false
        }).limit(1).orderBy("id", "desc");
        return post[0] as Forum.PostSnippet;
    }

    /**
     * Get the latest site-wide threads
     * @param limit 
     */
    public async getLatestThreads(limit: number): Promise<Forum.Thread[]> {
        const threads = await this.knex('forum_threads').select(
            'id as threadId',
            'category as categoryId',
            'sub_category as subCategoryId',
            'title',
            'userid as userId',
            'date_created as dateCreated',
            'date_edited as dateEdited',
            'thread_locked as threadLocked',
            'thread_pinned as threadPinned',
        ).where({
            'thread_deleted': Forum.threadDeleted.false
        }).orderBy('id','desc').limit(limit);
        return threads;
    }

    /**
     * Get Threads for a Subcategory
     * @param subCategoryId 
     * @param offset 
     * @param limit 
     * @param sort 
     */
    public async getThreads(subCategoryId: number, offset: number, limit: number, sort: 'asc'|'desc'): Promise<Forum.Threads[]> {
        const threads = await this.knex("forum_posts").select(
            "forum_threads.id as threadId",
            "forum_threads.title",
            "forum_threads.userid as userId",
            "forum_threads.thread_pinned as threadPinned",
        ).max(
            "forum_posts.date_created as latestReply",
        ).count(
            "forum_posts.id as postCount",
        ).where({
            "forum_posts.sub_category": subCategoryId,
            "forum_posts.post_deleted": Forum.postDeleted.false,
            "forum_threads.thread_deleted": Forum.threadDeleted.false,
        }).innerJoin("forum_threads", "forum_threads.id", "forum_posts.threadid"
        ).orderBy(
            "forum_threads.thread_pinned",
            sort,
        ).orderBy(
            "latestReply", sort
        ).limit(limit).offset(offset).groupBy("forum_threads.id");
        return threads as unknown as Forum.Threads[];
    }

    /**
     * Get a Thread from it's ID
     * @param threadId 
     */
    public async getThreadById(threadId: number): Promise<Forum.Thread> {
        const thread = await this.knex("forum_threads").select("id as threadId","category as categoryId","sub_category as subCategoryId","title","userid as userId","date_created as dateCreated","date_edited as dateEdited","thread_locked as threadLocked","thread_deleted as threadDeleted","thread_pinned as threadPinned").where({"id": threadId});
        if (!thread[0]) {
            throw false;
        }
        return thread[0];
    }

    /**
     * Get a Post by it's ID
     */
    public async getPostById(postId: number): Promise<Forum.Posts> {
        const post = await this.knex("forum_posts").select(
            "forum_posts.post_body as body",
            "forum_posts.userid as userId",
            "forum_posts.date_created as dateCreated",
            "forum_posts.date_edited as dateEdited",
            "sub_category as subCategoryId", 
            "forum_posts.id as postId", 
            "forum_posts.post_deleted as postDeleted"
        ).where({
            "forum_posts.id": postId
        }).limit(1);
        if (!post[0]) {
            throw false;
        }
        return post[0];
    }

    /**
     * Get posts (aka "replies") to a thread
     * @param threadId 
     * @param offset 
     * @param limit 
     * @param sort 
     */
    public async getThreadPosts(threadId: number, offset: number, limit: number, sort: 'asc'|'desc'): Promise<Forum.Posts[]> {
        const posts = await this.knex("forum_posts").select(
            "forum_posts.post_body as body",
            "forum_posts.userid as userId",
            "forum_posts.date_created as dateCreated",
            "forum_posts.date_edited as dateEdited",
            "sub_category as subCategoryId", 
            "forum_posts.id as postId", 
            "forum_posts.post_deleted as postDeleted"
        ).where({
            "forum_posts.threadid": threadId
        }).orderBy("forum_posts.id", sort).limit(limit).offset(offset);
        for (const post of posts) {
            if (post.postDeleted === Forum.postDeleted.true) {
                post.body = "[ Deleted ]";
            }
        }
        return posts;
    }

    /**
     * Count Replies (aka posts) to a thread
     * @param threadId 
     */
    public async countThreadPosts(threadId: number): Promise<number> {
        const posts = await this.knex("forum_posts").count('id as Total').where({
            "forum_posts.threadid": threadId,
        });
        return posts[0]["Total"] as number;
    }

    /**
     * Create a thread. Does not create body
     * @returns threadId
     */
    public async createThread(categoryId: number, subCategoryId: number, title: string, userId: number, locked: Forum.threadLocked, pinned: Forum.threadPinned): Promise<number> {
        const time = this.moment().format('YYYY-MM-DD HH:mm:ss');
        const id = await this.knex("forum_threads").insert({
            'category': categoryId,
            'sub_category': subCategoryId,
            'title': title,
            'userid': userId,
            'thread_locked': locked,
            'thread_pinned': pinned,
            'thread_deleted': Forum.postDeleted.false,
            'date_created': time,
            'date_edited': time,
        })
        if (!id[0]) {
            throw false;
        }
        return id[0] as number;
    }

    /**
     * Update a Thread isPinned & isLocked states
     * @param threadId 
     * @param isPinned 
     * @param isLocked 
     */
    public async updateThreadStates(threadId: number, isPinned: Forum.threadPinned, isLocked: Forum.threadLocked): Promise<void> {
        await this.knex('forum_threads').update({
            'thread_pinned': isPinned,
            'thread_locked': isLocked,
        }).where({
            'id': threadId,
        }).limit(1);
    }

    /**
     * Create a Post
     * @returns postId
     */
    public async createPost(threadId: number, categoryId: number, subCategoryId: number, userId: number, body: string): Promise<number> {
        const time = this.moment().format('YYYY-MM-DD HH:mm:ss');
        const id = await this.knex("forum_posts").insert({
            'category': categoryId,
            'sub_category': subCategoryId,
            'threadid': threadId,
            'userid': userId,
            'date_created': time,
            'date_edited': time,
            'post_body': body,
            'post_deleted': Forum.postDeleted.false,
        })
        if (!id[0]) {
            throw false;
        }
        return id[0] as number;
    }

    /**
     * Grab a user's latest post and see if they are within the cooldown range
     * @param userId 
     */
    public async canUserPost(userId: number): Promise<boolean> {
        const latestPost = await this.knex("forum_posts").select("date_created").where({'userid': userId}).orderBy("id", "desc").limit(1);
        if (!latestPost[0]) {
            return true;
        }
        if (this.moment().isSameOrAfter(this.moment(latestPost[0]["date_created"]).add(30, "seconds"))) {
            return true;
        }
        return false;
    }

    /**
     * Delete a post
     */
    public async updatePostStatus(postId: number, deleted: Forum.postDeleted): Promise<void> {
        await this.knex("forum_posts").update({
            'post_deleted': deleted,
        }).where({'id': postId}).limit(1);
    }

    /**
     * Delete a thread
     */
    public async updateThreadStatus(threadId: number, deleted: Forum.threadDeleted): Promise<void> {
        await this.knex("forum_threads").update({
            'thread_deleted': deleted,
        }).where({'id': threadId}).limit(1);
    }

    /**
     * Update a Post's Body
     * @param postId 
     * @param newBody 
     */
    public async updatePostBody(postId: number, newBody: string): Promise<void> {
        const time = this.moment().format('YYYY-MM-DD HH:mm:ss');
        await this.knex("forum_posts").update({
            'post_body': newBody,
            'date_edited': time,
        }).where({'id': postId}).limit(1);
    }

    /**
     * Search threads.
     * @param query 
     */
    public async searchThreads(query: string, offset: number, limit: number): Promise<Forum.Threads[]> {
        const threads = await this.knex("forum_posts").select(
            "forum_threads.id as threadId",
            "forum_threads.title",
            "forum_threads.userid as userId",
            "forum_threads.thread_pinned as threadPinned",
            "forum_threads.sub_category as subCategoryId",
        ).max(
            "forum_posts.date_created as latestReply",
        ).count(
            "forum_posts.id as postCount",
        ).where({
            "forum_posts.post_deleted": Forum.postDeleted.false,
            "forum_threads.thread_deleted": Forum.threadDeleted.false,
        }).innerJoin("forum_threads", "forum_threads.id", "forum_posts.threadid"
        ).orderBy(
            "forum_threads.thread_pinned",
            'desc',
        ).orderBy(
            "latestReply", 'desc'
        ).limit(limit).offset(offset).groupBy("forum_threads.id")
        .andWhere(
            'forum_threads.title', 'like', '%'+query+'%',
        );
        return threads as unknown as Forum.Threads[];
    }

    /**
     * Update a category
     * @param categoryId 
     * @param title 
     * @param description 
     * @param weight 
     */
    public async updateCategory(categoryId: number, title: string, description: string, weight: number = 0) {
        await this.knex('forum_categories').update({
            'title': title,
            description: description,
            'weight': weight,
        }).where({'id': categoryId}).limit(1);
    }

    /**
     * Create a category
     * @param categoryId 
     * @param title 
     * @param description 
     * @param weight 
     */
    public async createCategory(title: string, description: string, weight: number = 0) {
        await this.knex('forum_categories').insert({
            'title': title,
            description: description,
            'weight': weight,
        });
    }


    /**
     * Update a subCategory
     * @param subCategoryId 
     * @param categoryId 
     * @param title 
     * @param description 
     * @param readPermissionLevel 
     * @param postPermissionLevel 
     * @param weight 
     */
    public async updateSubCategory(subCategoryId: number, categoryId: number, title: string, description: string, readPermissionLevel: number, postPermissionLevel: number, weight: number = 0) {
        await this.knex('forum_subcategories').update({
            'title': title,
            'description': description,
            'category': categoryId,
            'read_permission_level': readPermissionLevel,
            'post_permission_level': postPermissionLevel,
            'weight': weight,
        }).where({'id': subCategoryId}).limit(1);
    }

    /**
     * Create a subCategory
     * @param categoryId 
     * @param title 
     * @param description 
     * @param readPermissionLevel 
     * @param postPermissionLevel 
     * @param weight 
     */
    public async createSubCategory(categoryId: number, title: string, description: string, readPermissionLevel: number, postPermissionLevel: number, weight: number = 0) {
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

export default ForumDAL;
