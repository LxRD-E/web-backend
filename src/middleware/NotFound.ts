import { Middleware, Res, Req } from "@tsed/common";
import * as Express from "express";
import { ErrorTemplate } from '../helpers/HttpError';

@Middleware()
export class NotFoundMiddleware {
    use(
        @Req() request: Express.Request,
        @Res() response: Express.Response
    ) {
        if (request.accepts('html')) {
            response.status(404).send(ErrorTemplate('404: Page Not Found', 'The page you tried to visit does not exist. Please go back and try again.')).end();
        }else{
            response.status(404).json({success: false, error: {code: 'NotFound'}});
        }
    }
}