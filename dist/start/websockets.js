"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WebSocket = require("ws");
const session_1 = require("./session");
const http = require("http");
const querystring = require("querystring");
const crypto = require("crypto");
const Auth = require("../dal/auth");
exports.wss = new WebSocket.Server({
    noServer: true,
});
exports.webSocketServer = http.createServer();
exports.webSocketServer.on('error', err => {
    console.log(err);
});
exports.webSocketServer.listen(8080);
exports.default = () => {
    exports.webSocketServer.on('upgrade', function upgrade(request, socket, head) {
        if (request.url.match(/\/game-sockets\/websocket.aspx/g)) {
            let decodedAuth;
            try {
                const queryinurl = request.url.slice(request.url.indexOf('?') + 1, request.url.length);
                const query = querystring.parse(queryinurl);
                const authCode = query['gameAuth'];
                if (!authCode || typeof authCode !== 'string') {
                    socket.destroy();
                    return;
                }
                decodedAuth = Auth.decodeGameAuthCode(authCode);
                request.url = request.url.slice(0, request.url.indexOf('?'));
            }
            catch (e) {
                socket.destroy();
                return;
            }
            exports.wss.handleUpgrade(request, socket, head, function (ws) {
                exports.wss.emit('connection', ws, request, decodedAuth);
            });
        }
        else {
            session_1.parser(request, {}, () => {
                if (!request.session || !request.session.userdata || !request.session.userdata.id) {
                    socket.destroy();
                    return;
                }
                try {
                    const queryinurl = request.url.slice(request.url.indexOf('?') + 1, request.url.length);
                    const query = querystring.parse(queryinurl);
                    const csrf = query['csrf'];
                    if (!csrf || typeof csrf !== 'string') {
                        socket.destroy();
                        return;
                    }
                    if (csrf.length !== 32) {
                        throw false;
                    }
                    if (crypto.timingSafeEqual(Buffer.from(request.session.userdata.csrf, 'hex'), Buffer.from(csrf, 'hex'))) {
                    }
                    else {
                        throw false;
                    }
                    request.url = request.url.slice(0, request.url.indexOf('?'));
                }
                catch (e) {
                    socket.destroy();
                    return;
                }
                exports.wss.handleUpgrade(request, socket, head, function (ws) {
                    exports.wss.emit('connection', ws, request);
                });
            });
        }
    });
};

