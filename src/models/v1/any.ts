import * as users from './user';
export interface SessionUserData {
    csrf: string;
    csrfExpire: object;
    id?: number;
    username?: string;
    passwordUpdated?: number;
}
export interface SessionOfLoggedInUser {
    /**
     * CSRF Token
     */
    csrf: string;
    /**
     * Date the CSRF Expires (usually 5 minutes after generation)
     */
    csrfExpire: object;
    /**
     * User's ID
     */
    id: number;
    /**
     * User's Name
     */
    username: string;
    passwordUpdated: number;
}
export interface UserInfoInterface {
    userId: number;
    username: string;
    passwordChange: number;
    banned: users.banned;
    theme: users.theme;
    primaryBalance: number;
    secondaryBalance: number;
    staff: users.staff;
}
export interface ContextObject {
    /**
     * Note: This only exists on Authenticated Routes. Can be undefined if authenticated middleware is not used
     */
    UserInfo: UserInfoInterface;
}