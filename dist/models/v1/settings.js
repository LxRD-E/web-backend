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
class EmailModelForSettings {
}
__decorate([
    common_1.PropertyType(String),
    __metadata("design:type", Object)
], EmailModelForSettings.prototype, "email", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], EmailModelForSettings.prototype, "status", void 0);
exports.EmailModelForSettings = EmailModelForSettings;
class UserSettings {
}
__decorate([
    common_1.PropertyType(String),
    __metadata("design:type", Object)
], UserSettings.prototype, "blurb", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserSettings.prototype, "tradingEnabled", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserSettings.prototype, "theme", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Object)
], UserSettings.prototype, "forumSignature", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", EmailModelForSettings)
], UserSettings.prototype, "email", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserSettings.prototype, "2faEnabled", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], UserSettings.prototype, "birthDate", void 0);
exports.UserSettings = UserSettings;

