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
var GameState;
(function (GameState) {
    GameState[GameState["public"] = 1] = "public";
    GameState[GameState["private"] = 2] = "private";
    GameState[GameState["underReview"] = 3] = "underReview";
})(GameState = exports.GameState || (exports.GameState = {}));
var ScriptType;
(function (ScriptType) {
    ScriptType[ScriptType["server"] = 1] = "server";
    ScriptType[ScriptType["client"] = 2] = "client";
})(ScriptType = exports.ScriptType || (exports.ScriptType = {}));
var GameClosed;
(function (GameClosed) {
    GameClosed[GameClosed["false"] = 0] = "false";
    GameClosed[GameClosed["true"] = 1] = "true";
})(GameClosed = exports.GameClosed || (exports.GameClosed = {}));
class Map {
}
__decorate([
    common_1.PropertyType(Number),
    __metadata("design:type", Number)
], Map.prototype, "mapId", void 0);
__decorate([
    common_1.PropertyType(Number),
    __metadata("design:type", Number)
], Map.prototype, "gameId", void 0);
__decorate([
    common_1.PropertyType(Number),
    __metadata("design:type", String)
], Map.prototype, "scriptUrl", void 0);
__decorate([
    common_1.PropertyType(String),
    __metadata("design:type", String)
], Map.prototype, "createdAt", void 0);
__decorate([
    common_1.PropertyType(String),
    __metadata("design:type", String)
], Map.prototype, "updatedAt", void 0);
exports.Map = Map;
class Script {
}
__decorate([
    common_1.PropertyType(Number),
    __metadata("design:type", Number)
], Script.prototype, "scriptId", void 0);
__decorate([
    common_1.PropertyType(Number),
    __metadata("design:type", Number)
], Script.prototype, "gameId", void 0);
__decorate([
    common_1.PropertyType(String),
    __metadata("design:type", String)
], Script.prototype, "scriptUrl", void 0);
__decorate([
    common_1.PropertyType(String),
    __metadata("design:type", String)
], Script.prototype, "createdAt", void 0);
__decorate([
    common_1.PropertyType(String),
    __metadata("design:type", String)
], Script.prototype, "updatedAt", void 0);
__decorate([
    common_1.PropertyType(String),
    __metadata("design:type", String)
], Script.prototype, "scriptName", void 0);
exports.Script = Script;
class GameInfo {
}
__decorate([
    common_1.PropertyType(Number),
    __metadata("design:type", Number)
], GameInfo.prototype, "gameId", void 0);
__decorate([
    common_1.PropertyType(String),
    __metadata("design:type", String)
], GameInfo.prototype, "gameName", void 0);
__decorate([
    common_1.PropertyType(String),
    __metadata("design:type", String)
], GameInfo.prototype, "gameDescription", void 0);
__decorate([
    common_1.PropertyType(Number),
    __metadata("design:type", Number)
], GameInfo.prototype, "maxPlayers", void 0);
__decorate([
    common_1.PropertyType(Number),
    __metadata("design:type", Number)
], GameInfo.prototype, "iconAssetId", void 0);
__decorate([
    common_1.PropertyType(Number),
    __metadata("design:type", Number)
], GameInfo.prototype, "thumbnailAssetId", void 0);
__decorate([
    common_1.PropertyType(Number),
    __metadata("design:type", Number)
], GameInfo.prototype, "visitCount", void 0);
__decorate([
    common_1.PropertyType(Number),
    __metadata("design:type", Number)
], GameInfo.prototype, "playerCount", void 0);
__decorate([
    common_1.PropertyType(Number),
    __metadata("design:type", Number)
], GameInfo.prototype, "likeCount", void 0);
__decorate([
    common_1.PropertyType(Number),
    __metadata("design:type", Number)
], GameInfo.prototype, "dislikeCount", void 0);
__decorate([
    common_1.PropertyType(Number),
    __metadata("design:type", Number)
], GameInfo.prototype, "creatorId", void 0);
__decorate([
    common_1.PropertyType(String),
    __metadata("design:type", String)
], GameInfo.prototype, "createdAt", void 0);
__decorate([
    common_1.PropertyType(String),
    __metadata("design:type", String)
], GameInfo.prototype, "updatedAt", void 0);
exports.GameInfo = GameInfo;
class GameSearchResult {
}
exports.GameSearchResult = GameSearchResult;
class GameServerPlayer {
}
exports.GameServerPlayer = GameServerPlayer;
class GameServer {
}
exports.GameServer = GameServer;

