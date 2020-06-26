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
const middleware = require("../../middleware/middleware");
const controller_1 = require("../controller");
const common_1 = require("@tsed/common");
const swagger_1 = require("@tsed/swagger");
let DataPersistenceController = class DataPersistenceController extends controller_1.default {
    constructor() {
        super();
    }
    async confirmOwnership(gameId, userId) {
        let gameData = await this.game.getInfo(gameId, ['creatorType', 'creatorId']);
        if (gameData.creatorType === model.catalog.creatorType.User) {
            if (gameData.creatorId !== userId) {
                throw new this.Conflict('Unauthorized');
            }
        }
        else if (gameData.creatorType === model.catalog.creatorType.Group) {
            let groupData = await this.group.getInfo(gameData.creatorId);
            if (groupData.groupOwnerUserId !== userId) {
                throw new this.Conflict('Unauthorized');
            }
        }
        else {
            throw new Error('Not Implemented');
        }
    }
    metaData(req, res, gameId) {
        throw new Error('Disabled');
    }
    async get(userInfo, gameId, key) {
        await this.confirmOwnership(gameId, userInfo.userId);
        let data = await this.dataPersistence.get(gameId, key);
        return {
            value: data,
        };
    }
    async set(userInfo, gameId, key, request) {
        await this.confirmOwnership(gameId, userInfo.userId);
        let value = request.value;
        await this.dataPersistence.set(gameId, key, value);
        return {};
    }
};
__decorate([
    common_1.Get('/:gameId/metadata'),
    swagger_1.Summary('Data persistence metadata'),
    __param(0, common_1.Req()),
    __param(1, common_1.Res()),
    __param(2, common_1.PathParams('gameId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Number]),
    __metadata("design:returntype", void 0)
], DataPersistenceController.prototype, "metaData", null);
__decorate([
    common_1.Get('/:gameId/get/:key'),
    swagger_1.Summary('Get data'),
    common_1.Use(middleware.game.ServerAuth),
    swagger_1.Returns(409, { type: model.Error, description: 'Unauthorized: Not authorized\n' }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('gameId', Number)),
    __param(2, common_1.PathParams('key', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession, Number, String]),
    __metadata("design:returntype", Promise)
], DataPersistenceController.prototype, "get", null);
__decorate([
    common_1.Post('/:gameId/set/:key'),
    swagger_1.Summary('Set data'),
    common_1.Use(middleware.game.ServerAuth),
    swagger_1.Returns(409, { type: model.Error, description: 'Unauthorized: Unauthorized\n' }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('gameId', Number)),
    __param(2, common_1.PathParams('key', String)),
    __param(3, common_1.Required()),
    __param(3, common_1.BodyParams(model.dataPersistence.SetDataRequest)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession, Number, String, model.dataPersistence.SetDataRequest]),
    __metadata("design:returntype", Promise)
], DataPersistenceController.prototype, "set", null);
DataPersistenceController = __decorate([
    common_1.Controller('/data-persistence'),
    swagger_1.Description('Internal game data persistence method. Note that all methods require middleware.game.ServerAuth, so they will not be accessible to normal players'),
    __metadata("design:paramtypes", [])
], DataPersistenceController);
exports.default = DataPersistenceController;

