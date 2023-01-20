import {AxiosInterceptorObject, AxiosUltraErrorMessageOption, AxiosUltraLoadingOption, AxiosUltraMessageOption, AxiosUltraRequestConfigOption, AxiosUltraSuccessMessageOption} from "../type";
import {AxiosError} from "axios";
import HttpRequest from "../request";

const createMessageInterceptor = function (httpRequest: HttpRequest) {

    //处理提示参数
    const processMessageOptions = (message?: AxiosUltraMessageOption | boolean | string, defaultMessage?: string) => {
        let finalMessage = {error: false, success: false} as AxiosUltraMessageOption;
        if (typeof message == "boolean" && message) {
            Object.assign(finalMessage, {
                success: true,
                error: true,
            })
        }
        if (typeof message == "object") {
            Object.assign(finalMessage, message);
        }
        if (finalMessage.success == true) {
            finalMessage.success = {title: defaultMessage || '操作成功'}
        }
        if (typeof finalMessage.success == 'string') {
            finalMessage.success = {title: finalMessage.success}
        }
        if (finalMessage.error == true) {
            finalMessage.error = {title: defaultMessage || '操作失败'}
        }
        if (typeof finalMessage.error == 'string') {
            finalMessage.error = {title: finalMessage.error}
        }
        return finalMessage;
    };

    //处理loading参数
    const processLoadingOptions = (loading?: AxiosUltraLoadingOption | boolean | string) => {
        if (typeof loading == "boolean" && loading) {
            return {title: "加载中..."};
        } else if (typeof loading == "string") {
            return {title: loading};
        } else if (typeof loading == "object") {
            return loading;
        }
        return false;
    };

    return {
        //配置请求拦截
        async requestInterceptor(config: AxiosUltraRequestConfigOption) {
            const loading = processLoadingOptions(config.loading);
            //如果不显示加载状态 或者是唤起的请求 则直接返回
            if (!loading || config.__IS_REFRESH_TOKEN_CALLBACK_REQUEST__) {
                return config;
            }
            config.closeLoading = config.toast?.loading(loading);
            return config;
        },
        async responseInterceptor(response) {
            const config = response.config as AxiosUltraRequestConfigOption;
            if (response instanceof Error) throw response;
            //获取全部响应
            if (config?.getResponse || config.__IS_REFRESH_TOKEN_CALLBACK_REQUEST__) {
                return response;
            }
            let data = response.data
            const message = config.getApiMessage?.(response);
            //解析message参数
            const messageOptions = processMessageOptions(config.message as AxiosUltraMessageOption, message);
            config?.closeLoading?.();
            //如果响应json才处理
            if ((config?.responseType || "json").toLocaleLowerCase() !== "json") {
                messageOptions.success && config.toast?.success(messageOptions.success as AxiosUltraSuccessMessageOption);
                return data;
            }
            //如果有直接获取成功状态下的token
            if (config?.getApiResponse && config?.getSuccessData && config?.isSuccess) {
                if (config?.isSuccess(response)) {
                    return config?.getSuccessData(response)
                }
                messageOptions.error && config.toast?.error(messageOptions.error as AxiosUltraErrorMessageOption);
                throw new AxiosError(data.message || '', response.config, config, response.request, response)
            }
            messageOptions.success && config.toast?.success(messageOptions.success as AxiosUltraSuccessMessageOption);
            return response.data;
        },
        //响应catch
        async responseInterceptorCatch(error: AxiosError) {
            const config = error.config as AxiosUltraRequestConfigOption;
            if (config.__IS_REFRESH_TOKEN_CALLBACK_REQUEST__) {
                throw error
            }
            if (config.getResponse) {
                throw error.response;
            }
            if (config.getApiResponse) {
                throw error.response?.data;
            }
            const message = config.getApiMessage?.(error.response);
            //解析message参数
            const messageOptions = processMessageOptions(config.message as AxiosUltraMessageOption, message);
            messageOptions.error && config.toast?.error(messageOptions.error as AxiosUltraErrorMessageOption);
            //关闭加载
            config.closeLoading?.();
            throw error;
        },
    } as AxiosInterceptorObject
}

export default createMessageInterceptor







