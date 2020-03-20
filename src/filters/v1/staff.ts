import { Filter, IFilter, ParamRegistry } from "@tsed/common";

@Filter()
export class AuthUserFilter implements IFilter {
    transform(expression: string, request: Express.Request, response: Express.Response) {
        console.log('transform expression called')
        console.log(expression);
        return (request as any).authUser
    }
}

export function AuthUser(): Function {
    console.log('paramregistry.decorate');
    return ParamRegistry.decorate(AuthUserFilter);
}