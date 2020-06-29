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
const _middleware_1 = require("./_middleware");
const model = require("../../models/models");
let ValidateGameCreationPermissions = class ValidateGameCreationPermissions extends _middleware_1.default {
    constructor() {
        super(...arguments);
        this.UserCache = this.cache('userId');
    }
    async use(userInfo, res) {
        return;
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
let ServerAuth = class ServerAuth extends _middleware_1.default {
    async use(req, res) {
        let auth = req.header('authorization');
        if (!auth) {
            throw new Error('No authorization header specified');
        }
        let results = await this.auth.decodeGameServerAuthCode(auth);
        if (this.moment().add(3, 'days').isSameOrAfter(this.moment(results.iat * 1000))) {
            throw new Error('Bad authorization header');
        }
        res.locals.userInfo = await this.user.getInfo(results.userId, ['userId', 'username', 'passwordChanged', 'primaryBalance', 'secondaryBalance', 'theme', 'banned', 'staff', 'dailyAward']);
    }
};
__decorate([
    __param(0, common_1.Req()),
    __param(1, common_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ServerAuth.prototype, "use", null);
ServerAuth = __decorate([
    common_1.Middleware()
], ServerAuth);
exports.ServerAuth = ServerAuth;

