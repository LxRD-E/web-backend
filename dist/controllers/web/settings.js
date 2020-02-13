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
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@tsed/common");
const swagger_1 = require("@tsed/swagger");
const controller_1 = require("../controller");
const Auth_1 = require("../../middleware/Auth");
let WWWSettingsController = class WWWSettingsController extends controller_1.default {
    transactions() {
        return new this.WWWTemplate({
            title: 'Account Settings',
        });
    }
};
__decorate([
    common_1.Get('/settings'),
    swagger_1.Summary('Get user settings'),
    common_1.Render('settings'),
    common_1.UseBefore(Auth_1.YesAuth),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WWWSettingsController.prototype, "transactions", null);
WWWSettingsController = __decorate([
    common_1.Controller('/')
], WWWSettingsController);
exports.WWWSettingsController = WWWSettingsController;

