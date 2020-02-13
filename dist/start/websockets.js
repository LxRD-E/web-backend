"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WebSocket = require("ws");
const session_1 = require("./session");
const http = require("http");
const querystring = require("querystring");
const crypto = require("crypto");
exports.wss = new WebSocket.Server({
    noServer: true,
});
exports.webSocketServer = http.createServer();
exports.webSocketServer.listen(8080);
exports.default = () => {
    exports.webSocketServer.on('upgrade', function upgrade(request, socket, head) {
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
    });
};

