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