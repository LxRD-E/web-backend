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
const socket_controllers_1 = require("socket-controllers");
const controller_1 = require("../../controllers/controller");
let ChatController = class ChatController extends controller_1.default {
    connection(socket) {
        console.log("client connected");
    }
    disconnect(socket) {
        console.log("client disconnected");
    }
    save(socket, message) {
        console.log("received message:", message);
        console.log("setting id to the message and sending it back to the client");
        message.id = 1;
        socket.emit("message_saved", message);
    }
};
__decorate([
    socket_controllers_1.OnConnect(),
    __param(0, socket_controllers_1.ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "connection", null);
__decorate([
    socket_controllers_1.OnDisconnect(),
    __param(0, socket_controllers_1.ConnectedSocket()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "disconnect", null);
__decorate([
    socket_controllers_1.OnMessage("save"),
    __param(0, socket_controllers_1.ConnectedSocket()), __param(1, socket_controllers_1.MessageBody()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "save", null);
ChatController = __decorate([
    socket_controllers_1.SocketController()
], ChatController);
exports.ChatController = ChatController;

