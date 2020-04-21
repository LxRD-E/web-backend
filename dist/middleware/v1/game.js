"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@tsed/common");
const _middleware_1 = require("./_middleware");
const model = require("../../models/models");
let ValidateGameCreationPermissions = class ValidateGameCreationPermissions extends _middleware_1.default {
    constructor() {
        super(...arguments);
        this.UserCache = this.cache('userId');
    }
    async use(userInfo, res) {
        let cacheResults = this.UserCache.checkForCache(userInfo.userId);
        if (cacheResults) {
            if (!cacheResults.isGameDev) {
                throw new this.Conflict('GameDeveloperPermissionsRequired');
            }
            else {
                return;
            }
        }
        if (userInfo.staff >= 1) {
        }
        else {
            let devStatus = await this.user.getInfo(userInfo.userId, ['isDeveloper']);
            if (devStatus.isDeveloper === 1) {
            }
            else {
                throw new this.Conflict('GameDeveloperPermissionsRequired');
            }
        }
        this.UserCache.addToCache({
            data: { isGameDev: true, userId: userInfo.userId },
            createdAt: new Date().getTime(),
        });
    }
};
__decorate([
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession, Object]),
    __metadata("design:returntype", Promise)
], ValidateGameCreationPermissions.prototype, "use", null);
ValidateGameCreationPermissions = __decorate([
    common_1.Middleware()
], ValidateGameCreationPermissions);
exports.ValidateGameCreationPermissions = ValidateGameCreationPermissions;
//# sourceMappingURL=game.js.map