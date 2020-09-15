import * as Users from './user';
import { Property, PropertyType, Required } from '@tsed/common';
/**
 * User Email Model
 */
export interface EmailModel {
    emailId: number;
    userId: number;
    email: string | null;
    verificationCode: string;
    status: Users.emailVerificationType;
    date: Record<string, any>;
}

export class EmailModelForSettings {
    @PropertyType(String)
    email: null | string;
    @Required()
    status: number;
}

export class UserSettings {
    @PropertyType(String)
    blurb: string | null;
    @Required()
    tradingEnabled: number;
    @Required()
    theme: number;
    @Required()
    forumSignature: string | null;
    @Required()
    email: EmailModelForSettings;
    @Required()
    '2faEnabled': 0 | 1;
    @Required()
    birthDate: string;
}