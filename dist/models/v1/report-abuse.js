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
var ReportReason;
(function (ReportReason) {
    ReportReason[ReportReason["Inappropriate Language"] = 1] = "Inappropriate Language";
    ReportReason[ReportReason["Asking for or Giving Private Information"] = 2] = "Asking for or Giving Private Information";
    ReportReason[ReportReason["Bullying, Harassment, Discrimination"] = 3] = "Bullying, Harassment, Discrimination";
    ReportReason[ReportReason["Dating"] = 4] = "Dating";
    ReportReason[ReportReason["Exploiting, Cheating, Scamming"] = 5] = "Exploiting, Cheating, Scamming";
    ReportReason[ReportReason["Account Theft - Phishing, Hacking, Trading"] = 6] = "Account Theft - Phishing, Hacking, Trading";
    ReportReason[ReportReason["Inappropriate Content - Place, Image, Model"] = 7] = "Inappropriate Content - Place, Image, Model";
    ReportReason[ReportReason["Real Life Threats & Suicide Threats"] = 8] = "Real Life Threats & Suicide Threats";
    ReportReason[ReportReason["Other rule violation"] = 9] = "Other rule violation";
})(ReportReason = exports.ReportReason || (exports.ReportReason = {}));
var ReportStatus;
(function (ReportStatus) {
    ReportStatus[ReportStatus["PendingReview"] = 1] = "PendingReview";
    ReportStatus[ReportStatus["ValidReport"] = 2] = "ValidReport";
    ReportStatus[ReportStatus["InvalidReport"] = 3] = "InvalidReport";
})(ReportStatus = exports.ReportStatus || (exports.ReportStatus = {}));
class ReportedStatusEntry {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], ReportedStatusEntry.prototype, "reportId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], ReportedStatusEntry.prototype, "reportUserId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], ReportedStatusEntry.prototype, "userStatusId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], ReportedStatusEntry.prototype, "reportReason", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], ReportedStatusEntry.prototype, "reportStatus", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], ReportedStatusEntry.prototype, "createdAt", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], ReportedStatusEntry.prototype, "status", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], ReportedStatusEntry.prototype, "userId", void 0);
exports.ReportedStatusEntry = ReportedStatusEntry;

