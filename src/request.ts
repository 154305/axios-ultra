import axios, {AxiosInstance, AxiosRequestConfig} from "axios";
import adapter from './adapter';
import createTokenInterceptor, {TokenInterceptorOption} from "./interceptors/TokenInterceptor";

/**
 * by zlm(执着)
 */
//消息提示
export type Message =
    | boolean
    | {
    error?: boolean | string;
    success?: boolean | string;
};
// loading
export type Loading = any | string | boolean;

export interface RequestInterceptor {
    // 请求拦截
    requestInterceptor?: (config: RequestConfigOption) => RequestConfigOption;
    requestInterceptorCatch?: (err: any) => any;
    // 响应拦截
    responseInterceptor?: (response: any) => any;
    responseInterceptorCatch?: (err: any) => any;
}

//请求参数
export interface RequestConfigOption extends AxiosRequestConfig, Record<string, any> {
    //是否loading
    loading?: Loading;
    //是否消息提示
    message?: Message;
    //外部传入是否请求成功
    isSuccess?: (resp: any) => Boolean;
    //是否获取api响应的数据
    getApiResponse?: boolean;
    //是否含有完整的http响应（一般用于获取头部信息的请求）
    getResponse?: boolean;
    //成功情况下获取data
    getSuccessData?: (resp: any) => any;
    //拦截器
    interceptor?: RequestInterceptor;
}

// //处理提示参数
const processMessageOptions = (message: Message) => {
    if (typeof message == "boolean") {
        return {error: message, success: message};
    } else if (typeof message == "object") {
        return message;
    }
    return {error: false, success: false};
};

// //处理loading参数
const processLoadingOptions = (loading: Loading) => {
    if (typeof loading == "boolean" && loading) {
        return {lock: true, text: "加载中"};
    } else if (typeof loading == "string") {
        return {lock: true, text: loading};
    } else if (typeof loading == "object") {
        return loading;
    }
    return false;
};

//默认options
const defaultOptions = {
    //接口回调是否成功
    isSuccess(resp) {
        return resp.code == 200 || resp.success;
    },
    //获取成功情况下的data
    getSuccessData(resp) {
        return resp.data;
    },
    //不直接获取api响应的数据，而是获取成功后里面的data
    getApiResponse: true,
};

class HttpRequest<R> {
    //axios实例
    axiosInstance: AxiosInstance;
    //全局配置项
    private readonly options: RequestConfigOption;

    constructor(configOption: RequestConfigOption & TokenInterceptorOption = {}) {
        const options = Object.assign({}, defaultOptions, configOption);
        //实例化axios实例
        this.axiosInstance = axios.create(options);
        //不是普通web项目才添加adapter
        if (!(window && window.document)) {
            axios.defaults.adapter = adapter
        }
        //全局option
        this.options = options;

        //添加token刷新 拦截器
        this.addInterceptor(createTokenInterceptor(this.axiosInstance));

        //添加配置拦截器
        this.addInterceptor(options.interceptor || {});

    }

    //配置拦截器
    addInterceptor(interceptor: RequestInterceptor) {
        const noop = async (data) => {
            console.log(data)
            return data
        }
        // 使用实例拦截器
        this.axiosInstance.interceptors.request.use(interceptor.requestInterceptor , interceptor.requestInterceptorCatch );
        this.axiosInstance.interceptors.response.use(interceptor.responseInterceptor , interceptor.responseInterceptorCatch);
    }

    //基础请求
    request = async <A>(options?: RequestConfigOption): Promise<A> => {
        // @ts-ignore
        return this.axiosInstance.request(options)
    };

    get<Data = R>(url: string, params?: any, options?: RequestConfigOption) {
        return this.request<Data>({
            method: "get",
            url,
            params,
            ...options,
        });
    }

    post<Data = R>(url: string, params?: any, data?: any, options?: RequestConfigOption) {
        return this.request<Data>({
            method: "post",
            url,
            params,
            data,
            ...options,
        });
    }

    put<Data = R>(url: string, params?: any, data?: any, options?: RequestConfigOption) {
        return this.request<Data>({
            method: "put",
            url,
            params,
            data,
            ...options,
        });
    }

    delete<Data = R>(url: string, params?: any, options?: RequestConfigOption) {
        return this.request<Data>({
            method: "delete",
            url,
            params,
            ...options,
        });
    }
}

export default HttpRequest;
