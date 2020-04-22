import {OnConnect, SocketController, ConnectedSocket, OnDisconnect, MessageBody, OnMessage} from "socket-controllers";

import controller from '../../controllers/controller';

@SocketController()
export class ChatController extends controller {
    @OnConnect()
    public connection(@ConnectedSocket() socket: any) {
        console.log("client connected");
    }
    @OnDisconnect()
    public disconnect(@ConnectedSocket() socket: any) {
        console.log("client disconnected");
    }

    @OnMessage("save")
    public save(@ConnectedSocket() socket: any, @MessageBody() message: any) {
        console.log("received message:", message);
        console.log("setting id to the message and sending it back to the client");
        message.id = 1;
        socket.emit("message_saved", message);
    }
}