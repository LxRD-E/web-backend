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