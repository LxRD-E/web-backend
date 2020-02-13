import WebSocket =  require('ws');
import {parser} from './session';
import * as http from 'http';
import * as querystring from 'querystring';
import * as crypto from 'crypto';
import { Request, Response } from 'express';
import {validateCsrf} from '../dal/auth';

export const wss = new WebSocket.Server({
    noServer: true,
});

export const webSocketServer = http.createServer();
webSocketServer.listen(8080);

export default (): void => {
    webSocketServer.on('upgrade', function upgrade(request, socket, head) {
        parser(request, {} as unknown as Response, () => {
            if (!request.session || !request.session.userdata || !request.session.userdata.id) {
                socket.destroy();
                return;
            }
            try {
                const queryinurl = request.url.slice(request.url.indexOf('?')+1, request.url.length);
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
                } else {
                    throw false;
                }
                request.url = request.url.slice(0, request.url.indexOf('?'));
            }catch(e) {
                socket.destroy();
                return;
            }
            wss.handleUpgrade(request, socket, head, function(ws) {
                wss.emit('connection', ws, request);
            });
        });
    });
}