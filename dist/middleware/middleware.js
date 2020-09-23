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
const feed = require("./v1/feed");
exports.feed = feed;
const reportAbuse = require("./v1/report-abuse");
exports.reportAbuse = reportAbuse;
const staff = require("./v1/staff");
exports.staff = staff;
const user = require("./v1/user");
exports.user = user;
const group = require("./v1/group");
exports.group = group;
const game = require("./v1/game");
exports.game = game;
const userReferral = require("./v1/user-referral");
exports.userReferral = userReferral;
const tradeAds = require("./v1/trade-ads");
exports.tradeAds = tradeAds;
const common_1 = require("@tsed/common");
const controller_1 = require("../controllers/controller");
const Filter_1 = require("../helpers/Filter");
const Auth_1 = require("./Auth");
exports.YesAuth = Auth_1.YesAuth;
exports.NoAuth = Auth_1.NoAuth;
const auth_1 = require("../dal/auth");
exports.csrf = auth_1.csrf;
let ValidatePaging = class ValidatePaging extends controller_1.default {
    use(offset = 0, limit = 100, sort = 'desc') {
        if (sort !== 'desc' && sort !== 'asc') {
            throw new this.BadRequest('InvalidSort');
        }
        if (limit > 100 || limit <= 0) {
            throw new this.BadRequest('InvalidLimit');
        }
        if (offset < 0) {
            throw new this.BadRequest('InvalidOffset');
        }
        if (offset >= Number.MAX_SAFE_INTEGER) {
            throw new this.BadRequest('InvalidOffset');
        }
    }
};
__decorate([
    __param(0, common_1.QueryParams('offset', Number)),
    __param(1, common_1.QueryParams('limit', Number)),
    __param(2, common_1.QueryParams('sort', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", void 0)
], ValidatePaging.prototype, "use", null);
ValidatePaging = __decorate([
    common_1.Middleware()
], ValidatePaging);
exports.ValidatePaging = ValidatePaging;
let ConvertIdsToCsv = class ConvertIdsToCsv extends controller_1.default {
    use(ids, req) {
        if (!ids) {
            throw new this.BadRequest('InvalidIds');
        }
        const idsArray = ids.split(',');
        if (idsArray.length < 1) {
            throw new this.BadRequest('InvalidIds');
        }
        const filteredIds = [];
        let allIdsValid = true;
        idsArray.forEach(id => {
            const userId = Filter_1.filterId(id);
            if (!userId) {
                allIdsValid = false;
            }
            filteredIds.push(userId);
        });
        if (!allIdsValid) {
            throw new this.BadRequest('InvalidIds');
        }
        const safeIds = Array.from(new Set(filteredIds));
        if (safeIds.length > 25) {
            throw new this.BadRequest('TooManyIds');
        }
        req.query.ids = safeIds;
    }
};
__decorate([
    __param(0, common_1.QueryParams('ids', String)),
    __param(1, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ConvertIdsToCsv.prototype, "use", null);
ConvertIdsToCsv = __decorate([
    common_1.Middleware()
], ConvertIdsToCsv);
exports.ConvertIdsToCsv = ConvertIdsToCsv;
const common_2 = require("@tsed/common");
const core_1 = require("@tsed/core");
function UserInfo() {
    return core_1.applyDecorators(common_2.Locals('userInfo'));
}
exports.UserInfo = UserInfo;

