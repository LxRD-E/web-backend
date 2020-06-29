import {NotFound, BadRequest, Conflict, Unauthorized, ServiceUnvailable as ServiceUnavailable} from 'ts-httpexceptions';

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
    public ServiceUnavailable = ServiceUnavailable;
    // Codes
    public errors = HttpErrors;
}

export default TSErrorsBase;