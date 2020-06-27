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
const common_1 = require("@tsed/common");
const swagger_1 = require("@tsed/swagger");
const model = require("../../models/models");
const controller_1 = require("../controller");
const Filter_1 = require("../../helpers/Filter");
const UserModel = require("../../models/v1/user");
const Auth_1 = require("../../middleware/Auth");
let WWWCatalogController = class WWWCatalogController extends controller_1.default {
    constructor() {
        super();
    }
    getCatalog() {
        return new this.WWWTemplate({ title: 'Catalog' });
    }
    async catalogItemCreate(userInfo) {
        let ViewData = new this.WWWTemplate({ 'title': '' });
        ViewData.page.loadStaffPage = userInfo.staff >= 1 ? true : false;
        ViewData.title = "Create an Item";
        return ViewData;
    }
    async catalogItemEdit(userInfo, catalogId) {
        let ViewData = new this.WWWTemplate({ 'title': '' });
        let catalogData;
        let salesCount;
        try {
            catalogData = await this.catalog.getInfo(catalogId, ['catalogId', 'catalogName', 'description', 'collectible', 'forSale', 'creatorId', 'creatorType', 'category', 'dateCreated', 'maxSales', 'price', 'currency', 'status']);
            salesCount = await this.catalog.countSales(catalogId);
        }
        catch (e) {
            throw new this.BadRequest('InvalidCatalogId');
        }
        if (userInfo.staff >= 2) {
        }
        else if (catalogData.creatorType === model.catalog.creatorType.Group) {
            const groupRole = await this.group.getUserRole(catalogData.creatorId, userInfo.userId);
            if (groupRole.permissions.manage === 0) {
                throw new this.BadRequest('InvalidPermissions');
            }
        }
        else if (catalogData.creatorType === model.catalog.creatorType.User) {
            if (catalogData.creatorId !== userInfo.userId) {
                throw new this.BadRequest('InvalidPermissions');
            }
        }
        ViewData.page.loadStaffPage = userInfo.staff >= 2 ? true : false;
        ViewData.page.catalogId = catalogData.catalogId;
        ViewData.page.catalogEncodedName = Filter_1.urlEncode(catalogData.catalogName);
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
    async redirectToCatalogItem(res, catalogId) {
        let catalogData;
        try {
            catalogData = await this.catalog.getInfo(catalogId, ['catalogName']);
            const encodedName = Filter_1.urlEncode(catalogData.catalogName);
            return res.redirect("/catalog/" + catalogId + "/" + encodedName);
        }
        catch (e) {
            throw new this.BadRequest('InvalidCatalogId');
        }
    }
    async catalogItem(catalogId) {
        let catalogData;
        let salesCount;
        try {
            catalogData = await this.catalog.getInfo(catalogId, ['catalogId', 'catalogName', 'description', 'collectible', 'forSale', 'creatorId', 'creatorType', 'category', 'dateCreated', 'maxSales', 'price', 'currency', 'averagePrice', 'userId']);
            salesCount = await this.catalog.countSales(catalogId);
        }
        catch (e) {
            throw new this.BadRequest('InvalidCatalogId');
        }
        let ViewData = new this.WWWTemplate({ 'title': '' });
        ViewData.page.catalogId = catalogData.catalogId;
        ViewData.page.catalogEncodedName = Filter_1.urlEncode(catalogData.catalogName);
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
        }
        else {
            ViewData.page.unique = 0;
        }
        ViewData.page.price = catalogData.price;
        ViewData.page.currency = catalogData.currency;
        ViewData.page.sales = salesCount;
        ViewData.page.averagePrice = catalogData.averagePrice;
        ViewData.title = catalogData.catalogName;
        return ViewData;
    }
};
__decorate([
    common_1.Get('/catalog'),
    common_1.Render('catalog'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WWWCatalogController.prototype, "getCatalog", null);
__decorate([
    common_1.Get('/catalog/create'),
    common_1.UseBefore(Auth_1.YesAuth),
    common_1.Render('catalog_create'),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserModel.SessionUserInfo]),
    __metadata("design:returntype", Promise)
], WWWCatalogController.prototype, "catalogItemCreate", null);
__decorate([
    common_1.Get('/catalog/:catalogId/:catalogName/edit'),
    common_1.Use(Auth_1.YesAuth),
    common_1.Render('catalogitemedit'),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('catalogId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserModel.SessionUserInfo, Number]),
    __metadata("design:returntype", Promise)
], WWWCatalogController.prototype, "catalogItemEdit", null);
__decorate([
    common_1.Get('/catalog/:catalogId'),
    swagger_1.Summary('Redirect /:id/ to /:id/:name'),
    __param(0, common_1.Res()),
    __param(1, common_1.PathParams('catalogId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], WWWCatalogController.prototype, "redirectToCatalogItem", null);
__decorate([
    common_1.Get('/catalog/:catalogId/:catalogName'),
    swagger_1.Summary('Catalog item page'),
    common_1.Render('catalogitem'),
    __param(0, common_1.PathParams('catalogId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], WWWCatalogController.prototype, "catalogItem", null);
WWWCatalogController = __decorate([
    common_1.Controller("/"),
    __metadata("design:paramtypes", [])
], WWWCatalogController);
exports.WWWCatalogController = WWWCatalogController;

