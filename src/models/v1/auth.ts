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
    @Example([1, 12, 2000])
    birth: number[];
    @PropertyType(String)
    captcha: string;
    @PropertyType(Number)
    @Description('User referral ID')
    referralId?: number;
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
    isTwoFactorRequired: boolean;
    @PropertyType(String)
    twoFactor: string;
}

export class LoginTwoFactorResponseOK {
    @Required()
    userId: number;
    @Required()
    username: string;
}

export class GenerateAuthenticationCodeResponse {
    @Required()
    @Description('The JWT that should be POSTed to /v1/auth/validate-authentication-code')
    code: string;
}

export class ValidateAuthenticationCodeResponse {
    @Required()
    @Description('The userId of the user')
    userId: number;
    @Required()
    @Description('The username of the user')
    username: string;
    @Required()
    @Description('The timestamp of when the code was created at')
    iat: number;
}

export class CookieConsentInformation {
    @Required()
    @Description('Signifies consent to googleAnalytics')
    public googleAnalytics: boolean;
}

export class UserCountryResponse {
    @Required()
    @Description('User country or "UNKNOWN"')
    country: string;
    @Required()
    cookiePromptRequired: boolean;
}