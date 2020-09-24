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
__decorate([
    common_1.PropertyType(String),
    __metadata("design:type", String)
], SignupRequest.prototype, "captcha", void 0);
__decorate([
    common_1.PropertyType(Number),
    swagger_1.Description('User referral ID'),
    __metadata("design:type", Number)
], SignupRequest.prototype, "referralId", void 0);
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
class LoginRequestOK {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], LoginRequestOK.prototype, "userId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], LoginRequestOK.prototype, "username", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Boolean)
], LoginRequestOK.prototype, "isTwoFactorRequired", void 0);
__decorate([
    common_1.PropertyType(String),
    __metadata("design:type", String)
], LoginRequestOK.prototype, "twoFactor", void 0);
exports.LoginRequestOK = LoginRequestOK;
class LoginTwoFactorResponseOK {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], LoginTwoFactorResponseOK.prototype, "userId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], LoginTwoFactorResponseOK.prototype, "username", void 0);
exports.LoginTwoFactorResponseOK = LoginTwoFactorResponseOK;
class GenerateAuthenticationCodeResponse {
}
__decorate([
    common_1.Required(),
    swagger_1.Description('The JWT that should be POSTed to /v1/auth/validate-authentication-code'),
    __metadata("design:type", String)
], GenerateAuthenticationCodeResponse.prototype, "code", void 0);
exports.GenerateAuthenticationCodeResponse = GenerateAuthenticationCodeResponse;
class ValidateAuthenticationCodeResponse {
}
__decorate([
    common_1.Required(),
    swagger_1.Description('The userId of the user'),
    __metadata("design:type", Number)
], ValidateAuthenticationCodeResponse.prototype, "userId", void 0);
__decorate([
    common_1.Required(),
    swagger_1.Description('The username of the user'),
    __metadata("design:type", String)
], ValidateAuthenticationCodeResponse.prototype, "username", void 0);
__decorate([
    common_1.Required(),
    swagger_1.Description('The timestamp of when the code was created at'),
    __metadata("design:type", Number)
], ValidateAuthenticationCodeResponse.prototype, "iat", void 0);
exports.ValidateAuthenticationCodeResponse = ValidateAuthenticationCodeResponse;
class CookieConsentInformation {
}
__decorate([
    common_1.Required(),
    swagger_1.Description('Signifies consent to googleAnalytics'),
    __metadata("design:type", Boolean)
], CookieConsentInformation.prototype, "googleAnalytics", void 0);
exports.CookieConsentInformation = CookieConsentInformation;
class UserCountryResponse {
}
__decorate([
    common_1.Required(),
    swagger_1.Description('User country or "UNKNOWN"'),
    __metadata("design:type", String)
], UserCountryResponse.prototype, "country", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Boolean)
], UserCountryResponse.prototype, "cookiePromptRequired", void 0);
exports.UserCountryResponse = UserCountryResponse;

