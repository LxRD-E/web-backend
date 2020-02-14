import { Controller, Get, All, Next, Req, Res, UseBefore, Render, QueryParams, PathParams, Redirect, Response, Request, Locals, UseAfter, Required, Use, UseBeforeEach } from "@tsed/common";
import { Description, Summary } from "@tsed/swagger"; // import swagger Ts.ED module
import { Exception, NotFound, BadRequest } from "ts-httpexceptions";
import * as model from '../../models/models';
import { WWWTemplate } from '../../models/v2/Www';
import controller from '../controller'
import moment = require("moment");
import xss = require('xss');
import Config from '../../helpers/config';
// Models
import { NoAuth, YesAuth } from "../../middleware/Auth";
import {numberWithCommas} from '../../helpers/Filter';

@Controller("/")
export class WWWForumController extends controller {
    constructor() {
        super();
    }

    @Render('forum/index')
    @Get('/forum')
    public async index(
        @Locals('userInfo') userInfo: model.user.SessionUserInfo,
    ) {
        let subs;
        if (!userInfo) {
            subs = await this.forum.getSubCategories();
        }else{
            subs = await this.forum.getSubCategories(userInfo.staff);
        }
        for (const item of subs) {
            let latestPost = await this.forum.getLatestPost(item.subCategoryId);
            item.latestPost = latestPost;
            item.totalThreads = await this.forum.getThreadCount(item.subCategoryId);
            item.totalPosts = await this.forum.getPostCount(item.subCategoryId);
        }
        return new this.WWWTemplate({
            title: 'Forum',
            page: {
                subs: subs,
            }
        });
    }

    @Render('forum/search')
    @Get('/forum/search')
    public search(
        @QueryParams('q', String) q?: string,
    ) {
        return new this.WWWTemplate({
            title: 'Search Forum',
            page: {
                query: q,
            }
        });
    }

    @Render('forum/thread_create')
    @Get('/forum/thread/thread')
    @UseBefore(YesAuth)
    public async forumThreadCreate(
        @Locals('userInfo') userData: model.user.SessionUserInfo,
        @QueryParams('subid', Number) numericId: number
    ) {
        let rank = userData.staff;
        if (!numericId) {
            throw new this.BadRequest('InvalidSubCategoryId');
        }
        let forumSubCategory;
        let allForumSubCategories;
        try {
            forumSubCategory = await this.forum.getSubCategoryById(numericId);
            if (forumSubCategory.permissions.post > rank) {
                throw false;
            }
            allForumSubCategories = await this.forum.getSubCategories(rank);
        }catch(e) {
            throw new this.BadRequest('InvalidSubCategoryId');
        }
        let ViewData = new this.WWWTemplate({'title': 'Create a thread'});
        ViewData.title = "Create a Thread";
        ViewData.page.subCategoryId = forumSubCategory.subCategoryId;
        ViewData.page.subCategoryName = forumSubCategory.title;
        ViewData.page.subCategories = allForumSubCategories;
        return ViewData;
    }

    @Render('forum/create_reply')
    @Get('/forum/thread/thread')
    @UseBefore(YesAuth)
    public async forumPostCreate(
        @Locals('userInfo') userData: model.user.SessionUserInfo,
        @QueryParams('threadId', Number) numericId: number,
        @QueryParams('page', Number) page?: number,
    ) {
        let rank = userData.staff;
        let threadInfo;
        try {
            threadInfo = await this.forum.getThreadById(numericId);
        }catch(e) {
            throw new this.BadRequest('InvalidThreadId');
        }
        let forumSubCategory
        try {
            forumSubCategory = await this.forum.getSubCategoryById(threadInfo.subCategoryId);
            if (forumSubCategory.permissions.read > rank) {
                throw false;
            }
        }catch(e) {
            throw new this.BadRequest('InvalidThreadId');
        }
        let ViewData = new this.WWWTemplate({title: "Reply to "+'"'+forumSubCategory.title+'"'})
        ViewData.page.subCategoryId = forumSubCategory.subCategoryId;
        ViewData.page.subCategoryName = forumSubCategory.title;
        ViewData.page.page = page;

        ViewData.page.threadTitle = threadInfo.title;
        ViewData.page.threadId = threadInfo.threadId;
        return ViewData;
    }

    @Render('forum/thread')
    @Get('/forum/thread/:id')
    public async thread(
        @Res() res: Res,
        @Locals('userInfo') userData: model.user.SessionUserInfo,
        @PathParams('id', Number) numericId: number,
        @QueryParams('page', Number) page?: number,
    ) {
        let rank = 0;
        if (userData) {
            rank = userData.staff;
        }
        if (!numericId) {
            throw new this.BadRequest('InvalidThreadId');
        }
        let ViewData = new this.WWWTemplate({title: 'Thread'});
        let threadInfo;
        try {
            threadInfo = await this.forum.getThreadById(numericId);
            if (threadInfo.threadDeleted === model.forum.threadDeleted.true) {
                threadInfo.title = '[ Deleted '+threadInfo.threadId+' ]';
                ViewData.page.deleted = true;
            }
        }catch(e) {
            throw new this.BadRequest('InvalidThreadId');
        }
        let forumSubCategory
        try {
            forumSubCategory = await this.forum.getSubCategoryById(threadInfo.subCategoryId);
            if (forumSubCategory.permissions.read > rank) {
                throw false;
            }
        }catch(e) {
            throw new this.BadRequest('InvalidThreadId');
        }
        if (typeof page !== 'number' || page <= 0) {
            page = 1;
        }
        ViewData.title = threadInfo.title + " :: " + forumSubCategory.title;
        ViewData.page.subCategoryId = forumSubCategory.subCategoryId;
        ViewData.page.subCategoryName = forumSubCategory.title;
        ViewData.page.page = page;

        ViewData.page.threadTitle = threadInfo.title;
        ViewData.page.threadId = threadInfo.threadId;
        ViewData.page.threadLocked = threadInfo.threadLocked;
        ViewData.page.threadPinned = threadInfo.threadPinned;
        return ViewData;
    }

    @Render('forum/subcategory')
    @Get('/forum/:subCategoryId')
    public async subCategory(
        @Res() res: Res,
        @Locals('userInfo') userData: model.user.SessionUserInfo,
        @PathParams('subCategoryId', Number) numericId: number,
        @QueryParams('page', Number) page?: number,
    ) {

        let rank = 0;
        if (userData) {
            rank = userData.staff;
        }
        if (!numericId) {
            throw new this.BadRequest('InvalidSubCategoryId');
        }
        let forumSubCategory
        try {
            forumSubCategory = await this.forum.getSubCategoryById(numericId);
            if (forumSubCategory.permissions.read > rank) {
                throw false;
            }
        }catch(e) {
            throw new this.BadRequest('InvalidSubCategoryId');
        }
        let allForumSubCategories;
        try {
            allForumSubCategories = await this.forum.getSubCategories(rank);
        }catch(e) {
            throw new this.BadRequest('InvalidSubCategoryId');
        }
        if (typeof page !== 'number' || page <= 0) {
            page = 1;
        }
        let ViewData = new this.WWWTemplate({title: forumSubCategory.title});
        ViewData.page.subCategoryId = forumSubCategory.subCategoryId;
        ViewData.page.subCategoryName = forumSubCategory.title;
        ViewData.page.page = page;
        ViewData.page.subCategories = allForumSubCategories;
        return ViewData;
    }
}