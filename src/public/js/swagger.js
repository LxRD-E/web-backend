const constantMock = window.fetch;
window.fetch = function () {
    console.log(arguments);
    return new Promise((res, rej) => {
        // Get the parameter in arguments
        // Intercept the parameter here 
        constantMock.apply(this, arguments)
            .then(d => {
                if (d.status === 403) {
                    arguments[1]['headers']['x-csrf-token'] = d.headers.get('x-csrf-token');
                    constantMock.apply(this,arguments)
                    .then(d => {
                        res(d);
                    })
                    .catch(e => {
                        rej(e);
                    })
                }else{
                    return res(d);
                }
                
            })
            .catch(e => {
                console.log('rej');
                rej(e);
            })
            .finally(() => {
                console.log('finally');
            })
    });
}

// setup title
let inetval = setInterval(() => {
    let ite = document.getElementsByClassName('title')[0];
    if (!ite) {
        console.log('no title');
        return;
    }
    ite.textContent = 'Hindi Gamer Club API';
    clearInterval(inetval);
}, 100);
let seenWarning = localStorage.getItem('seen_suicide_warning');
if (seenWarning !== 'true') {
    alert(`If someone tells you to go here and enter/paste something, they are trying to scam you. Report them and do not enter anything here unless you know what you are doing.`);

    localStorage.setItem('seen_suicide_warning', 'true');
}
let initDesc = setInterval(() => {
    let ite = document.getElementsByClassName('description')[0];
    if (!ite) {
        return console.log('no desc');
    }
    ite.innerHTML = `<h3><span style="font-weight:600;">NOTICE:</span> If someone tells you to go here and enter/paste something, they are trying to scam you. Report them and do not enter anything here unless you know what you are doing.</h3>
    <br>
    This is the official Hindi Gamer Club Web API Documentation. It uses Swagger, so you can use various auto-generating tools to auto-generate an API Wrapper in your favorite language. We believe we have reached a point where most of these endpoints will remain stable and they likely won't be changed without warning. This description of our API is written assuming you know how things like Cookies and HTTP Requests work. If you don't, you should read up on how those work first before continuing.
    <br>
    <h5>Base URL</h5>
    The base URL of all api endpoints is "https://hindigamer.club/".
    <br>
    <h5>Sessions</h5>
    The "rblxsession" cookie saved to your browser authenticates you as the user you are currently logged in as. We do not currently offer a OAUTH-style solution but we will be looking into a solution like that soon. For now, in order to create a bot account, you will have to manually create an account and save this cookie somewhere. Remember: You should not share this cookie with anyone as it will give them access to your account.
    <h5>Two-Factor Authentication</h5>
    If you have 2FA enabled on your account, it will be difficult to use it as a bot since certain endpoints may occasionally ask for a 2FA code (for security purposes). For this reason, you are advised to create a seperate account to use as your bot account. Some endpoints that currently may ask for a 2FA code are:
    <ul>
        <li>POST /api/v1/group/{groupId}/transfer</li>
        <li>PUT /api/v1/group/{groupId}/payout</li>
        <li>POST /api/v1/economy/{id}/buy</li>
        <li>POST /api/v1/economy/trades/{id}/</li>
        <li>PUT /api/v1/user/{userId}/trade/request</li>
    </ul>
    <h5>CSRF Token</h5>
    We will be looking into implmenting a custom authentication solution for bot accounts so that you do not need to fetch a CSRF token, but until then, we will be requiring you to use a CSRF token when making most non-get requests. If you recieve a response of "403" with an error.code of "CsrfValidationFailed", it means that you will need to grab the "x-csrf-token" header from the response, and then retry your request with a "x-csrf-token" header containing the code from the failed request. For instance, if your response looked like this:
    <br>
    <code>HTTP 1.1/403 Forbidden<br>
    x-csrf-token: 1234<br>
    <br>
    {"success": false, "error": {"code": "CsrfValidationFailed"}}
    </code>
    <br>
    You'd need to grab "1234" from the response header, and create a new request with "x-csrf-token" in the header. CSRF tokens expire after 5 minutes, so you will regularly recieve this response when making requests.
    <h5>Content-Type & Accept Header</h5>
    Due to the way our API works, we do not always expose JSON and will instead display HTML if there is no "accepts" header or the "accepts" header allows HTML. For instance, you will never recieve "LoginRequired" on endpoints that require a login and will simply recieve a 302 redirect to "/login". You should always specify "accept: application/json" as it will make debugging much easier.
    <h5>Error Handling</h5>
    Most errors have a dedicated response code. An example of an error code is "LogoutRequired", indiciating that you can only use the endpoint you tried to use after logging out. For instance, an error response body might look like this:
    <br>
    <code>
    {<br>
    &emsp;"success": false,<br>
    &emsp;"error": {<br>
    &emsp;&emsp;"code": "InternalServerError"<br>
    &emsp;}<br>
    }<br>
    </code>
    <br>
    In this error, the error code is "InternalServerError". We document our error codes in (what we believe is) a very easy to understand way. For instance, you might see something like this on the API docs below:
    <br>
        <img style="width:100%;display:block;margin:0 auto;max-width:1000px;" src="https://cdn.hindigamer.club/static/api-docs-screen-1.png" />
    </br>
    In the above example, "TooManyRequests" would appear as the error code (error.code) and there is a short message documenting what the error code means. "429" would also be the Response Status Code. We do not include an error message in responses for localization reasons, as well as to save bandwidth.
    <br>
    <h5>Limits & Offsets</h5>
    Most endpoints that can return an unknown amount of data, such as number of groups a user is in or number of threads on a forum subcategory, will have basic pagination. You can add "offset={offsetNumberHere}&limit={limitNumberHere}" to the query parameters in order to paginate through responses. The maximum limit you can set is "100", while the default (in most cases) is also 100. Some endpoints may have custom pagination info, so make sure to read the description of the endpoint for more info.
    <br>
    <h5>5XX Errors</h5>
    Since we use Cloudflare, you should anticipate any 5XX-level errors (such as 522, 520, etc, as well as traditional 500 codes like 500, 504, 502, etcs). Generally, if a response status code is 500 or higher, something's wrong with Hindi Gamer Club and we're probably working on fixing the site.
    <br>
    <h5>"Unauthorized" Error Code</h5>
    If you start recieving a 403 error with code "Unauthorized" on most endpoints, your account has been disabled (or terminated/banned) and you will have to manually login to view the moderation note.
    <br>
    <h5>Web-Scraping</h5>
    We do not recommend web-scraping HTML pages as it costs both of us a lot of bandwidth. If you must web-scrape, note that pages and URLs may change at any time.
    <br>
    <h5>Websockets</h5>
    Websocket endpoints are not documented.
    <br>
    <h5>Metadata Endpoints</h5>
    Some endpoints may have metadata attached to them. These endpoints will have metadata in the URL (such as "/api/v1/economy/metadata/sell-fee"). For instance, the maximum price an item can be listed for, or the maximum amount of groups a user is in. We do this so that we can increase/decrease the value for certain users, such as if the user purchased a group count increase (if we were to add that as a feature in the future), or if we do A/B testing, etc. You should always check the metadata endpoints with your account cookie in order to get the metadata for your specific account.
    <br>
    <h5>Missing Documentation</h5>
    Not all endpoints have documentation right now. We are working to add documentation to all endpoints. If an endpoint does not show up here but you know it exists, it has either been deprecated or was purposely left undocumented and we don't recommend you use it.
    <br>
    <h5>Captchas</h5>
    Some endpoints may require captcha verification to prevent spam. We do not currently have a way to disable captchas for "good bots".
    <br>
    <h5>Questions</h5>
    If you have any questions, you are free to join our <a href="/discord">Discord Server</a> and ask us.
    <br>
    <br>
    Note that you need to <a href="/terms">read and agree to our terms of service</a> before using our API in your project. If you do not agree to our terms of service, you are not allowed to use our API.
    `;
    clearInterval(initDesc);
}, 100);