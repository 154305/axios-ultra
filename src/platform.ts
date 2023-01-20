import createError from 'axios/lib/core/AxiosError'
import {AxiosResponse, AxiosRequestConfig} from 'axios'

const enum EnumPlatForm {
    //微信
    wx = 'wx',
    //uniapp
    uni = 'uni',
    //taro
    taro = 'taro',
    //支付宝
    alipay = 'alipay',
    //百度
    bd = 'bd',
    //钉钉
    dd = 'dd',
}

let platFormName: EnumPlatForm = EnumPlatForm.wx

/**
 * 获取各个平台的请求函数
 */
export function getRequest() {
    switch (true) {
        case typeof wx === 'object':
            platFormName = EnumPlatForm.wx
            return wx.request.bind(wx)
        case typeof swan === 'object':
            platFormName = EnumPlatForm.alipay
            return swan.request.bind(swan)
        case typeof swan === 'object':
            platFormName = EnumPlatForm.alipay
            return swan.request.bind(swan)
        case typeof dd === 'object':
            platFormName = EnumPlatForm.dd
            // https://open.dingtalk.com/document/orgapp-client/send-network-requests
            return dd.httpRequest.bind(my)
        case typeof my === 'object':
            /**
             * remark:
             * 支付宝客户端已不再维护 my.httpRequest，建议使用 my.request。另外，dd客户端尚不支持 my.request。若在dd客户端开发小程序，则需要使用 my.httpRequest。
             * my.httpRequest的请求头默认值为{'content-type': 'application/x-www-form-urlencoded'}。
             * my.request的请求头默认值为{'content-type': 'application/json'}。
             * 还有个 dd.httpRequest
             */
            platFormName = EnumPlatForm.alipay
            return (my.request || my.httpRequest).bind(my)
        case typeof uni === 'object':
            platFormName = EnumPlatForm.uni
            return uni.request.bind(uni)
    }
}

/**
 * 获取各个平台的上传文件函数
 */
export function getUploadFile() {
    switch (true) {
        case typeof wx === 'object':
            platFormName = EnumPlatForm.wx
            return wx.uploadFile.bind(wx)
        case typeof swan === 'object':
            platFormName = EnumPlatForm.alipay
            return swan.uploadFile.bind(swan)
        case typeof swan === 'object':
            platFormName = EnumPlatForm.alipay
            return swan.uploadFile.bind(swan)
        case typeof dd === 'object':
            platFormName = EnumPlatForm.dd
            // https://open.dingtalk.com/document/orgapp-client/send-network-requests
            return dd.uploadFile.bind(my)
        case typeof my === 'object':
            /**
             * remark:
             * 支付宝客户端已不再维护 my.httpRequest，建议使用 my.request。另外，dd客户端尚不支持 my.request。若在dd客户端开发小程序，则需要使用 my.httpRequest。
             * my.httpRequest的请求头默认值为{'content-type': 'application/x-www-form-urlencoded'}。
             * my.request的请求头默认值为{'content-type': 'application/json'}。
             * 还有个 dd.httpRequest
             */
            platFormName = EnumPlatForm.alipay
            return my.uploadFile.bind(my)
        case typeof uni === 'object':
            platFormName = EnumPlatForm.uni
            return uni.uploadFile.bind(uni)
    }
}

/**
 * 处理各平台返回的响应数据，抹平差异
 * @param mpResponse
 * @param config axios处理过的请求配置对象
 * @param request 小程序的调用发起请求时，传递给小程序api的实际配置
 */
export function transformResponse(mpResponse, config: AxiosRequestConfig, mpRequestOption: any): AxiosResponse {
    const headers = mpResponse.header || mpResponse.headers
    const status = mpResponse.statusCode || mpResponse.status

    let statusText = ''
    if (status === 200) {
        statusText = 'OK'
    } else if (status === 400) {
        statusText = 'Bad Request'
    }

    const response: AxiosResponse = {
        data: mpResponse.data,
        status,
        statusText,
        headers,
        config,
        request: mpRequestOption
    }
    return response
}

/**
 * 处理各平台返回的错误信息，抹平差异
 * @param error 小程序api返回的错误对象
 * @param reject 上层的promise reject 函数
 * @param config
 */
export function transformError(error, reject, config) {
    switch (platFormName) {
        case EnumPlatForm.wx:
            if (error.errMsg.indexOf('request:fail abort') !== -1) {
                // Handle request cancellation (as opposed to a manual cancellation)
                reject(createError('Request aborted', config, 'ECONNABORTED', ''))
            } else if (error.errMsg.indexOf('timeout') !== -1) {
                // timeout
                reject(createError('timeout of ' + config.timeout + 'ms exceeded', config, 'ECONNABORTED', ''))
            } else {
                // NetWordError
                reject(createError('Network Error', config, null, ''))
            }
            break
        case EnumPlatForm.dd:
        case EnumPlatForm.alipay:
            // https://docs.alipay.com/mini/api/network
            if ([14, 19].includes(error.error)) {
                reject(createError('Request aborted', config, 'ECONNABORTED', '', error))
            } else if ([13].includes(error.error)) {
                // timeout
                reject(createError('timeout of ' + config.timeout + 'ms exceeded', config, 'ECONNABORTED', '', error))
            } else {
                // NetWordError
                reject(createError('Network Error', config, null, '', error))
            }
            break
        case EnumPlatForm.bd:
            reject(createError('Network Error', config, null, ''))
            break;
        default:
            reject(createError('Network Error', config, null, ''))
            break;
    }
}

/**
 * 将axios的请求配置，转换成各个平台都支持的请求config
 * @param config
 */
export function transformConfig(config) {
    if ([EnumPlatForm.alipay, EnumPlatForm.dd].includes(platFormName)) {
        config.headers = config.header
        delete config.header
        if (EnumPlatForm.dd === platFormName && config.headers?.["Content-Type"] === "application/json" && Object.prototype.toString.call(config.data) === '[object Object]') {
            // Content-Type为application/json时，data参数只支持json字符串，需要手动调用JSON.stringify进行序列化
            config.data = JSON.stringify(config.data)
        }
    }
    return config
}