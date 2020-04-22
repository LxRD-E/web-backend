export interface ChatMessage {
    chatMessageId: number;
    userIdFrom: number;
    userIdTo: number;
    content: string;
    dateCreated: string;
    read: MessageRead;
}
export enum MessageRead {
    false = 0,
    true = 1,
}

export interface IChatMessageCallbacks {
    userIdTo: number;
    callback: (arg1: any) => any;
    connected: boolean;
}

export interface IChatMessageDisconnector {
    disconnect: () => void;
}