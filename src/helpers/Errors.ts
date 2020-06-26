import {NotFound, BadRequest, Conflict, Unauthorized} from 'ts-httpexceptions';

import {HttpErrors} from './HttpError';
/**
 * HTTP Errors Base
 */
class TSErrorsBase {
    // HTTP Exceptions
    public NotFound = NotFound;
    public BadRequest = BadRequest;
    public Conflict = Conflict;
    public Unauthorized = Unauthorized;
    // Codes
    public errors = HttpErrors;
}

export default TSErrorsBase;