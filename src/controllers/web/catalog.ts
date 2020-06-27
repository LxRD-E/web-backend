import { Controller, Get, All, Next, Req, Res, UseBefore, Render, QueryParams, PathParams, Redirect, Response, Request, Locals, UseAfter, Required, Use, UseBeforeEach, ModelStrict } from "@tsed/common";
import { Description, Summary, Returns } from "@tsed/swagger"; // import swagger Ts.ED module
import { Exception, NotFound, BadRequest } from "ts-httpexceptions";
import * as Express from 'express';
import * as model from '../../models/models';
import { WWWTemplate } from '../../models/v2/Www';
import controller from '../controller'
import moment = require("moment");
import xss = require('xss');
import Config from '../../helpers/config';
import { urlEncode } from '../../helpers/Filter';
// Models
import * as UserModel from '../../models/v1/user';
import { NoAuth, YesAuth } from "../../middleware/Auth";
import {numberWithCommas} from '../../helpers/Filter';

@Controller("/")
export class WWWCatalogController extends controller {
    constructor() {
        super();
    }

    @Get('/catalog')
    @Render('catalog')
    public getCatalog() {
        return new this.WWWTemplate({title: 'Catalog'});
    }

    @Get('/catalog/create')
    @UseBefore(YesAuth)
    @Render('catalog_create')
    public async catalogItemCreate(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        let ViewData = new this.WWWTemplate({'title': ''});
        ViewData.page.loadStaffPage = userInfo.staff >= 1 ? true : false;
        ViewData.title = "Create an Item";
        return ViewData;
    }

    @Get('/catalog/:catalogId/:catalogName/edit')
    @Use(YesAuth)
    @Render('catalogitemedit')
    public async catalogItemEdit(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
        @PathParams('catalogId', Number) catalogId: number
    ) {
        let ViewData = new this.WWWTemplate({'title': ''});
        let catalogData;
        let salesCount;
        try {
            catalogData = await this.catalog.getInfo(catalogId, ['catalogId', 'catalogName', 'description', 'collectible', 'forSale', 'creatorId', 'creatorType', 'category', 'dateCreated', 'maxSales', 'price', 'currency', 'status']);
            salesCount = await this.catalog.countSales(catalogId);
        } catch (e) {
            throw new this.BadRequest('InvalidCatalogId');
        }
        if (userInfo.staff >= 2) {
            // idk yet
        }else if (catalogData.creatorType === model.catalog.creatorType.Group) {
            const groupRole = await this.group.getUserRole(catalogData.creatorId, userInfo.userId);
            if (groupRole.permissions.manage === 0) {
                throw new this.BadRequest('InvalidPermissions');
            }
        }else if (catalogData.creatorType === model.catalog.creatorType.User) {
            if (catalogData.creatorId !== userInfo.userId) {
                throw new this.BadRequest('InvalidPermissions');
            }
        }
        ViewData.page.loadStaffPage = userInfo.staff >= 2 ? true : false;

        ViewData.page.catalogId = catalogData.catalogId;
        ViewData.page.catalogEncodedName = urlEncode(catalogData.catalogName);
        ViewData.page.catalogName = catalogData.catalogName;
        ViewData.page.description = catalogData.description;
        ViewData.page.collectible = catalogData.collectible;
        ViewData.page.category = catalogData.category;
        ViewData.page.forSale = catalogData.forSale;
        ViewData.page.userId = catalogData.creatorId;
        ViewData.page.category = catalogData.category;
        ViewData.page.dateCreated = catalogData.dateCreated;
        ViewData.page.maxSales = catalogData.maxSales;
        ViewData.page.price = catalogData.price;
        ViewData.page.currency = catalogData.currency;
        ViewData.page.sales = salesCount;
        ViewData.page.status = catalogData.status;
        ViewData.title = catalogData.catalogName;
        ViewData.page.categories = model.catalog.category;
        return ViewData;
    }

    @Get('/catalog/:catalogId')
    @Summary('Redirect /:id/ to /:id/:name')
    public async redirectToCatalogItem(
        @Res() res: Res,
        @PathParams('catalogId', Number) catalogId: number,
    ) {
        let catalogData;
        try {
            catalogData = await this.catalog.getInfo(catalogId, ['catalogName']);
            const encodedName = urlEncode(catalogData.catalogName);
            return res.redirect("/catalog/" + catalogId + "/" + encodedName);
        } catch (e) {
            throw new this.BadRequest('InvalidCatalogId');
        }
    }

    @Get('/catalog/:catalogId/:catalogName')
    @Summary('Catalog item page')
    @Render('catalogitem')
    public async catalogItem(
        @PathParams('catalogId', Number) catalogId: number
    ) {
        let catalogData;
        let salesCount;
        try {
            catalogData = await this.catalog.getInfo(catalogId, ['catalogId', 'catalogName', 'description', 'collectible', 'forSale', 'creatorId', 'creatorType', 'category', 'dateCreated', 'maxSales', 'price', 'currency', 'averagePrice', 'userId']);
            salesCount = await this.catalog.countSales(catalogId);
        } catch (e) {
            throw new this.BadRequest('InvalidCatalogId');
        }
        let ViewData = new this.WWWTemplate({'title': ''});
        ViewData.page.catalogId = catalogData.catalogId;
        ViewData.page.catalogEncodedName = urlEncode(catalogData.catalogName);
        ViewData.page.catalogName = catalogData.catalogName;
        ViewData.page.description = catalogData.description;
        ViewData.page.collectible = catalogData.collectible;
        ViewData.page.forSale = catalogData.forSale;
        ViewData.page.creatorType = catalogData.creatorType;
        ViewData.page.creatorId = catalogData.creatorId;
        ViewData.page.userId = catalogData.userId;
        ViewData.page.category = catalogData.category;
        ViewData.page.dateCreated = catalogData.dateCreated;
        ViewData.page.maxSales = catalogData.maxSales;
        if (catalogData.maxSales > 0) {
            ViewData.page.unique = 1;
        } else {
            ViewData.page.unique = 0;
        }
        ViewData.page.price = catalogData.price;
        ViewData.page.currency = catalogData.currency;
        ViewData.page.sales = salesCount;
        ViewData.page.averagePrice = catalogData.averagePrice;
        ViewData.title = catalogData.catalogName;
        return ViewData;
    }
}
