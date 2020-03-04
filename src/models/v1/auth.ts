import { PropertyType, MinItems, MaxItems, Required } from "@tsed/common";
import { Example, Description } from "@tsed/swagger";

export class SignupRequest {
    @Required()
    username: string;
    @Required()
    password: string;
    @Required()
    @MinItems(3)
    @MaxItems(3)
    @PropertyType(Number)
    @Description('Format: Day, Month, Year')
    @Example([1,12,2000])
    birth: number[];
    @PropertyType(String)
    captcha: string;
}

export class UsernameChangedResponseOK {
    @Required()
    @Example(true)
    success: boolean;
    @Required()
    @Example('newUsername')
    newUsername: string;
}

export class SignupResponseOK {
    @Required()
    username: string;
    @Required()
    userId: number;
}

export class LoginRequestOK {
    @Required()
    userId: number;
    @Required()
    username: string;
    @Required()
    isTwoFactorRequied: boolean;
    @PropertyType(String)
    twoFactor: string;
}

export class LoginTwoFactorResponseOK {
    @Required()
    userId: number;
    @Required()
    username: string;
}