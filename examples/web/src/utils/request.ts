import HttpRequest from "../../../../src/request";

let httpRequest = new HttpRequest({
    baseURL: 'http://127.0.0.1:8888',
    needHeaderToken: true,
    enableRefreshToken: true,
    processHeaderToken(config) {
        Object.assign(config.headers, {
            Authorization: localStorage.getItem('token')||''
        })
    },
    async processRefreshTokenLogic() {
        await httpRequest.get('/refreshToken', {}, {
            enableRefreshToken: false
        });
        localStorage.setItem('token', '1')
    }
});

export default httpRequest