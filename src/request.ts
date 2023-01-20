import axios, {AxiosResponse, AxiosInstance} from "axios";
import adapter from './adapter';
import createTokenInterceptor from "./interceptors/TokenInterceptor";
import {AxiosInterceptorObject, AxiosUltraAPIResponse, AxiosUltraRequestConfigOption} from "./type";
import createMessageInterceptor from "./interceptors/MessageInterceptor";
import {isGeneralWeb} from "./util";

//默认options
const defaultOptions = {
    //接口回调是否成功
    isSuccess(resp: AxiosResponse) {
        const data = resp.data;
        return data.code == 200 || data.success;
    },
    //获取成功情况下的data
    getSuccessData(resp: AxiosResponse) {
        return resp.data?.data;
    },
    //获取接口消息提示字符串
    getApiMessage(response) {
        const messageKeys = ['error_description', 'msg', 'message',];
        const messageDataArr = [response?.response?.data, response?.data, response]
        for (let i = 0; i < messageDataArr.length; i++) {
            for (let j = 0; j < messageKeys.length; j++) {
                let errorMessage;
                if (errorMessage = messageDataArr[i]?.[messageKeys[j]]) {
                    return errorMessage
                }
            }
        }
    },
    //不直接获取api响应的数据，而是获取成功后里面的data
    getApiResponse: true,
} as AxiosUltraRequestConfigOption;

export class HttpRequest<R = AxiosUltraAPIResponse> {
    /**
     * axios实例
     */
    axiosInstance: AxiosInstance;

    /**
     * 全局配置项
     */
    readonly options: AxiosUltraRequestConfigOption;

    constructor(configOption: AxiosUltraRequestConfigOption) {
        const options = Object.assign({}, defaultOptions, configOption);
        //实例化axios实例
        this.axiosInstance = axios.create(options);
        //不是普通web项目才添加adapter
        if (isGeneralWeb()) {
            axios.defaults.adapter = adapter
        }
        //全局option
        this.options = options;

        //添加消息提示
        this.addInterceptor(createMessageInterceptor(this));

        //添加token刷新 拦截器
        this.addInterceptor(createTokenInterceptor(this));

        //添加配置拦截器
        this.addInterceptor(options.interceptor || {});


    }

    /**
     * 配置拦截器
     * @param interceptor
     */
    addInterceptor(interceptor: AxiosInterceptorObject) {
        // 使用实例拦截器
        this.axiosInstance.interceptors.request.use(interceptor.requestInterceptor, interceptor.requestInterceptorCatch);
        this.axiosInstance.interceptors.response.use(interceptor.responseInterceptor, interceptor.responseInterceptorCatch);
    }

    /**
     * 基础请求
     * @param options
     */
    request = async <A>(options?: AxiosUltraRequestConfigOption): Promise<A> => {
        // @ts-ignore
        return this.axiosInstance.request(options)
    };


    /**
     * 获取
     * @param url
     * @param params
     * @param options
     */
    get<Data = R>(url: string, params?: any, options?: AxiosUltraRequestConfigOption) {
        return this.request<Data>({
            method: "get",
            url,
            params,
            ...options,
        });
    }


    /**
     * 提交
     * @param url
     * @param params
     * @param data
     * @param options
     */
    post<Data = R>(url: string, params?: any, data?: any, options?: AxiosUltraRequestConfigOption) {
        return this.request<Data>({
            method: "post",
            url,
            params,
            data,
            ...options,
        });
    }

    /**
     * 修改
     * @param url
     * @param params
     * @param data
     * @param options
     */
    put<Data = R>(url: string, params?: any, data?: any, options?: AxiosUltraRequestConfigOption) {
        return this.request<Data>({
            method: "put",
            url,
            params,
            data,
            ...options,
        });
    }

    /**
     * 删除
     * @param url
     * @param params
     * @param options
     */
    delete<Data = R>(url: string, params?: any, options?: AxiosUltraRequestConfigOption) {
        return this.request<Data>({
            method: "delete",
            url,
            params,
            ...options,
        });
    }

    /**
     * 为了兼适配小程序上传
     * @param url 上传url
     * @param options 上传选项
     */
    upload<Data = R>(url: string, options?: AxiosUltraRequestConfigOption & UniApp.UploadFileOption) {
        return this.request<Data>({
            method: "upload",
            url,
            ...options,
        });
    }
}

export default HttpRequest;
