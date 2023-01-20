import {AxiosInterceptorObject, AxiosUltraRequestConfigOption} from "../type";
import {AxiosError} from "axios";
import HttpRequest from "../request";

const createTokenInterceptor = function (httpRequest: HttpRequest) {

    //token是否刷新成功
    let refreshSuccess = false;
    //刷新中状态
    let refreshing = false;

    const axiosInstance = httpRequest.axiosInstance;

    //暂存回调队列
    const callbacks = [] as Function[];

    const addCallback = (cb) => {
        return new Promise((resolve, reject) => {
            callbacks.push(async () => {
                try {
                    resolve(await cb())
                } catch (e) {
                    reject(e)
                }
            })
        })
    }

    return {
        //配置请求拦截
        async requestInterceptor(config: AxiosUltraRequestConfigOption) {
            //处理token
            const processToken = async (config) => {
                if (!config.needHeaderToken) {
                    return config;
                }
                await config.processHeaderToken?.(config);
                return config;
            }
            //正在刷新中
            if (refreshing && config.enableRefreshToken) {
                return addCallback(async () => await processToken({...config}))
            }
            return processToken({...config});
        },
        async responseInterceptor(response) {
            if (response instanceof AxiosError) throw response;
            return response;
        },
        //响应catch
        async responseInterceptorCatch(error) {
            const finalConfig = error.config;
            // console.log(error)
            const response = error?.response;
            if (!response
                || !finalConfig.enableRefreshToken
                || typeof finalConfig.processRefreshTokenLogic != 'function'
                || response.status !== 401
            ) {
                throw error;
            }
            //正在刷新中 添加到返回新的promise 并等待刷新完成，重新请求
            if (refreshing) {
                console.log('401 response ' + finalConfig.url);
                console.log('token刷新中，存入回调队列 ' + finalConfig.url)
                return await addCallback(async () => await axiosInstance.request({...finalConfig, __IS_REFRESH_CALLBACK_REQUEST__: true}))
            }
            //刷新成功
            if (refreshSuccess) {
                console.log('被拦截后发现token已刷新 直接请求' + finalConfig.url)
                return await axiosInstance.request({...finalConfig, __IS_REFRESH_CALLBACK_REQUEST__: true})
            }
            refreshSuccess = false;
            console.log('遇到第一个401请求 ' + finalConfig.url)
            //设置刷新中标记
            refreshing = true;
            //执行刷新token请求 执行重试策略
            for (let i = 0; i < (finalConfig.refreshTokenRetryCount || 0) + 1; i++) {
                try {
                    await finalConfig.processRefreshTokenLogic({enableRefreshToken: false});
                    refreshSuccess = true;
                    console.log('token刷新完毕')
                    break;
                } catch (e) {
                    refreshSuccess = false;
                }
            }
            refreshing = false;
            console.log('唤醒所有被401拦截的请求', callbacks)
            callbacks.forEach(cb => cb());
            //清空回调队列
            callbacks.length = 0;
            return await axiosInstance.request({...finalConfig, __IS_REFRESH_CALLBACK_REQUEST__: true})
        }
    } as AxiosInterceptorObject
}

export default createTokenInterceptor







