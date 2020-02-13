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
class SignupRequest {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], SignupRequest.prototype, "username", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], SignupRequest.prototype, "password", void 0);
__decorate([
    common_1.Required(),
    common_1.MinItems(3),
    common_1.MaxItems(3),
    common_1.PropertyType(Number),
    swagger_1.Description('Format: Day, Month, Year'),
    swagger_1.Example([1, 12, 2000]),
    __metadata("design:type", Array)
], SignupRequest.prototype, "birth", void 0);
exports.SignupRequest = SignupRequest;
class UsernameChangedResponseOK {
}
__decorate([
    common_1.Required(),
    swagger_1.Example(true),
    __metadata("design:type", Boolean)
], UsernameChangedResponseOK.prototype, "success", void 0);
__decorate([
    common_1.Required(),
    swagger_1.Example('newUsername'),
    __metadata("design:type", String)
], UsernameChangedResponseOK.prototype, "newUsername", void 0);
exports.UsernameChangedResponseOK = UsernameChangedResponseOK;
class SignupResponseOK {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], SignupResponseOK.prototype, "username", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], SignupResponseOK.prototype, "userId", void 0);
exports.SignupResponseOK = SignupResponseOK;

