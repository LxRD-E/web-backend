import { HttpErrors } from '../helpers/HttpError';

import * as Sentry from '../helpers/sentry';

const logError = (status: number, code: string, path: string, method: string) => {
    if (process.env.NODE_ENV === 'production') {
        return;
    }
    return console.log('[' + method.toUpperCase() + '] ' + path + ' [' + status.toString() + '] - ' + code);
}

import { Err, GlobalErrorHandlerMiddleware, OverrideProvider, Req, Res } from "@tsed/common";
@OverrideProvider(GlobalErrorHandlerMiddleware)
export class MyGEHMiddleware extends GlobalErrorHandlerMiddleware {

    use(@Err() error: any, @Req() request: Req, @Res() response: Res): any {
        if (error && error.message && error.message === 'LogoutRequired' && request.accepts('html')) {
            logError(302, 'LogoutRequired', request.originalUrl, request.method);
            return response.redirect('/');
        }
        try {
            // DO SOMETHING
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
                logError(400, error.message, request.originalUrl, request.method);
                if (request.accepts('json') && !request.accepts('html')) {
                    return response.status(400).json({ success: false, error: fullErrorMessage })
                } else {
                    if (process.env.NODE_ENV === 'development') {
                        return response.status(400).set('content-type', 'text/plain').send(error.stack).end()
                    }
                    return response.status(400).json({ success: false, error: fullErrorMessage })
                }
            } else if (error.name === 'NOT_FOUND') {
                logError(404, 'NOT_FOUND', request.originalUrl, request.method);
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
                logError(409, fullErrorMessage.code, request.originalUrl, request.method);
                return response.status(409).json({ success: false, error: fullErrorMessage })
            } else if (error.name === 'UNAUTHORIZED') {
                if (error.message === 'AccountBanned') {
                    return response.status(401).json({
                        success: false,
                        error: {
                            code: 'AccountBanned',
                        }
                    })
                }
                let fullErrorMessage = {
                    code: 'LoginRequired',
                }
                if (error.message && HttpErrors[error.message]) {
                    fullErrorMessage.code = error.message;
                }
                logError(401, fullErrorMessage.code, request.originalUrl, request.method);
                return response.status(401).json({ success: false, error: fullErrorMessage })
            } else if (error.name === 'FORBIDDEN') {
                let fullErrorMessage = {
                    code: 'CsrfValidationFailed',
                }
                if (error.message && HttpErrors[error.message]) {
                    fullErrorMessage.code = error.message;
                }
                return response.status(403).json({ success: false, error: fullErrorMessage })
            } else {
                throw error;
            }
        } catch (e) {
            console.error(e);
            // Log exception
            if (Sentry.isEnabled()) {
                Sentry.Sentry.captureException(e);
            }
        }

        // default if internal error / something goes wrong in error handler
        return response.status(500).json({ success: false, message: 'An internal server error has occurred.', error: { code: HttpErrors[HttpErrors.InternalServerError] } });
        // this exposes stack trace, so do not uncomment
        // return super.use(error, request, response);
    }
}