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
class UpdateAvatarPayload {
}
__decorate([
    common_1.PropertyType(Number),
    __metadata("design:type", Array)
], UpdateAvatarPayload.prototype, "LegRGB", void 0);
__decorate([
    common_1.PropertyType(Number),
    __metadata("design:type", Array)
], UpdateAvatarPayload.prototype, "HeadRGB", void 0);
__decorate([
    common_1.PropertyType(Number),
    __metadata("design:type", Array)
], UpdateAvatarPayload.prototype, "TorsoRGB", void 0);
__decorate([
    common_1.PropertyType(Number),
    __metadata("design:type", Array)
], UpdateAvatarPayload.prototype, "Hats", void 0);
__decorate([
    common_1.PropertyType(Number),
    __metadata("design:type", Object)
], UpdateAvatarPayload.prototype, "Face", void 0);
__decorate([
    common_1.PropertyType(Number),
    __metadata("design:type", Object)
], UpdateAvatarPayload.prototype, "TShirt", void 0);
__decorate([
    common_1.PropertyType(Number),
    __metadata("design:type", Object)
], UpdateAvatarPayload.prototype, "Shirt", void 0);
__decorate([
    common_1.PropertyType(Number),
    __metadata("design:type", Object)
], UpdateAvatarPayload.prototype, "Pants", void 0);
__decorate([
    common_1.PropertyType(Number),
    __metadata("design:type", Object)
], UpdateAvatarPayload.prototype, "characterHead", void 0);
exports.UpdateAvatarPayload = UpdateAvatarPayload;
class AvatarPollResponseOK {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], AvatarPollResponseOK.prototype, "url", void 0);
exports.AvatarPollResponseOK = AvatarPollResponseOK;
class UserOutfit {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserOutfit.prototype, "outfitId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserOutfit.prototype, "userId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], UserOutfit.prototype, "name", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], UserOutfit.prototype, "url", void 0);
exports.UserOutfit = UserOutfit;
class UserOutfitAvatar {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserOutfitAvatar.prototype, "catalogId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserOutfitAvatar.prototype, "type", void 0);
exports.UserOutfitAvatar = UserOutfitAvatar;

