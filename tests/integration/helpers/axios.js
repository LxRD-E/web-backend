const axiosLib = require('axios').default;
const axiosCookieJarSupport = require('axios-cookiejar-support').default;
const tough = require('tough-cookie');
const crypto = require('crypto');

/**
 * @returns {axiosLib}
 * @param opts
 * @returns {AxiosInstance}
 */
const getAxios = (opts) => {
    const cookieJar = new tough.CookieJar();
    let port = process.env.PORT || 3000;
    let conf = {
        headers: {
            'x-ratelimit-bypass': crypto.randomBytes(16).toString('hex'),
            'cf-connecting-ip': crypto.randomBytes(16).toString('hex'),
            'accept': 'application/json',
        },
        jar: cookieJar,
        baseURL: 'http://localhost:'+port+'/api/v1/',
        withCredentials: true,
        validateStatus: function (status) {
            // return status >= 200 && status < 300; // default
            return status !== 403;
        },
    }
    if (opts) {
        for (const item of Object.getOwnPropertyNames(opts)) {
            conf[item] = opts[item];
        }
    }
    let csrf = '';
    let axios = axiosLib.create(conf);
    axiosCookieJarSupport(axios);
    axios.defaults.jar = cookieJar;
    axios.interceptors.request.use(
        config => {
            config.headers['x-csrf-token'] = csrf;
            return config;
        }
    );
    axios.interceptors.response.use(
        response => {
            return response;
        },
        error => {
            let errorResponse = error.response;
            if (errorResponse && errorResponse.status === 403 && errorResponse.data && errorResponse.data.error && errorResponse.data.error.code === 'CSRFValidationFailed') {
                // axios.interceptors.response.eject(this.axiosResponseInterceptor);
                errorResponse.config.headers['x-csrf-token'] = errorResponse.headers['x-csrf-token'];
                csrf = errorResponse.headers['x-csrf-token'];
                return axios(errorResponse.config);
            }
            return Promise.reject(error);
        }
    );
    return axios;
}
module.exports = getAxios;