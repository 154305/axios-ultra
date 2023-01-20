import HttpRequest from "../../../../src/request";
import {AxiosUltraErrorMessageOption, AxiosUltraLoadingOption, AxiosUltraSuccessMessageOption, AxiosUltraToast} from "../../../../src/type";
import {message} from 'antd'

let httpRequest = new HttpRequest({
    baseURL: '/api',
    needHeaderToken: true,
    enableRefreshToken: true,
    processHeaderToken(config) {
        Object.assign(config.headers, {
            Authorization: localStorage.getItem('token') || ''
        })
    },
    //处理刷新token逻辑
    async processRefreshTokenLogic(defaultOptions) {
        await httpRequest.get('/refreshToken', {}, defaultOptions);
        localStorage.setItem('token', '1')
    },
    toast: {
        loading(option: AxiosUltraLoadingOption) {
            return message.loading({
                content: option.title,
                duration: 999999
            })
        },
        success(option: AxiosUltraSuccessMessageOption) {
            message.success({
                content: option.title,
            })
        },
        error(option: AxiosUltraErrorMessageOption) {
            message.error({
                content: option.title,
            })
        },
    }
});

export default httpRequest