import WebSocket =  require('ws');
import {parser} from './session';
import * as http from 'http';
import * as querystring from 'querystring';
import * as crypto from 'crypto';
import { Request, Response } from 'express';
import * as Auth from '../dal/auth';

export const wss = new WebSocket.Server({
    noServer: true,
});

export const webSocketServer = http.createServer();
webSocketServer.on('error', err => {
    // Ignore, for now
    console.error(err);
});
webSocketServer.listen(process.env.WS_PORT || 8080);

export default (): void => {
    webSocketServer.on('upgrade', function upgrade(request, socket, head) {
        console.error('websocket request started.');
        if(request.url.match(/\/game-sockets\/websocket.aspx/g)) {
            console.error('websocket request is for game-sockets');
            let decodedAuth: any;
            try {
                const queryinurl = request.url.slice(request.url.indexOf('?')+1, request.url.length);
                const query = querystring.parse(queryinurl);
                const authCode = query['gameAuth'];
                if (!authCode || typeof authCode !== 'string') {
                    socket.destroy();
                    return;
                }
                decodedAuth = Auth.decodeGameAuthCode(authCode);
                request.url = request.url.slice(0, request.url.indexOf('?'));
            }catch(e) {
                socket.destroy();
                return;
            }
            wss.handleUpgrade(request, socket, head, function(ws) {
                wss.emit('connection', ws, request, decodedAuth);
            });
        }else{
            console.error('websocket request is for chat');
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
        }
        /*
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
        */
    });
}