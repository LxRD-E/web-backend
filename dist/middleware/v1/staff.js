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
const controller_1 = require("../../controllers/controller");
const model = require("../../models/models");
class StaffValidateLevelOne extends controller_1.default {
    async use(userInfo) {
        if (!(userInfo.staff >= 1)) {
            throw new this.BadRequest('InvalidPermissions');
        }
    }
}
__decorate([
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession]),
    __metadata("design:returntype", Promise)
], StaffValidateLevelOne.prototype, "use", null);
exports.StaffValidateLevelOne = StaffValidateLevelOne;
const dal = new controller_1.default();
exports.AddPermissionsToLocals = async (req, res, next) => {
    try {
        let userInfo = res.locals.userInfo;
        if (!userInfo || userInfo.staff === 0) {
            return next();
        }
        userInfo.staffPermissions = await dal.staff.getPermissions(userInfo.userId);
        res.locals.hasPerm = (permission) => {
            return userInfo.staff >= 100 || userInfo.staffPermissions.includes(model.staff.Permission[permission]);
        };
        next();
    }
    catch (err) {
        return next(err);
    }
};
exports.validate = (level, ...extraLevels) => {
    return async (req, res, next) => {
        try {
            const session = req.session;
            const userInfo = Object.assign({}, res.locals.userInfo);
            if (!userInfo) {
                throw new dal.Conflict('InvalidPermissions');
            }
            if (session && session.userdata) {
                if (session.impersonateUserId) {
                    console.log('[info] current session data', session.userdata);
                    let trueUserId = session.userdata.id || session.userdata.userId || session.userdata.userid;
                    const _newRequest = await dal.user.getInfo(trueUserId, ['userId', 'username', 'staff']);
                    userInfo.userId = _newRequest.userId;
                    userInfo.username = _newRequest.username;
                    userInfo.staff = _newRequest.staff;
                }
            }
            if (!level) {
                if (userInfo.staff >= 1) {
                    return next();
                }
                else {
                    throw new dal.Conflict('InvalidPermissions');
                }
            }
            if (userInfo.staff >= 100) {
                return next();
            }
            const userPermissions = await dal.staff.getPermissions(userInfo.userId);
            if (userPermissions.includes(level)) {
                return next();
            }
            throw new dal.Conflict('InvalidPermissions');
        }
        catch (err) {
            return next(err);
        }
    };
};

