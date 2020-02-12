export interface UserMessages {
    messageId: number;
    /**
     * Sender's User ID
     */
    userId: number;
    subject: string;
    body: string;
    date: string;
    read: read;
}

export enum read {
    false = 0,
    true = 1,
}