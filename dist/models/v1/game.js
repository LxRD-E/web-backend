"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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

