import {AxiosInterceptorObject} from "../type";
import {AxiosError, AxiosInstance, AxiosRequestConfig} from "axios";

//token拦截option
export interface TokenInterceptorOption {
    //是否需要token
    needHeaderToken?: boolean,
    //处理
    processHeaderToken?: (config: TokenInterceptorOption & AxiosRequestConfig) => void;
    //token刷新重试
    refreshTokenRetryCount?: number;
    //开启刷新token
    enableRefreshToken?: boolean;
    //处理刷新token逻辑
    processRefreshTokenLogic?: () => void | Promise<void>;
}

const createTokenInterceptor = function (axiosInstance: AxiosInstance) {

    let refreshSuccess = false;
    let refreshing = false;

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
        async requestInterceptor(config: TokenInterceptorOption & AxiosRequestConfig) {
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
            if (!response || !finalConfig.enableRefreshToken || typeof finalConfig.processRefreshTokenLogic != 'function') {
                return Promise.reject(error);
            }
            //401状态
            if (response.status === 401) {
                //正在刷新中 添加到返回新的promise 并等待刷新完成，重新请求
                if (refreshing) {
                    console.log('401 response ' + finalConfig.url);
                    console.log('token刷新中，存入回调队列 ' + finalConfig.url)
                    return addCallback(async () => await axiosInstance?.request({...finalConfig}))
                }
                if (refreshSuccess) {
                    console.log('被拦截后发现token以刷新 直接请求' + finalConfig.url)
                    return axiosInstance.request({...finalConfig})
                }
                refreshSuccess = false;
                console.log('遇到第一个401请求 ' + finalConfig.url)
                //设置刷新中标记
                refreshing = true;
                //执行刷新token请求 执行重试策略
                for (let i = 0; i < (finalConfig.refreshTokenRetryCount || 0) + 1; i++) {
                    try {
                        await finalConfig.processRefreshTokenLogic();
                        refreshSuccess = true;
                        console.log('token刷新完毕')
                        break;
                    } catch (e) {
                        refreshSuccess = false;
                    }
                }
                refreshing = false;
                console.log('唤醒所有被401拦截的请求')
                callbacks.forEach(cb => cb());
                //清除callbacks
                callbacks.length = 0;
                return axiosInstance.request({...finalConfig})
            }
            return Promise.reject(error)
        }
    } as AxiosInterceptorObject
}

export default createTokenInterceptor







