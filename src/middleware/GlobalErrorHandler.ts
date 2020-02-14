import { HttpErrors, ErrorTemplate } from '../helpers/HttpError';

import { Err, GlobalErrorHandlerMiddleware, OverrideProvider, Req, Res } from "@tsed/common";
@OverrideProvider(GlobalErrorHandlerMiddleware)
export class MyGEHMiddleware extends GlobalErrorHandlerMiddleware {

    use(@Err() error: any, @Req() request: Req, @Res() response: Res): any {
        if (error && error.message && error.message === 'LogoutRequired' && request.accepts('html')) {
            return response.redirect('/');
        }
        try {
            // DO SOMETHING
            console.log(error);
            if (error.name === 'BAD_REQUEST') {
                let fullErrorMessage;
                if (error.errorMessage) {
                    fullErrorMessage = {
                        location: error.requestType,
                        message: error.errorMessage.replace(/\n/g, ' '),
                        code: HttpErrors[HttpErrors.SchemaValidationFailed],
                    };
                } else {
                    fullErrorMessage = {
                        code: HttpErrors[HttpErrors.SchemaValidationFailed],
                    }
                }
                if (error.message && HttpErrors[error.message]) {
                    fullErrorMessage.code = error.message;
                }
                return response.status(400).json({ success: false, error: fullErrorMessage })
            } else if (error.name === 'NOT_FOUND') {
                if (request.accepts('html')) {
                    return response.status(404).send(ErrorTemplate('404: Not Found', 'The page you tried to view does not seem to exist.')).end();
                }
                if (error.message && HttpErrors[error.message]) {
                    return response.status(404).json({ success: false, error: { code: error.message } });
                }
                return response.status(404).json({ success: false, error: { code: HttpErrors[HttpErrors.PageNotFound] } });
            } else if (error.name === 'CONFLICT') {
                let fullErrorMessage = {
                    code: HttpErrors[HttpErrors.InternalServerError],
                }
                if (error.message && HttpErrors[error.message]) {
                    fullErrorMessage.code = error.message;
                }
                return response.status(409).json({ success: false, error: fullErrorMessage })
            } else if (error.name === 'UNAUTHORIZED') {
                if (request.accepts('html')) {
                    response.redirect('/login');
                } else if (request.accepts('json')) {
                    let fullErrorMessage = {
                        code: 'LoginRequired',
                    }
                    if (error.message && HttpErrors[error.message]) {
                        fullErrorMessage.code = error.message;
                    }
                    return response.status(401).json({ success: false, error: fullErrorMessage })
                } else {
                    return response.status(415).json({ success: false, error: { code: HttpErrors[HttpErrors.InvalidAcceptHeader] } });
                }
            } else if (error.name === 'FORBIDDEN') {
                if (request.accepts('json')) {
                    let fullErrorMessage = {
                        code: 'CsrfValidationFailed',
                    }
                    if (error.message && HttpErrors[error.message]) {
                        fullErrorMessage.code = error.message;
                    }
                    return response.status(403).json({ success: false, error: fullErrorMessage })
                } else {
                    return response.status(415).json({ success: false, error: { code: HttpErrors[HttpErrors.InvalidAcceptHeader] } });
                }
            } else {

            }
        } catch (e) {
            // Log exception
            console.log(e);
        }

        // default if internal error / something goes wrong in error handler
        if (request.accepts('html')) {
            return response.status(500).send(ErrorTemplate('500: Internal Server Error', 'Hindi Gamer Club seems to be experiencing some issues right now. Please try again later.')).end();
        } else if (request.accepts('json')) {
            return response.status(500).json({ success: false, message: 'An internal server error has ocurred.', error: { code: HttpErrors[HttpErrors.InternalServerError] } });
        } else {
            return response.status(415).json({ success: false, error: { code: HttpErrors[HttpErrors.InvalidAcceptHeader] } });
        }
        // this exposes stack trace, so do not uncomment
        // return super.use(error, request, response);
    }
}