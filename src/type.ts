/**
 * by zlm(执着)
 */
import {AxiosRequestConfig} from "axios";

/**
 * 接口响应
 */
export interface AxiosUltraAPIResponse {

}

/**
 * 失败消息提示
 */
export interface AxiosUltraErrorMessageOption {
    title: string
}

/**
 * 成功消息提示
 */
export interface AxiosUltraSuccessMessageOption {
    title: string
}

/**
 * 消息提示
 */
export type AxiosUltraMessageOption = {
    error?: AxiosUltraErrorMessageOption | boolean | string;
    success?: AxiosUltraSuccessMessageOption | boolean | string;
}


/**
 * loading
 */
export interface AxiosUltraLoadingOption {
    title: string
}

/**
 * 消息提示 接口
 */
export type AxiosUltraToast = {
    /**
     * 成功提示
     * @param option
     */
    success(option: AxiosUltraSuccessMessageOption);
    /**
     * 错误提示
     * @param option
     */
    error(option: AxiosUltraErrorMessageOption);
    /**
     * 加载提示，返回关闭方法
     * @param option
     */
    loading(option: AxiosUltraLoadingOption): () => void;
}

export interface AxiosInterceptorObject {
    /**
     * 请求拦截
     * @param config
     */
    requestInterceptor?: (config: any) => Promise<any>;
    requestInterceptorCatch?: (err: any) => Promise<any>;
    /**
     * 响应拦截
     * @param response
     */
    responseInterceptor?: (response: any) => Promise<any>;
    responseInterceptorCatch?: (err: any) => Promise<any>;
}

//请求参数
export interface AxiosUltraRequestConfigOption extends AxiosRequestConfig, Record<string, any> {
    /**
     * 是否loading
     */
    loading?: AxiosUltraLoadingOption | string | boolean;
    /**
     * 是否消息提示
     */
    message?: AxiosUltraMessageOption | string | boolean;
    /**
     * 提示配置 桥接
     */
    toast?: AxiosUltraToast;
    /**
     * 外部传入是否请求成功
     * @param resp
     */
    isSuccess?: (resp: any) => Boolean;
    /**
     * 是否获取api响应的数据
     */
    getApiResponse?: boolean;
    /**
     * 是否含有完整的http响应（一般用于获取头部信息的请求）
     */
    getResponse?: boolean;
    /**
     * 成功情况下获取data
     * @param resp
     */
    getSuccessData?: (resp: any) => any;
    /**
     * 获取接口消息提示
     * @param resp
     */
    getApiMessage?: (resp: any) => string;
    /**
     * 拦截器
     */
    interceptor?: AxiosInterceptorObject;

    /**
     * 是否需要token
     */
    needHeaderToken?: boolean;
    /**
     * 处理
     * @param config
     */
    processHeaderToken?: (config: AxiosUltraRequestConfigOption) => void;
    /**
     * token刷新重试
     */
    refreshTokenRetryCount?: number;
    /**
     * 开启刷新token
     */
    enableRefreshToken?: boolean;
    /**
     * 处理刷新token逻辑
     * @param defaultOptions
     */
    processRefreshTokenLogic?: (defaultOptions: AxiosUltraRequestConfigOption) => void | Promise<void>;
    /**
     * 刷新回调队列标记
     */
    __IS_REFRESH_TOKEN_CALLBACK_REQUEST__?: boolean
}