import { Controller, Get, Post, Render, Redirect, PathParams, QueryParams, Res, Locals, UseBefore } from '@tsed/common';
import { Summary } from '@tsed/swagger';
import controller from '../controller';
import { urlEncode } from '../../helpers/Filter';
import * as model from '../../models/models';
import { YesAuth } from '../../middleware/Auth';

@Controller('/')
export class WWWGroupController extends controller {


    @Get('/groups')
    @Summary('Search gropus')
    @Render('search_groups')
    public async users() { return new this.WWWTemplate({ title: 'Search Groups' }); }

    @Get('/groups/create')
    @Summary('Create group page')
    @UseBefore(YesAuth)
    @Render('group_create')
    public async groupCreate(
        @Locals('userInfo') userInfo: model.user.UserInfo,
    ) {
        // const userData = this.userInfo;
        return new this.WWWTemplate({'title': 'Create a Group', userInfo: userInfo});
    }

    /**
     * Create an Item for a Group
     * @param groupId Group's ID
     */
    @Get('/groups/:groupId/:groupName/create')
    @Summary('Group item creation page')
    @Render('catalog_creategroup')
    public async groupCatalogCreate(
        @Res() res: Res,
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('groupId', Number) filteredId: number,
        @PathParams('groupName', String) groupName: string
    ) {
        const userData = userInfo;
        if (!userData) {
            return res.redirect("/login?return=/groups/" + filteredId + "/" + groupName + "/manage");
        }
        if (!filteredId) {
            return res.redirect("/404");
        }
        let groupData;
        let userRole;
        try {
            groupData = await this.group.getInfo(filteredId);
            // If locked (aka banned), redirect to 404
            if (groupData.groupStatus === model.group.groupStatus.locked) {
                return res.redirect("/404");
            }
            userRole = await this.group.getUserRole(filteredId, userData.userId);
        } catch (e) {
            return res.redirect("/404");
        }
        if (userRole.permissions.manage === 0) {
            return res.redirect("/groups/" + filteredId + "/" + urlEncode(groupData.groupName));
        }
        let viewData = new this.WWWTemplate({'title': 'Create a Catalog Item'});
        viewData.page.groupId = groupData.groupId;
        viewData.page.groupName = groupData.groupName;
        viewData.page.groupEncodedName = urlEncode(groupData.groupName);
        return viewData;
    }

    @Get('/groups/:groupId')
    public async redirectToGroupPage(
        @Res() res: Res,
        @PathParams('groupId', Number) filteredCatalogId: number
    ): Promise<void> {
        if (!filteredCatalogId) {
            return res.redirect("/404");
        }
        let groupData;
        try {
            groupData = await this.group.getInfo(filteredCatalogId);
            const encodedName = urlEncode(groupData.groupName);
            return res.redirect("/groups/" + filteredCatalogId + "/" + encodedName);
        } catch (e) {
            return res.redirect("/404");
        }
    }

    /**
     * Load the Group Page for a specific group
     * @param groupId Group's ID
     */
    @Get('/groups/:groupId/:groupName')
    @Summary('Group page')
    @Render('groups')
    public async groupPage(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Res() res: Res,
        @PathParams('groupId', Number) filteredId: number, 
        @PathParams('groupName', String) groupName: string
    ) {
        if (!filteredId) {
            return res.redirect("/404");
        }
        let groupData;
        try {
            groupData = await this.group.getInfo(filteredId);
            // If locked (aka banned), redirect to 404
            if (groupData.groupStatus === model.group.groupStatus.locked) {
                let viewData = new this.WWWTemplate({'title': 'Locked Group'});
                viewData.page = {
                    groupStatus: 1,
                    groupId: filteredId,
                };
                return viewData;
            }
        } catch (e) {
            return res.redirect("/404");
        }
        let viewData = new this.WWWTemplate({'title': ''});
        viewData.page.groupId = groupData.groupId;
        viewData.page.groupName = groupData.groupName;
        viewData.page.groupEncodedName = urlEncode(groupData.groupName);
        viewData.page.groupOwnerUserId = groupData.groupOwnerUserId;
        viewData.page.groupMemberCount = groupData.groupMemberCount;
        viewData.page.groupDescription = groupData.groupDescription;
        viewData.page.groupIconCatalogId = groupData.groupIconCatalogId;
        viewData.userInfo = userInfo;

        viewData.title = groupData.groupName;
        return viewData;
    }

    /**
     * Load the Group Manage Page for a specific group
     * @param groupId Group's ID
     */
    @Get('/groups/:groupId/:groupName/manage')
    @UseBefore(YesAuth)
    @Render('group_manage')
    public async groupManage(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Res() res: Res,
        @PathParams('groupId', Number) filteredId: number, 
        @PathParams('groupName', String) groupName: string
    ) {
        const userData = userInfo;
        if (!userData) {
            return res.redirect("/login?return=/groups/" + filteredId + "/" + groupName + "/manage");
        }
        if (!filteredId) {
            return res.redirect("/404");
        }
        let groupData;
        let userRole;
        try {
            groupData = await this.group.getInfo(filteredId);
            // If locked (aka banned), redirect to 404
            if (groupData.groupStatus === model.group.groupStatus.locked) {
                return res.redirect("/404");
            }
            userRole = await this.group.getUserRole(filteredId, userData.userId);
        } catch (e) {
            return res.redirect("/404");
        }
        if (userRole.permissions.manage === 0) {
            return res.redirect("/groups/" + filteredId + "/" + urlEncode(groupData.groupName));
        }
        // Grab Funds
        let funds;
        try {
            funds = await this.group.getGroupFunds(filteredId);
        }catch(e) {
            return res.redirect("/500");
        }
        let viewData = new this.WWWTemplate({'title': ''});
        viewData.page.groupId = groupData.groupId;
        viewData.page.Primary = funds.Primary;
        viewData.page.Secondary = funds.Secondary;
        viewData.page.groupName = groupData.groupName;
        viewData.page.groupEncodedName = urlEncode(groupData.groupName);
        viewData.page.groupOwnerUserId = groupData.groupOwnerUserId;
        viewData.page.groupMemberCount = groupData.groupMemberCount;
        viewData.page.groupDescription = groupData.groupDescription;
        viewData.page.groupIconCatalogId = groupData.groupIconCatalogId;
        viewData.page.groupMembershipApprovalRequired = groupData.groupMembershipApprovalRequired;

        viewData.title = groupData.groupName;
        return viewData;
    }
}
