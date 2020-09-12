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
const controller_1 = require("./controller");
const common_1 = require("@tsed/common");
const swagger_1 = require("@tsed/swagger");
const config_1 = require("../helpers/config");
let DefaultController = class DefaultController extends controller_1.default {
    constructor() {
        super();
    }
    async getMetrics(key, res) {
        if (key !== config_1.default.trackerAuthorization) {
            throw new this.NotFound('NotFound');
        }
        res.header('content-type', 'text/plain');
        return;
    }
};
__decorate([
    common_1.Get('/metrics/:metricsKey'),
    swagger_1.Summary('Metrics information'),
    swagger_1.Hidden(),
    __param(0, common_1.PathParams('metricsKey', String)),
    __param(1, common_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], DefaultController.prototype, "getMetrics", null);
DefaultController = __decorate([
    common_1.Controller('/'),
    __metadata("design:paramtypes", [])
], DefaultController);
exports.default = DefaultController;

