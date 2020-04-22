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
const ts_httpexceptions_1 = require("ts-httpexceptions");
const common_1 = require("@tsed/common");
const Auth = require("../dal/auth");
const moment = require("moment");
let YesAuth = class YesAuth {
    use(req, res) {
        if (res.locals.userInfo && res.locals.userInfo.userId && typeof res.locals.userInfo.userId !== 'undefined') {
            return;
        }
        else {
            throw new ts_httpexceptions_1.Unauthorized('LoginRequired');
        }
    }
};
__decorate([
    __param(0, common_1.Req()), __param(1, common_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], YesAuth.prototype, "use", null);
YesAuth = __decorate([
    common_1.Middleware()
], YesAuth);
exports.YesAuth = YesAuth;
let NoAuth = class NoAuth {
    use(req, res) {
        if (!res.locals.userInfo || res.locals.userInfo && typeof res.locals.userInfo.userId === 'undefined') {
            return;
        }
        else {
            throw new ts_httpexceptions_1.Conflict('LogoutRequired');
        }
    }
};
__decorate([
    __param(0, common_1.Req()), __param(1, common_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], NoAuth.prototype, "use", null);
NoAuth = __decorate([
    common_1.Middleware()
], NoAuth);
exports.NoAuth = NoAuth;
let GameAuth = class GameAuth {
    use(req, res) {
        let data = req.query['authCode'];
        if (!data) {
            throw new ts_httpexceptions_1.Unauthorized('LoginRequired');
        }
        let gameAuthData = Auth.decodeGameAuthCode(data);
        if (!moment().add(15, 'seconds').isSameOrAfter(moment(gameAuthData.iat * 1000))) {
            throw new ts_httpexceptions_1.Unauthorized('LoginRequired');
        }
        let userInfo = res.locals.userInfo;
        userInfo = userInfo || {};
        userInfo.userId = gameAuthData.userId;
        userInfo.username = gameAuthData.username;
    }
};
__decorate([
    __param(0, common_1.Req()), __param(1, common_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], GameAuth.prototype, "use", null);
GameAuth = __decorate([
    common_1.Middleware()
], GameAuth);
exports.GameAuth = GameAuth;

